# ─────────────────────────────────────────────────────────────────────────────
# SupportCraft AI — multi-stage Docker build
#
# Stage 1 (deps)    – install all npm dependencies (dev + prod)
# Stage 2 (builder) – run `next build` and produce .next/standalone
# Stage 3 (runner)  – minimal production image (~200 MB)
#
# Build (preferred — reads all build args from .env.production automatically):
#   docker compose up --build
#
# Or manually:
#   docker build \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#     --build-arg NEXT_PUBLIC_APP_URL=https://supportcraft.aakasa.dev \
#     --build-arg NEXT_PUBLIC_PAYPAL_CLIENT_ID=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_MONTHLY=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_YEARLY=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_YEARLY=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS_YEARLY=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_YEARLY=... \
#     -t supportcraft-ai:latest .
#
# Run (preferred):
#   docker compose up --build
#
# Or manually:
#   docker run -p 3002:3002 --env-file .env.production supportcraft-ai:latest
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:24-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ─── NEXT_PUBLIC_* vars are embedded at build time ───────────────────────────
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_PAYPAL_CLIENT_ID
# PayPal subscription plan IDs — monthly
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_MONTHLY
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY
# PayPal subscription plan IDs — yearly
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_YEARLY
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_YEARLY
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS_YEARLY
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_YEARLY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_MONTHLY=$NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_MONTHLY
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO=$NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS=$NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY=$NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_YEARLY=$NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_YEARLY
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_YEARLY=$NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_YEARLY
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS_YEARLY=$NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS_YEARLY
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_YEARLY=$NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_YEARLY

ENV NEXT_TELEMETRY_DISABLED=1
# Raise Node.js heap limit so tsc doesn't SIGSEGV on large codebases
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm run build && mkdir -p /app/public

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# PM2 state directory — must be writable by the non-root nextjs user
ENV PM2_HOME=/tmp/.pm2

# Install PM2 process manager (runs as root before user switch)
RUN npm install -g pm2@latest --no-fund --no-audit

# Dedicated non-root user/group + PM2 home directory
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && mkdir -p /tmp/.pm2 \
 && chown -R nextjs:nodejs /tmp/.pm2

COPY --from=builder /app/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# PM2 ecosystem config
COPY --chown=nextjs:nodejs ecosystem.config.js ./

USER nextjs

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["pm2-runtime", "start", "ecosystem.config.js"]

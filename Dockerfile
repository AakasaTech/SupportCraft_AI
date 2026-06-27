# ─────────────────────────────────────────────────────────────────────────────
# SupportCraft AI — multi-stage Docker build
#
# Stage 1 (deps)    – install all npm dependencies (dev + prod)
# Stage 2 (builder) – run `next build` and produce .next/standalone
# Stage 3 (runner)  – minimal production image (~200 MB)
#
# Build:
#   docker build \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
#     --build-arg NEXT_PUBLIC_APP_URL=https://supportcraft.aakasa.dev \
#     --build-arg NEXT_PUBLIC_PAYPAL_CLIENT_ID=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO=... \
#     --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS=... \
#     -t supportcraft-ai:latest .
#
# Run:
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
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO
ARG NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_PAYPAL_CLIENT_ID=$NEXT_PUBLIC_PAYPAL_CLIENT_ID
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO=$NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO
ENV NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS=$NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

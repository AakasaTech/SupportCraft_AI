# SupportCraft AI

[![License: PolyForm Noncommercial 1.0.0](https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-orange.svg)](LICENSE.md)

AI-powered help desk SaaS built on Next.js 15, Supabase, and OpenAI / Anthropic. Part of the [Aakasa Digital](https://aakasa.dev) product family.

> **⚠️ Non-Commercial Only:** This repository is source-available for personal, educational, research, and evaluation purposes. **Commercial use requires a paid license.** See [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md) or contact [licenses@aakasa.dev](mailto:licenses@aakasa.dev) for details.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, standalone output) |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth + `@supabase/ssr` |
| AI | OpenAI gpt-4o / Anthropic claude-sonnet-4-6 |
| Inbound email | Cloudflare Email Workers → Supabase Edge Functions |
| Outbound email | AWS SES / SendGrid / Mailgun / Postmark / SMTP |
| Payments | PayPal Subscriptions |
| Rich editor | TipTap |
| Styling | Tailwind CSS v4 |

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Docker | 24+ |
| Docker Compose | v2 (plugin) |
| Node.js | 20+ (local dev only) |
| Supabase CLI | 1.x (migrations) |

---

## Quick Start (local development)

```bash
# 1. Clone
git clone https://github.com/aakasadigital/supportcraft-ai.git
cd supportcraft-ai

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in your Supabase URL, keys, AI provider key, email provider

# 4. Run database migrations
supabase db push          # or apply supabase/migrations/*.sql manually

# 5. Start dev server
npm run dev               # http://localhost:3002
```

---

## Docker Build

### Environment variables

> **Important:** `NEXT_PUBLIC_*` variables are baked into the bundle at **build time**.
> All other variables are injected at **runtime** via `--env-file`.

Copy the example and fill in your values:

```bash
cp .env.example .env.production
```

Minimum required values for a working build:

```env
# Build-time (passed as --build-arg)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://supportcraft.aakasa.dev
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO=...
NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS=...

# Runtime (in .env.production)
SUPABASE_SERVICE_ROLE_KEY=...
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
EMAIL_PROVIDER=ses
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY_ID=...
AWS_SES_SECRET_ACCESS_KEY=...
INBOUND_SECRET=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...
NEXT_PUBLIC_APP_URL=https://supportcraft.aakasa.dev
```

---

### Build the image

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... \
  --build-arg NEXT_PUBLIC_APP_URL=https://supportcraft.aakasa.dev \
  --build-arg NEXT_PUBLIC_PAYPAL_CLIENT_ID=... \
  --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO=... \
  --build-arg NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS=... \
  -t supportcraft-ai:latest \
  .
```

Tag with a version:

```bash
docker build ... -t supportcraft-ai:1.0.0 -t supportcraft-ai:latest .
```

---

### Run the container

```bash
docker run \
  --name supportcraft-ai \
  -p 3002:3002 \
  --env-file .env.production \
  --restart unless-stopped \
  supportcraft-ai:latest
```

The app is available at `http://localhost:3002`.

---

### Build stages

The `Dockerfile` uses a 3-stage build to keep the production image minimal (~200 MB):

```
Stage 1 — deps
  node:24-alpine
  npm ci (all dependencies)

Stage 2 — builder
  Copies node_modules from stage 1
  Injects NEXT_PUBLIC_* build args
  Runs `next build` → produces .next/standalone

Stage 3 — runner
  node:24-alpine (no npm, no source)
  Copies only .next/standalone + .next/static + public/
  Runs as non-root user (nextjs:nodejs)
  Exposes port 3002
```

---

## Docker Compose

Create `docker-compose.yml` in the project root:

```yaml
services:
  app:
    image: supportcraft-ai:latest
    build:
      context: .
      args:
        NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
        NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL}
        NEXT_PUBLIC_PAYPAL_CLIENT_ID: ${NEXT_PUBLIC_PAYPAL_CLIENT_ID}
        NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO: ${NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO}
        NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS: ${NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS}
    ports:
      - "3002:3002"
    env_file:
      - .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3002/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
```

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f app

# Stop
docker compose down
```

---

## Nginx Reverse Proxy

Minimal Nginx config to proxy SupportCraft AI behind HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name supportcraft.aakasa.dev;

    ssl_certificate     /etc/ssl/certs/supportcraft.aakasa.dev.crt;
    ssl_certificate_key /etc/ssl/private/supportcraft.aakasa.dev.key;

    client_max_body_size 20M;

    location / {
        proxy_pass         http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    server_name supportcraft.aakasa.dev;
    return 301 https://$host$request_uri;
}
```

---

## Database Migrations

Migrations are in `supabase/migrations/` and must be applied to your Supabase project before first run.

```bash
# Apply all migrations (Supabase CLI)
supabase db push --db-url postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres

# Or apply manually via psql
psql $DATABASE_URL -f supabase/migrations/001_init.sql
psql $DATABASE_URL -f supabase/migrations/002_auth_enhancements.sql
psql $DATABASE_URL -f supabase/migrations/003_ticket_enhancements.sql
psql $DATABASE_URL -f supabase/migrations/004_portal_enhancements.sql
psql $DATABASE_URL -f supabase/migrations/005_ai_enhancements.sql
psql $DATABASE_URL -f supabase/migrations/006_kb_enhancements.sql
psql $DATABASE_URL -f supabase/migrations/007_email_system.sql
```

---

## Cloudflare Email Worker

The inbound email pipeline runs on a separate Cloudflare Worker — it is **not** part of the Docker image.

```bash
cd workers/email-inbound
npm install

# Set secrets
wrangler secret put INBOUND_SECRET
# Enter the same value as INBOUND_SECRET in your .env.production

# Edit wrangler.toml — set SUPABASE_INBOUND_URL to your Supabase Edge Function URL

# Deploy
wrangler deploy
```

After deploy, configure Cloudflare Email Routing:
1. Add `supportcraft.aakasa.dev` subdomain to Cloudflare
2. Enable Email Routing → set catch-all rule → route to this Worker
3. Add each tenant slug to the `TENANT_MAP` KV store:
   ```bash
   wrangler kv key put --binding TENANT_MAP "acme" "org-uuid-here"
   ```

---

## Supabase Edge Functions

```bash
# Deploy inbound email receiver
supabase functions deploy email-inbound

# Set secrets on the Edge Function
supabase secrets set INBOUND_SECRET=your-shared-secret
supabase secrets set NEXT_PUBLIC_APP_URL=https://supportcraft.aakasa.dev
```

---

## Supabase Storage

Create the `email-attachments` bucket (private) before attachments will work:

```bash
# Via Supabase Dashboard → Storage → New bucket
# Name: email-attachments
# Public: No
```

Or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', false);
```

---

## Environment Variable Reference

| Variable | Required | Build-time | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | Public app URL |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | ✅ | ✅ | PayPal client ID (public) |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO` | ✅ | ✅ | PayPal Pro plan ID |
| `NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS` | ✅ | ✅ | PayPal Business plan ID |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | | Supabase service role key (secret) |
| `AI_PROVIDER` | ✅ | | `openai` or `anthropic` |
| `OPENAI_API_KEY` | if openai | | OpenAI API key |
| `ANTHROPIC_API_KEY` | if anthropic | | Anthropic API key |
| `EMAIL_PROVIDER` | ✅ | | `ses` / `smtp` / `sendgrid` / `mailgun` / `postmark` |
| `SENDING_DOMAIN` | | | Defaults to `supportcraft.aakasa.dev` |
| `AWS_SES_REGION` | if ses | | e.g. `us-east-1` |
| `AWS_SES_ACCESS_KEY_ID` | if ses | | AWS access key |
| `AWS_SES_SECRET_ACCESS_KEY` | if ses | | AWS secret key |
| `SMTP_HOST` | if smtp | | SMTP server hostname |
| `SMTP_PORT` | if smtp | | Default `587` |
| `SMTP_USER` | if smtp | | SMTP username |
| `SMTP_PASS` | if smtp | | SMTP password |
| `SENDGRID_API_KEY` | if sendgrid | | SendGrid API key |
| `MAILGUN_API_KEY` | if mailgun | | Mailgun API key |
| `MAILGUN_DOMAIN` | if mailgun | | Mailgun sending domain |
| `POSTMARK_SERVER_TOKEN` | if postmark | | Postmark server token |
| `INBOUND_SECRET` | ✅ | | Shared secret (Worker ↔ Edge Fn ↔ App) |
| `PAYPAL_CLIENT_SECRET` | ✅ | | PayPal secret (server-side) |
| `PAYPAL_WEBHOOK_ID` | ✅ | | PayPal webhook ID |
| `CRON_SECRET` | | | Protects `/api/email/queue` cron endpoint |

---

## Useful Commands

```bash
# Build image
docker build -t supportcraft-ai:latest .

# Run with env file
docker run -p 3002:3002 --env-file .env.production supportcraft-ai:latest

# Open shell in running container
docker exec -it supportcraft-ai sh

# View logs
docker logs -f supportcraft-ai

# Type-check (no build)
npm run type-check

# Lint
npm run lint
```

---

## Production Checklist

- [ ] All migrations applied to Supabase
- [ ] `email-attachments` storage bucket created (private)
- [ ] Supabase Edge Function `email-inbound` deployed + secrets set
- [ ] Cloudflare Email Worker deployed + `INBOUND_SECRET` set
- [ ] DNS: `supportcraft.aakasa.dev` MX records → Cloudflare Email Routing
- [ ] DNS: SPF, DKIM, DMARC records configured for sending domain
- [ ] `.env.production` complete — no placeholder values
- [ ] Docker image built with correct `NEXT_PUBLIC_*` build args
- [ ] Nginx/reverse proxy configured with TLS
- [ ] PayPal webhooks pointing to `https://supportcraft.aakasa.dev/api/webhooks/paypal`
- [ ] Email delivery webhook endpoints registered with your email provider

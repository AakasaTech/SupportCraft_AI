import type { ForwardableEmailMessage, ExecutionContext } from "@cloudflare/workers-types";
import { parseEmail } from "./parser";
import { resolveTenant, type Env } from "./tenant-resolver";
import { detectSpamSignals, shouldReject } from "./spam-guard";
import { buildPayload } from "./payload-builder";
import { forwardToSupabase } from "./forwarder";

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    // ── 1. Spam / loop guard — reject at SMTP level before any I/O ──────────
    const signals = detectSpamSignals(message);
    if (shouldReject(signals)) {
      message.setReject("Rejected: auto-reply loop or bounce detected");
      return;
    }

    // ── 2. Parse raw MIME stream ─────────────────────────────────────────────
    let parsed;
    try {
      parsed = await parseEmail(message.raw);
    } catch {
      message.setReject("Temporary error: failed to parse email");
      return;
    }

    // ── 3. Resolve tenant from To address ───────────────────────────────────
    const tenant = await resolveTenant(message.to, env);
    if (!tenant) {
      message.setReject("Unknown recipient address");
      return;
    }

    // ── 4. Build structured payload ──────────────────────────────────────────
    const payload = buildPayload(parsed, tenant, message.to, signals);

    // ── 5. Forward to Supabase Edge Function (non-blocking — SMTP accepted) ──
    ctx.waitUntil(
      forwardToSupabase(payload, env.SUPABASE_INBOUND_URL, env.INBOUND_SECRET).then(
        result => {
          if (!result.ok) {
            console.error("Forward failed:", result.error, result.status);
          }
        }
      )
    );
    // Email is accepted at SMTP level regardless — Supabase retries via queue
  },
};

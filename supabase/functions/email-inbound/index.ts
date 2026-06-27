// Supabase Edge Function — Cloudflare Worker inbound webhook receiver
// Deno runtime: use esm.sh imports

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const INBOUND_SECRET = Deno.env.get("INBOUND_SECRET") ?? "";
const SUPABASE_URL   = Deno.env.get("SUPABASE_URL")   ?? "";
const SERVICE_KEY    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const APP_URL        = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "";

Deno.serve(async (req: Request) => {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const auth = req.headers.get("Authorization");
  if (!auth || auth !== `Bearer ${INBOUND_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Basic validation ─────────────────────────────────────────────────────
  const required = ["tenant_id", "from_address", "to_address", "message_id", "subject"];
  for (const field of required) {
    if (!payload[field]) {
      return Response.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // ── Idempotency: skip duplicate Message-IDs ──────────────────────────────
  const { data: existing } = await admin
    .from("email_raw_inbound")
    .select("id")
    .eq("message_id", payload.message_id)
    .single();

  if (existing) {
    return Response.json({ status: "duplicate", message: "already processed" });
  }

  // ── Audit log (insert raw payload) ───────────────────────────────────────
  const { data: raw, error: rawErr } = await admin
    .from("email_raw_inbound")
    .insert({
      org_id:            payload.tenant_id,
      from_address:      payload.from_address,
      to_address:        payload.to_address,
      message_id:        payload.message_id,
      subject:           payload.subject,
      payload:           payload,
      processing_status: "pending",
    })
    .select("id")
    .single();

  if (rawErr || !raw) {
    console.error("Failed to log raw inbound:", rawErr);
    return Response.json({ error: "Storage error" }, { status: 500 });
  }

  // ── Invoke Next.js processing pipeline (async) ────────────────────────────
  // Fire-and-forget — SMTP layer already accepted the email
  if (APP_URL) {
    fetch(`${APP_URL}/api/email/process`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${INBOUND_SECRET}`,
      },
      body: JSON.stringify({ ...payload, raw_inbound_id: raw.id }),
    }).catch(err => console.error("Process call failed:", err));
  }

  return Response.json({ status: "accepted", raw_id: raw.id });
});

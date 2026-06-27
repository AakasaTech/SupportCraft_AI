import { NextRequest, NextResponse } from "next/server";
import { processInboundEmail } from "@/lib/email/processor";
import { createAdminClient } from "@/lib/supabase/server";
import type { InboundEmailPayload } from "@/lib/email/types";

const INBOUND_SECRET = process.env.INBOUND_SECRET ?? "";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Validate shared secret from Supabase Edge Function
  const auth = req.headers.get("Authorization");
  if (!auth || auth !== `Bearer ${INBOUND_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: InboundEmailPayload & { raw_inbound_id?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawInboundId = payload.raw_inbound_id ?? null;

  // Mark raw inbound as processing
  if (rawInboundId) {
    const admin = createAdminClient();
    await admin
      .from("email_raw_inbound")
      .update({ processing_status: "processing" })
      .eq("id", rawInboundId);
  }

  const result = await processInboundEmail(payload, rawInboundId);

  // Update raw inbound with final status
  if (rawInboundId) {
    const admin = createAdminClient();
    await admin
      .from("email_raw_inbound")
      .update({
        processing_status: result.status === "error" ? "failed"
          : result.status === "spam" ? "spam"
          : "processed",
        error_message: result.reason ?? null,
      })
      .eq("id", rawInboundId);
  }

  return NextResponse.json(result);
}

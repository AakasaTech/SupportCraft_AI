import { NextRequest, NextResponse } from "next/server";
import { processInboundEmail } from "@/lib/email/processor";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { InboundEmailPayload } from "@/lib/email/types";

const INBOUND_SECRET = process.env.INBOUND_SECRET ?? "";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Validate shared secret from the inbound Cloudflare Worker
  const auth = req.headers.get("Authorization");
  if (!auth || auth !== `Bearer ${INBOUND_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: InboundEmailPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const required = ["tenant_id", "from_address", "to_address", "message_id", "subject"] as const;
  for (const field of required) {
    if (!payload[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  // Idempotency: skip duplicate Message-IDs. This used to be a Supabase Edge
  // Function's job (writing an audit row + short-circuiting on conflict)
  // before ever calling this route — now it's all one hop, straight from the
  // Cloudflare Worker into Neon.
  const existing = await prisma.emailRawInbound.findUnique({
    where:  { messageId: payload.message_id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ status: "duplicate", message: "already processed" });
  }

  // Audit log (insert raw payload)
  const raw = await prisma.emailRawInbound.create({
    data: {
      organizationId:   payload.tenant_id,
      fromAddress:      payload.from_address,
      toAddress:        payload.to_address,
      messageId:        payload.message_id,
      subject:          payload.subject,
      payload:          payload as unknown as Prisma.InputJsonValue,
      processingStatus: "processing",
    },
    select: { id: true },
  });

  const result = await processInboundEmail(payload, raw.id);

  await prisma.emailRawInbound.update({
    where: { id: raw.id },
    data: {
      processingStatus: result.status === "error" ? "failed"
        : result.status === "spam" ? "spam"
        : "processed",
      errorMessage: result.reason ?? null,
    },
  });

  return NextResponse.json(result);
}

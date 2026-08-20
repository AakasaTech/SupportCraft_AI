"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { testWebhookDelivery } from "@/lib/webhooks";

async function getCtx() {
  const user = await getCurrentUser();
  if (!user) return null;
  return { userId: user.id, profileId: user.profile.id, orgId: user.profile.organizationId, role: user.profile.role };
}

function requireAdmin(role: string) {
  return ["owner", "admin"].includes(role);
}

export async function createWebhookAction(input: {
  name:    string;
  url:     string;
  events:  string[];
  secret?: string; // user-supplied (e.g. pasted from TaskCraft); auto-generated if omitted
}) {
  const ctx = await getCtx();
  if (!ctx || !requireAdmin(ctx.role)) return { error: "Unauthorized" };

  const secret = input.secret?.trim() || randomBytes(24).toString("hex");

  const created = await prisma.outboundWebhook.create({
    data: {
      organizationId: ctx.orgId,
      createdById:    ctx.profileId,
      name:           input.name.trim(),
      url:            input.url.trim(),
      secret,
      events:         input.events,
    },
    select: { id: true, name: true, url: true, events: true, enabled: true, secret: true, createdAt: true, lastFiredAt: true, lastStatus: true },
  });

  // WebhooksClient (the caller) expects the snake_case shape it already
  // renders elsewhere on the page — matches what the Supabase client this
  // replaced used to return directly from `.select()`.
  const data = {
    id: created.id, name: created.name, url: created.url, events: created.events,
    enabled: created.enabled, secret: created.secret,
    created_at: created.createdAt.toISOString(),
    last_fired_at: created.lastFiredAt?.toISOString() ?? null,
    last_status: created.lastStatus,
  };

  revalidatePath("/settings/webhooks");
  return { data };
}

export async function updateWebhookAction(id: string, input: {
  name?:    string;
  url?:     string;
  events?:  string[];
  enabled?: boolean;
}) {
  const ctx = await getCtx();
  if (!ctx || !requireAdmin(ctx.role)) return { error: "Unauthorized" };

  const updates: { name?: string; url?: string; events?: string[]; enabled?: boolean } = {};
  if (input.name    !== undefined) updates.name    = input.name.trim();
  if (input.url     !== undefined) updates.url     = input.url.trim();
  if (input.events  !== undefined) updates.events  = input.events;
  if (input.enabled !== undefined) updates.enabled = input.enabled;

  await prisma.outboundWebhook.updateMany({
    where: { id, organizationId: ctx.orgId },
    data:  updates,
  });

  revalidatePath("/settings/webhooks");
  return { ok: true };
}

export async function deleteWebhookAction(id: string) {
  const ctx = await getCtx();
  if (!ctx || !requireAdmin(ctx.role)) return { error: "Unauthorized" };

  await prisma.outboundWebhook.deleteMany({
    where: { id, organizationId: ctx.orgId },
  });

  revalidatePath("/settings/webhooks");
  return { ok: true };
}

export async function testWebhookAction(id: string) {
  const ctx = await getCtx();
  if (!ctx || !requireAdmin(ctx.role)) return { error: "Unauthorized" };

  const { status } = await testWebhookDelivery(id, ctx.orgId);
  revalidatePath("/settings/webhooks");
  return { status };
}

export async function regenerateWebhookSecretAction(id: string) {
  const ctx = await getCtx();
  if (!ctx || !requireAdmin(ctx.role)) return { error: "Unauthorized" };

  const secret = randomBytes(24).toString("hex");

  await prisma.outboundWebhook.updateMany({
    where: { id, organizationId: ctx.orgId },
    data:  { secret },
  });

  return { secret };
}

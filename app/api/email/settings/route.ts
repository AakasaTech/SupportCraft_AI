import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrgEmail } from "@/lib/email/platform-provider";
import { z } from "zod";

export const runtime = "nodejs";

// Only customer-facing fields — provider/SMTP config is platform-managed
const settingsSchema = z.object({
  tenant_slug:        z.string().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only").min(2).max(30),
  display_name:       z.string().max(100).optional(),
  reply_to:           z.string().email().optional().or(z.literal("")),
  signature_html:     z.string().max(5000).optional(),
  footer_html:        z.string().max(2000).optional(),
  auto_reply_enabled: z.boolean().optional(),
  auto_reply_config:  z.record(z.unknown()).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: settings } = await admin
    .from("email_settings")
    .select("tenant_slug, display_name, reply_to, signature_html, footer_html, auto_reply_enabled, auto_reply_config")
    .eq("org_id", profile.org_id)
    .single();

  return NextResponse.json({
    settings: settings ?? null,
    support_email: settings?.tenant_slug ? getOrgEmail(settings.tenant_slug) : null,
  });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id, role").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["owner", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check slug uniqueness (exclude current org)
  const slug = parsed.data.tenant_slug;
  const { data: conflict } = await admin
    .from("email_settings")
    .select("org_id")
    .eq("tenant_slug", slug)
    .neq("org_id", profile.org_id)
    .single();

  if (conflict) {
    return NextResponse.json(
      { error: { fieldErrors: { tenant_slug: [`"${slug}" is already taken`] } } },
      { status: 409 }
    );
  }

  const { data, error } = await admin
    .from("email_settings")
    .upsert(
      {
        org_id:      profile.org_id,
        // Derive the canonical support_email from slug — always identical
        support_email: getOrgEmail(slug),
        ...parsed.data,
        updated_at:  new Date().toISOString(),
      },
      { onConflict: "org_id" }
    )
    .select("tenant_slug, display_name, reply_to, signature_html, auto_reply_enabled")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    settings:      data,
    support_email: getOrgEmail(slug),
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect }       from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { articleSchema, categorySchema }   from "../schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readingTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function makeSlug(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function ensureUniqueSlug(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, base: string, excludeId?: string): Promise<string> {
  let slug  = base;
  let count = 0;
  while (true) {
    const q = supabase
      .from("knowledge_articles")
      .select("id")
      .eq("org_id", orgId)
      .eq("slug", slug);
    if (excludeId) q.neq("id", excludeId);
    const { data } = await q.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${++count}`;
  }
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function createArticle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const tagsRaw = formData.get("tags") as string;
  const parsed  = articleSchema.safeParse({
    title:           formData.get("title"),
    content:         formData.get("content"),
    excerpt:         formData.get("excerpt") || undefined,
    status:          formData.get("status") || "draft",
    visibility:      formData.get("visibility") || "public",
    category:        formData.get("category") || undefined,
    category_id:     formData.get("category_id") || undefined,
    tags:            tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    seo_title:       formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
    cover_image_url: formData.get("cover_image_url") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const slug = await ensureUniqueSlug(supabase, profile.org_id, makeSlug(parsed.data.title));

  const publishedAt = parsed.data.status === "published" ? new Date().toISOString() : null;

  const { data: article, error } = await supabase
    .from("knowledge_articles")
    .insert({
      ...parsed.data,
      slug,
      org_id:           profile.org_id,
      author_id:        user.id,
      reading_time_min: readingTime(parsed.data.content),
      published_at:     publishedAt,
      version:          1,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Save initial version
  await supabase.from("article_versions").insert({
    article_id:     article.id,
    version_number: 1,
    title:          parsed.data.title,
    content:        parsed.data.content,
    change_summary: "Initial version",
    author_id:      user.id,
  });

  revalidatePath("/knowledge-base");
  redirect(`/knowledge-base/${article.id}`);
}

export async function updateArticle(articleId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const tagsRaw = formData.get("tags") as string;
  const parsed  = articleSchema.safeParse({
    title:           formData.get("title"),
    content:         formData.get("content"),
    excerpt:         formData.get("excerpt") || undefined,
    status:          formData.get("status") || "draft",
    visibility:      formData.get("visibility") || "public",
    category:        formData.get("category") || undefined,
    category_id:     formData.get("category_id") || undefined,
    tags:            tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    seo_title:       formData.get("seo_title") || undefined,
    seo_description: formData.get("seo_description") || undefined,
    cover_image_url: formData.get("cover_image_url") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Get current version number
  const { data: current } = await supabase
    .from("knowledge_articles")
    .select("version, title, content, status, published_at")
    .eq("id", articleId)
    .single();

  const newVersion    = (current?.version ?? 1) + 1;
  const changeSummary = (formData.get("change_summary") as string) || "Updated";
  const wasPublished  = current?.status === "published";
  const isPublishing  = parsed.data.status === "published" && !wasPublished;
  const publishedAt   = isPublishing
    ? new Date().toISOString()
    : (current?.published_at ?? null);

  const { error } = await supabase
    .from("knowledge_articles")
    .update({
      ...parsed.data,
      reading_time_min: readingTime(parsed.data.content),
      version:          newVersion,
      published_at:     publishedAt,
      updated_at:       new Date().toISOString(),
    })
    .eq("id", articleId)
    .eq("org_id", profile.org_id);

  if (error) return { error: error.message };

  // Save version snapshot
  await supabase.from("article_versions").insert({
    article_id:     articleId,
    version_number: newVersion,
    title:          parsed.data.title,
    content:        parsed.data.content,
    change_summary: changeSummary,
    author_id:      user.id,
  });

  revalidatePath(`/knowledge-base/${articleId}`);
  revalidatePath("/knowledge-base");
  return { success: true };
}

export async function deleteArticle(articleId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase
    .from("knowledge_articles")
    .delete()
    .eq("id", articleId)
    .eq("org_id", profile.org_id);

  if (error) return { error: error.message };

  revalidatePath("/knowledge-base");
  redirect("/knowledge-base");
}

export async function restoreVersion(articleId: string, versionNumber: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: ver } = await supabase
    .from("article_versions")
    .select("title, content")
    .eq("article_id", articleId)
    .eq("version_number", versionNumber)
    .single();

  if (!ver) return { error: "Version not found" };

  const { data: current } = await supabase
    .from("knowledge_articles")
    .select("version")
    .eq("id", articleId)
    .single();

  const newVersion = (current?.version ?? 1) + 1;

  await supabase.from("knowledge_articles").update({
    title:   ver.title,
    content: ver.content,
    version: newVersion,
    updated_at: new Date().toISOString(),
  }).eq("id", articleId);

  await supabase.from("article_versions").insert({
    article_id:     articleId,
    version_number: newVersion,
    title:          ver.title,
    content:        ver.content,
    change_summary: `Restored from v${versionNumber}`,
    author_id:      user.id,
  });

  revalidatePath(`/knowledge-base/${articleId}`);
  return { success: true };
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const parsed = categorySchema.safeParse({
    name:       formData.get("name"),
    slug:       formData.get("slug"),
    description: formData.get("description") || undefined,
    icon:       formData.get("icon") || undefined,
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase
    .from("kb_categories")
    .insert({ ...parsed.data, org_id: profile.org_id });

  if (error) return { error: error.message };

  revalidatePath("/knowledge-base/categories");
  return { success: true };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const parsed = categorySchema.safeParse({
    name:       formData.get("name"),
    slug:       formData.get("slug"),
    description: formData.get("description") || undefined,
    icon:       formData.get("icon") || undefined,
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase
    .from("kb_categories")
    .update(parsed.data)
    .eq("id", categoryId)
    .eq("org_id", profile.org_id);

  if (error) return { error: error.message };

  revalidatePath("/knowledge-base/categories");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };

  const { error } = await supabase
    .from("kb_categories")
    .delete()
    .eq("id", categoryId)
    .eq("org_id", profile.org_id);

  if (error) return { error: error.message };

  revalidatePath("/knowledge-base/categories");
  return { success: true };
}

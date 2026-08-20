"use server";

import { revalidatePath } from "next/cache";
import { redirect }       from "next/navigation";
import { requireAuth }    from "@/lib/auth/helpers";
import { prisma }         from "@/lib/prisma";
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

async function ensureUniqueSlug(orgId: string, base: string, excludeId?: string): Promise<string> {
  let slug  = base;
  let count = 0;
  while (true) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { organizationId: orgId, slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    if (!existing) return slug;
    slug = `${base}-${++count}`;
  }
}

// ─── Articles ─────────────────────────────────────────────────────────────────

export async function createArticle(formData: FormData) {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

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

  const slug = await ensureUniqueSlug(orgId, makeSlug(parsed.data.title));
  const publishedAt = parsed.data.status === "published" ? new Date() : null;

  const article = await prisma.knowledgeArticle.create({
    data: {
      organizationId: orgId,
      authorId:       user.profile.id,
      title:           parsed.data.title,
      content:         parsed.data.content,
      excerpt:         parsed.data.excerpt,
      status:          parsed.data.status,
      visibility:      parsed.data.visibility,
      category:        parsed.data.category,
      categoryId:      parsed.data.category_id || null,
      tags:            parsed.data.tags,
      seoTitle:        parsed.data.seo_title,
      seoDescription:  parsed.data.seo_description,
      coverImageUrl:   parsed.data.cover_image_url || null,
      slug,
      readingTimeMin: readingTime(parsed.data.content),
      publishedAt,
      version: 1,
    },
    select: { id: true },
  });

  // Save initial version
  await prisma.articleVersion.create({
    data: {
      articleId:     article.id,
      versionNumber: 1,
      title:         parsed.data.title,
      content:       parsed.data.content,
      changeSummary: "Initial version",
      authorId:      user.profile.id,
    },
  });

  revalidatePath("/knowledge-base");
  redirect(`/knowledge-base/${article.id}`);
}

export async function updateArticle(articleId: string, formData: FormData) {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

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
  const current = await prisma.knowledgeArticle.findFirst({
    where:  { id: articleId, organizationId: orgId },
    select: { version: true, status: true, publishedAt: true },
  });

  const newVersion    = (current?.version ?? 1) + 1;
  const changeSummary = (formData.get("change_summary") as string) || "Updated";
  const wasPublished  = current?.status === "published";
  const isPublishing  = parsed.data.status === "published" && !wasPublished;
  const publishedAt   = isPublishing
    ? new Date()
    : (current?.publishedAt ?? null);

  const { count } = await prisma.knowledgeArticle.updateMany({
    where: { id: articleId, organizationId: orgId },
    data: {
      title:           parsed.data.title,
      content:         parsed.data.content,
      excerpt:         parsed.data.excerpt,
      status:          parsed.data.status,
      visibility:      parsed.data.visibility,
      category:        parsed.data.category,
      categoryId:      parsed.data.category_id || null,
      tags:            parsed.data.tags,
      seoTitle:        parsed.data.seo_title,
      seoDescription:  parsed.data.seo_description,
      coverImageUrl:   parsed.data.cover_image_url || null,
      readingTimeMin: readingTime(parsed.data.content),
      version:        newVersion,
      publishedAt,
    },
  });

  if (count === 0) return { error: "Article not found" };

  // Save version snapshot
  await prisma.articleVersion.create({
    data: {
      articleId,
      versionNumber: newVersion,
      title:         parsed.data.title,
      content:       parsed.data.content,
      changeSummary,
      authorId:      user.profile.id,
    },
  });

  revalidatePath(`/knowledge-base/${articleId}`);
  revalidatePath("/knowledge-base");
  return { success: true };
}

export async function deleteArticle(articleId: string) {
  const user = await requireAuth();

  await prisma.knowledgeArticle.deleteMany({
    where: { id: articleId, organizationId: user.profile.organizationId },
  });

  revalidatePath("/knowledge-base");
  redirect("/knowledge-base");
}

export async function restoreVersion(articleId: string, versionNumber: number) {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  const ver = await prisma.articleVersion.findFirst({
    where:  { articleId, versionNumber, article: { organizationId: orgId } },
    select: { title: true, content: true },
  });

  if (!ver) return { error: "Version not found" };

  const current = await prisma.knowledgeArticle.findFirst({
    where:  { id: articleId, organizationId: orgId },
    select: { version: true },
  });

  if (!current) return { error: "Article not found" };

  const newVersion = current.version + 1;

  await prisma.knowledgeArticle.update({
    where: { id: articleId },
    data:  { title: ver.title, content: ver.content, version: newVersion },
  });

  await prisma.articleVersion.create({
    data: {
      articleId,
      versionNumber: newVersion,
      title:         ver.title,
      content:       ver.content,
      changeSummary: `Restored from v${versionNumber}`,
      authorId:      user.profile.id,
    },
  });

  revalidatePath(`/knowledge-base/${articleId}`);
  return { success: true };
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const user = await requireAuth();

  const parsed = categorySchema.safeParse({
    name:       formData.get("name"),
    slug:       formData.get("slug"),
    description: formData.get("description") || undefined,
    icon:       formData.get("icon") || undefined,
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.kbCategory.create({
    data: {
      organizationId: user.profile.organizationId,
      name:        parsed.data.name,
      slug:        parsed.data.slug,
      description: parsed.data.description,
      icon:        parsed.data.icon,
      sortOrder:   parsed.data.sort_order,
    },
  });

  revalidatePath("/knowledge-base/categories");
  return { success: true };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const user = await requireAuth();

  const parsed = categorySchema.safeParse({
    name:       formData.get("name"),
    slug:       formData.get("slug"),
    description: formData.get("description") || undefined,
    icon:       formData.get("icon") || undefined,
    sort_order: formData.get("sort_order") || 0,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { count } = await prisma.kbCategory.updateMany({
    where: { id: categoryId, organizationId: user.profile.organizationId },
    data: {
      name:        parsed.data.name,
      slug:        parsed.data.slug,
      description: parsed.data.description,
      icon:        parsed.data.icon,
      sortOrder:   parsed.data.sort_order,
    },
  });

  if (count === 0) return { error: "Category not found" };

  revalidatePath("/knowledge-base/categories");
  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const user = await requireAuth();

  await prisma.kbCategory.deleteMany({
    where: { id: categoryId, organizationId: user.profile.organizationId },
  });

  revalidatePath("/knowledge-base/categories");
  return { success: true };
}

import { z } from "zod";

export const articleSchema = z.object({
  title:           z.string().min(3, "Title must be at least 3 characters").max(200),
  content:         z.string().min(10, "Content must be at least 10 characters"),
  excerpt:         z.string().max(300).optional(),
  status:          z.enum(["draft", "review", "published", "archived"]).default("draft"),
  visibility:      z.enum(["public", "internal", "private"]).default("public"),
  category:        z.string().max(50).optional(),
  category_id:     z.string().uuid().optional().nullable(),
  tags:            z.array(z.string()).default([]),
  seo_title:       z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
  cover_image_url: z.string().url().optional().or(z.literal("")),
});

export type ArticleInput = z.infer<typeof articleSchema>;

export const categorySchema = z.object({
  name:        z.string().min(1, "Name is required").max(60),
  slug:        z.string().min(1, "Slug is required").max(60).regex(/^[a-z0-9-]+$/, "Slug: lowercase letters, numbers, hyphens only"),
  description: z.string().max(200).optional(),
  icon:        z.string().max(30).optional(),
  sort_order:  z.coerce.number().int().default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;

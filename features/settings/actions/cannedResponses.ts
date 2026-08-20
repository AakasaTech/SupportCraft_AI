"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

export interface CannedResponse {
  id?:       string;
  name:      string;
  shortcut:  string; // e.g. "greeting" → slug "canned-greeting"
  bodyHtml:  string;
}

export async function getCannedResponses(): Promise<CannedResponse[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await prisma.emailTemplate.findMany({
    where: {
      organizationId: user.profile.organizationId,
      isSystem:       false,
      slug:           { startsWith: "canned-" },
    },
    orderBy: { name: "asc" },
  });

  return rows.map((r) => ({
    id:       r.id,
    name:     r.name,
    shortcut: r.slug.replace(/^canned-/, ""),
    bodyHtml: r.bodyHtml ?? "",
  }));
}

export async function saveCannedResponse(
  item: CannedResponse
): Promise<{ error?: string; id?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!["owner", "admin", "agent"].includes(user.profile.role)) return { error: "Unauthorized" };

  const slug = `canned-${item.shortcut.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;

  if (item.id) {
    const { count } = await prisma.emailTemplate.updateMany({
      where: { id: item.id, organizationId: user.profile.organizationId },
      data:  { name: item.name, subject: item.name, slug, bodyHtml: item.bodyHtml, bodyPlain: "" },
    });
    if (count === 0) return { error: "Canned response not found" };
    return { id: item.id };
  }

  const created = await prisma.emailTemplate.create({
    data: {
      organizationId: user.profile.organizationId,
      slug,
      name:      item.name,
      subject:   item.name,
      bodyHtml:  item.bodyHtml,
      bodyPlain: "",
      isSystem:  false,
      isActive:  true,
      variables: [],
    },
    select: { id: true },
  });

  return { id: created.id };
}

export async function deleteCannedResponse(id: string): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!["owner", "admin", "agent"].includes(user.profile.role)) return { error: "Unauthorized" };

  await prisma.emailTemplate.deleteMany({
    where: {
      id,
      organizationId: user.profile.organizationId,
      slug: { startsWith: "canned-" },
    },
  });

  return {};
}

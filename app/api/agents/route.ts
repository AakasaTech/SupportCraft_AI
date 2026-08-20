import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const rows = await prisma.profile.findMany({
    where: {
      organizationId: user.profile.organizationId,
      role: { in: ["owner", "admin", "agent"] },
      id: { not: user.profile.id },
    },
    select: { id: true, fullName: true, role: true, avatarUrl: true },
    orderBy: { fullName: "asc" },
  });

  const agents = rows.map(p => ({
    id:         p.id,
    name:       p.fullName ?? "Agent",
    role:       p.role,
    avatarUrl:  p.avatarUrl,
  }));

  return NextResponse.json(agents);
}

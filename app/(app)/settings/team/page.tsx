import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/Header";
import { TeamMemberList } from "@/features/settings/components/TeamMemberList";
import { InviteForm } from "@/features/settings/components/InviteForm";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  const [members, invitations] = await Promise.all([
    prisma.profile.findMany({
      where:   { organizationId: orgId },
      select:  { id: true, fullName: true, email: true, role: true, avatarUrl: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: {
        organizationId: orgId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select:  { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const isAdmin = ["owner", "admin"].includes(user.profile.role);

  return (
    <div>
      <Header title="Team" description="Manage agents and invitations" />
      <div className="p-6 space-y-8 max-w-3xl">
        {isAdmin && <InviteForm />}
        <TeamMemberList
          members={members}
          invitations={invitations}
          currentUserId={user.profile.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}

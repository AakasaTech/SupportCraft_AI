import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Building2, Clock } from "lucide-react";
import { getInvitationByToken } from "@/features/auth/actions/invitation";
import { AcceptInvitationForm } from "./AcceptInvitationForm";

interface Props {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = { title: "Accept invitation" };

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    redirect("/invitation-invalid");
  }

  if (invitation.acceptedAt) {
    redirect("/login?message=invitation_already_used");
  }

  if (invitation.expiresAt < new Date()) {
    redirect("/invitation-expired");
  }

  const org = invitation.organization;

  return (
    <div className="space-y-6">
      {/* Invite summary */}
      <div className="sc-card p-4 flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary-subtle shrink-0">
          <Building2 size={18} className="text-primary" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {org?.name ?? "Unknown Organization"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            You&apos;ve been invited as <span className="capitalize font-medium text-foreground">{invitation.role}</span> for{" "}
            <span className="font-medium text-foreground">{invitation.email}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock size={12} aria-hidden />
        Expires {invitation.expiresAt.toLocaleDateString()}
      </div>

      <AcceptInvitationForm token={token} email={invitation.email} />
    </div>
  );
}

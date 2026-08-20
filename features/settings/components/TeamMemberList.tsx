"use client";

import { useTransition } from "react";
import { Loader2, X, Mail } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { removeMember, revokeInvitation } from "../actions/inviteTeamMember";
import { formatDate } from "@/lib/utils";
import type { Profile, Invitation } from "@/lib/generated/prisma/client";

interface TeamMemberListProps {
  members: Pick<Profile, "id" | "fullName" | "email" | "role" | "avatarUrl" | "createdAt">[];
  invitations: Pick<Invitation, "id" | "email" | "role" | "expiresAt" | "createdAt">[];
  currentUserId: string;
  isAdmin: boolean;
}

export function TeamMemberList({ members, invitations, currentUserId, isAdmin }: TeamMemberListProps) {
  const [isPending, startTransition] = useTransition();

  function handleRemove(memberId: string) {
    if (!confirm("Remove this team member?")) return;
    startTransition(async () => { await removeMember(memberId); });
  }

  function handleRevoke(invitationId: string) {
    startTransition(async () => { await revokeInvitation(invitationId); });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-sm">
                    {member.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{member.fullName}</span>
                    {member.id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
                {isAdmin && member.id !== currentUserId && member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(member.id)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{inv.email}</span>
                    <p className="text-xs text-muted-foreground">Expires {formatDate(inv.expiresAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{inv.role}</Badge>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRevoke(inv.id)}
                      disabled={isPending}
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

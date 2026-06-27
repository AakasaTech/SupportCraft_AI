"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { inviteTeamMember } from "../actions/inviteTeamMember";
import { inviteTeamMemberSchema, type InviteTeamMemberInput } from "../schemas";

export function InviteForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(inviteTeamMemberSchema),
    defaultValues: { role: "agent" as const },
  });

  function onSubmit(data: InviteTeamMemberInput) {
    setMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("email", data.email);
      formData.set("role", data.role);
      const result = await inviteTeamMember(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Invitation sent successfully" });
        reset();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Team Member</CardTitle>
        <CardDescription>Send an invitation link to add a new agent to your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="inviteEmail">Email address</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="colleague@company.com"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="w-32 space-y-1.5">
              <Label>Role</Label>
              <Select defaultValue="agent" onValueChange={(v) => setValue("role", v as InviteTeamMemberInput["role"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
            Send invitation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

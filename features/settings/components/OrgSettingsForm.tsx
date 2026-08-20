"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { updateOrgSchema, type UpdateOrgInput } from "../schemas";
import { updateOrganization } from "../actions/organization";
import { useRouter } from "next/navigation";
import type { Organization } from "@/lib/generated/prisma/client";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Asia/Shanghai",
  "Australia/Sydney", "Pacific/Auckland",
];

interface OrgSettingsFormProps {
  org: Organization;
  isAdmin: boolean;
  derivedSupportEmail: string | null;
}

export function OrgSettingsForm({ org, isAdmin, derivedSupportEmail }: OrgSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<UpdateOrgInput>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: org.name,
      website: org.website ?? "",
      support_email: org.supportEmail ?? "",
      country: org.country ?? "",
      timezone: org.timezone ?? "UTC",
    },
  });

  function onSubmit(data: UpdateOrgInput) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateOrganization(data);

      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Organization settings updated" });
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Workspace settings visible to your team</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {message && (
            <Alert variant={message.type === "error" ? "destructive" : "default"}>
              <AlertDescription
                className={message.type === "success" ? "text-success" : undefined}
              >
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" disabled={!isAdmin} {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={org.slug} disabled className="text-muted-foreground" readOnly />
              <p className="text-xs text-muted-foreground">Cannot be changed</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Support email</Label>
            <Input
              value={derivedSupportEmail ?? "Not configured"}
              readOnly
              disabled
              className="text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Set in{" "}
              <Link href="/settings/email" className="underline underline-offset-2 hover:text-foreground transition-colors">
                Settings → Email
              </Link>
              . Shown to customers in notifications.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourcompany.com"
              disabled={!isAdmin}
              {...register("website")}
            />
            {errors.website && (
              <p className="text-xs text-destructive">{errors.website.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g. United States"
                disabled={!isAdmin}
                {...register("country")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-timezone">Timezone</Label>
              <select
                id="org-timezone"
                disabled={!isAdmin}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                {...register("timezone")}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          {isAdmin && (
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

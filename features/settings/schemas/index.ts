import { z } from "zod";

export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "agent", "viewer"]).default("agent"),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  support_email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  timezone: z.string().max(100).optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
  job_title: z.string().max(100).optional().or(z.literal("")),
  timezone: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

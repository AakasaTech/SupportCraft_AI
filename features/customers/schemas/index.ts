import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional(),
  company: z.string().max(150).optional(),
  notes: z.string().max(2000).optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

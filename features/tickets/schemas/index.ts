import { z } from "zod";

const statusEnum = z.enum(["new", "open", "in_progress", "pending", "resolved", "closed"]);
const priorityEnum = z.enum(["low", "medium", "high", "urgent"]);
const sourceEnum = z.enum(["email", "portal", "chat", "api", "phone", "manual"]);

export const createTicketSchema = z.object({
  title:       z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(1, "Description is required").max(20000),
  priority:    priorityEnum.default("medium"),
  source:      sourceEnum.default("manual"),
  customerId:  z.string().uuid().optional(),
  assigneeId:  z.string().uuid().optional(),
  category:    z.string().max(50).optional(),
  department:  z.string().max(50).optional(),
  tags:        z.array(z.string()).default([]),
  dueDate:     z.string().datetime().optional(),
  templateId:  z.string().uuid().optional(),
});

export const updateTicketSchema = z.object({
  ticketId:   z.string().uuid(),
  title:      z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  status:     statusEnum.optional(),
  priority:   priorityEnum.optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  category:   z.string().max(50).nullable().optional(),
  department: z.string().max(50).nullable().optional(),
  tags:       z.array(z.string()).optional(),
  dueDate:    z.string().datetime().nullable().optional(),
});

export const replyTicketSchema = z.object({
  ticketId:   z.string().uuid(),
  content:    z.string().min(1, "Reply cannot be empty").max(50000),
  isInternal: z.boolean().default(false),
});

export const bulkActionSchema = z.object({
  ticketIds:  z.array(z.string().uuid()).min(1),
  action:     z.enum(["resolve", "close", "assign", "setPriority", "delete"]),
  assigneeId: z.string().uuid().optional(),
  priority:   priorityEnum.optional(),
});

export const savedViewSchema = z.object({
  name:     z.string().min(1).max(60),
  filters:  z.record(z.unknown()),
  isShared: z.boolean().default(false),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ReplyTicketInput  = z.infer<typeof replyTicketSchema>;
export type BulkActionInput   = z.infer<typeof bulkActionSchema>;
export type SavedViewInput    = z.infer<typeof savedViewSchema>;

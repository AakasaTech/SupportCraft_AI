import type { Ticket, TicketMessage, Customer, Profile } from "@/types/database";

export type TicketWithRelations = Ticket & {
  customer: Pick<Customer, "id" | "name" | "email" | "company"> | null;
  assignee: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  message_count?: number;
};

export type TicketMessageWithAuthor = TicketMessage & {
  author: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

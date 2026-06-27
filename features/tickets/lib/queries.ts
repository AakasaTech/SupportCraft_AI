import { createClient } from "@/lib/supabase/server";
import type { TicketStatus, TicketPriority, TicketSource } from "@/types/database";

// ─── Filter / sort params ─────────────────────────────────────────────────────

export interface TicketListParams {
  status?:     TicketStatus | "all";
  priority?:   TicketPriority;
  search?:     string;
  assigneeId?: string;
  customerId?: string;
  department?: string;
  category?:   string;
  source?:     TicketSource;
  unassigned?: boolean;
  dateFrom?:   string;
  dateTo?:     string;
  sort?:       "created_at" | "updated_at" | "priority" | "status";
  order?:      "asc" | "desc";
  page?:       number;
  limit?:      number;
}

const PAGE_SIZE = 25;

// ─── Ticket list (paginated) ──────────────────────────────────────────────────

export async function getTickets(orgId: string, params: TicketListParams = {}) {
  const supabase = await createClient();
  const {
    status, priority, search, assigneeId, customerId,
    department, category, source, unassigned,
    dateFrom, dateTo,
    sort = "updated_at", order = "desc",
    page = 1, limit = PAGE_SIZE,
  } = params;

  let query = supabase
    .from("tickets")
    .select(
      `id, ticket_number, title, status, priority, category, department, source,
       tags, created_at, updated_at, due_date, first_response_at,
       customer:customers!customer_id(id, name, email, company),
       assignee:profiles!tickets_assignee_id_fkey(id, full_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("org_id", orgId)
    .eq("is_spam", false);

  // Filters
  if (status && status !== "all") query = query.eq("status", status);
  if (priority)   query = query.eq("priority", priority);
  if (department) query = query.eq("department", department);
  if (category)   query = query.eq("category", category);
  if (source)     query = query.eq("source", source);
  if (assigneeId) query = query.eq("assignee_id", assigneeId);
  if (customerId) query = query.eq("customer_id", customerId);
  if (unassigned) query = query.is("assignee_id", null);
  if (dateFrom)   query = query.gte("created_at", dateFrom);
  if (dateTo)     query = query.lte("created_at", dateTo);

  // Full-text search
  if (search?.trim()) {
    query = query.textSearch("search_vector", search.trim(), {
      type: "websearch",
      config: "english",
    });
  }

  // Sort
  const ascending = order === "asc";
  if (sort === "priority") {
    // Map priority to numeric rank for sorting
    query = query.order("priority", { ascending });
  } else {
    query = query.order(sort, { ascending });
  }

  // Pagination
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    tickets: data ?? [],
    total:   count ?? 0,
    page,
    pages:   Math.ceil((count ?? 0) / limit),
  };
}

// ─── Ticket detail ────────────────────────────────────────────────────────────

export async function getTicketById(ticketId: string) {
  const supabase = await createClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select(
      `*, customer:customers(*),
       assignee:profiles!tickets_assignee_id_fkey(id, full_name, avatar_url, email, role, job_title)`
    )
    .eq("id", ticketId)
    .single();

  if (ticketError) throw ticketError;

  const { data: messages, error: msgError } = await supabase
    .from("ticket_messages")
    .select(
      `*, author:profiles!ticket_messages_author_id_fkey(id, full_name, avatar_url, role)`
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (msgError) throw msgError;

  const { data: attachments } = await supabase
    .from("ticket_attachments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  return { ticket, messages: messages ?? [], attachments: attachments ?? [] };
}

// ─── Ticket stats ─────────────────────────────────────────────────────────────

export async function getTicketStats(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("tickets")
    .select("status")
    .eq("org_id", orgId)
    .eq("is_spam", false);

  if (error) throw error;

  return {
    new:         data.filter((t) => t.status === "new").length,
    open:        data.filter((t) => t.status === "open").length,
    in_progress: data.filter((t) => t.status === "in_progress").length,
    pending:     data.filter((t) => t.status === "pending").length,
    resolved:    data.filter((t) => t.status === "resolved").length,
    closed:      data.filter((t) => t.status === "closed").length,
    total:       data.length,
  };
}

// ─── Related data ─────────────────────────────────────────────────────────────

export async function getAgents(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, email")
    .eq("org_id", orgId)
    .in("role", ["owner", "admin", "agent"])
    .order("full_name");
  return data ?? [];
}

export async function getDepartments(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .eq("org_id", orgId)
    .order("name");
  return data ?? [];
}

export async function getTicketTemplates(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ticket_templates")
    .select("*")
    .eq("org_id", orgId)
    .order("name");
  return data ?? [];
}

export async function getSavedViews(orgId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("saved_views")
    .select("*")
    .eq("org_id", orgId)
    .or(`user_id.eq.${userId},is_shared.eq.true`)
    .order("name");
  return data ?? [];
}

export async function getCustomerTickets(customerId: string, excludeTicketId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("tickets")
    .select("id, ticket_number, title, status, priority, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(5);
  if (excludeTicketId) query = query.neq("id", excludeTicketId);
  const { data } = await query;
  return data ?? [];
}

export async function getActivityLog(ticketId: string) {
  const supabase = await createClient();

  // Activity log from audit_logs for this ticket
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .filter("metadata->ticketId", "eq", `"${ticketId}"`)
    .order("created_at", { ascending: false })
    .limit(30);
  return data ?? [];
}

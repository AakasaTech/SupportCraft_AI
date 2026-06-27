import { createClient } from "@/lib/supabase/server";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 864e5).toISOString();
}

function startOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

// ─── KPI data ─────────────────────────────────────────────────────────────────

export async function getKpiData(orgId: string, userId: string) {
  const supabase = await createClient();
  const todayStart     = startOfToday();
  const yesterdayStart = startOfYesterday();
  const overdueThresh  = daysAgo(1);
  const monthStart     = startOfMonth();

  const [
    { count: openTotal },
    { count: openYesterday },
    { count: myOpen },
    { count: myHighPriority },
    { count: pending },
    { count: overdue },
    { count: resolvedToday },
    { count: resolvedYesterday },
    { data: aiToday },
    { data: aiMonth },
    { data: resolvedRows },
    { count: aiMsgToday },
  ] = await Promise.all([
    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("status", "open"),

    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("status", "open")
      .lt("created_at", todayStart),

    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("assignee_id", userId)
      .in("status", ["open", "pending"]),

    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("assignee_id", userId)
      .in("priority", ["high", "urgent"])
      .in("status", ["open", "pending"]),

    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("status", "pending"),

    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).in("status", ["open", "pending"])
      .in("priority", ["high", "urgent"])
      .lt("created_at", overdueThresh),

    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("status", "resolved")
      .gte("updated_at", todayStart),

    supabase.from("tickets").select("*", { count: "exact", head: true })
      .eq("org_id", orgId).eq("status", "resolved")
      .gte("updated_at", yesterdayStart).lt("updated_at", todayStart),

    supabase.from("ai_usage_logs").select("tokens_used")
      .eq("org_id", orgId).gte("created_at", todayStart),

    supabase.from("ai_usage_logs").select("tokens_used")
      .eq("org_id", orgId).gte("created_at", monthStart),

    // For avg resolution hours
    supabase.from("tickets").select("created_at, updated_at")
      .eq("org_id", orgId).eq("status", "resolved")
      .gte("updated_at", monthStart).limit(100),

    // AI suggestions today (AI messages)
    supabase.from("ticket_messages").select("*", { count: "exact", head: true })
      .eq("is_ai", true)
      .gte("created_at", todayStart),
  ]);

  const todayAiRequests = aiToday?.length ?? 0;
  const todayTokens     = aiToday?.reduce((s, r) => s + (r.tokens_used ?? 0), 0) ?? 0;
  const monthTokens     = aiMonth?.reduce((s, r) => s + (r.tokens_used ?? 0), 0) ?? 0;

  const resolvedDelta = (resolvedToday ?? 0) - (resolvedYesterday ?? 0);
  const openDelta     = (openTotal ?? 0) - (openYesterday ?? 0);

  // Avg resolution time (hours)
  let avgResolutionHours = 0;
  if (resolvedRows?.length) {
    const total = resolvedRows.reduce((sum, t) => {
      const ms = new Date(t.updated_at).getTime() - new Date(t.created_at).getTime();
      return sum + Math.max(ms, 0);
    }, 0);
    avgResolutionHours = parseFloat((total / resolvedRows.length / 36e5).toFixed(1));
  }

  const aiSuggestionCount = aiMsgToday ?? 0;
  const aiTimeSavedHours  = parseFloat((aiSuggestionCount * 0.3).toFixed(1));

  return {
    openTotal:          openTotal ?? 0,
    openDelta,
    myOpen:             myOpen ?? 0,
    myHighPriority:     myHighPriority ?? 0,
    pending:            pending ?? 0,
    overdue:            overdue ?? 0,
    resolvedToday:      resolvedToday ?? 0,
    resolvedDelta,
    aiRequestsToday:    todayAiRequests,
    aiTokensToday:      todayTokens,
    aiTokensMonth:      monthTokens,
    avgResolutionHours,
    aiSuggestionCount,
    aiTimeSavedHours,
    slaBreachedCount:   overdue ?? 0,
    csatScore:          0,           // no ratings table yet
  };
}

// ─── Chart data ───────────────────────────────────────────────────────────────

export interface DayPoint {
  label:    string;
  created:  number;
  resolved: number;
}

export interface StatusSlice {
  name:  string;
  value: number;
  color: string;
}

export interface PriorityBar {
  priority: string;
  count:    number;
}

export async function getChartData(orgId: string) {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("status, priority, created_at, updated_at")
    .eq("org_id", orgId)
    .gte("created_at", daysAgo(30))
    .order("created_at");

  const rows = tickets ?? [];

  // Last 7 days volume
  const volumeMap: Record<string, { created: number; resolved: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    volumeMap[key] = { created: 0, resolved: 0 };
  }

  rows.forEach((t) => {
    const dayLabel = new Date(t.created_at).toLocaleDateString("en-US", { weekday: "short" });
    if (volumeMap[dayLabel]) volumeMap[dayLabel].created++;
    if (t.status === "resolved" && t.updated_at) {
      const resLabel = new Date(t.updated_at).toLocaleDateString("en-US", { weekday: "short" });
      if (volumeMap[resLabel]) volumeMap[resLabel].resolved++;
    }
  });

  const volumeData: DayPoint[] = Object.entries(volumeMap).map(([label, v]) => ({
    label,
    ...v,
  }));

  // Status distribution (all-time for org)
  const { data: allTickets } = await supabase
    .from("tickets")
    .select("status")
    .eq("org_id", orgId);

  const statusCounts: Record<string, number> = { open: 0, pending: 0, resolved: 0, closed: 0 };
  (allTickets ?? []).forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1; });

  const statusData: StatusSlice[] = [
    { name: "Open",     value: statusCounts.open,     color: "#5148D0" },
    { name: "Pending",  value: statusCounts.pending,  color: "#D97706" },
    { name: "Resolved", value: statusCounts.resolved, color: "#16A34A" },
    { name: "Closed",   value: statusCounts.closed,   color: "#64748B" },
  ].filter((s) => s.value > 0);

  // Priority distribution (open/pending only)
  const priorityCounts: Record<string, number> = { urgent: 0, high: 0, medium: 0, low: 0 };
  rows.filter((t) => ["open", "pending"].includes(t.status))
      .forEach((t) => { priorityCounts[t.priority] = (priorityCounts[t.priority] ?? 0) + 1; });

  const priorityData: PriorityBar[] = [
    { priority: "Urgent", count: priorityCounts.urgent },
    { priority: "High",   count: priorityCounts.high },
    { priority: "Medium", count: priorityCounts.medium },
    { priority: "Low",    count: priorityCounts.low },
  ];

  return { volumeData, statusData, priorityData };
}

// ─── Assigned tickets widget ──────────────────────────────────────────────────

export interface AssignedTicket {
  id:           string;
  title:        string;
  status:       string;
  priority:     string;
  customerName: string;
  updatedAt:    string;
  isOverdue:    boolean;
}

export async function getAssignedTickets(orgId: string, userId: string): Promise<AssignedTicket[]> {
  const supabase = await createClient();
  const overdueThresh = daysAgo(1);

  const { data } = await supabase
    .from("tickets")
    .select("id, title, status, priority, updated_at, created_at, customers(name)")
    .eq("org_id", orgId)
    .eq("assignee_id", userId)
    .in("status", ["open", "pending"])
    .order("updated_at", { ascending: false })
    .limit(8);

  return (data ?? []).map((t) => {
    const customer = Array.isArray(t.customers) ? t.customers[0] : t.customers;
    return {
      id:           t.id,
      title:        t.title,
      status:       t.status,
      priority:     t.priority,
      customerName: (customer as { name: string } | null)?.name ?? "Unknown",
      updatedAt:    t.updated_at,
      isOverdue:    ["high", "urgent"].includes(t.priority) && t.created_at < overdueThresh,
    };
  });
}

// ─── Recent activity ──────────────────────────────────────────────────────────

export interface ActivityItem {
  id:          string;
  type:        "ticket_created" | "ticket_resolved" | "ticket_replied" | "ticket_assigned" | "ai_suggestion" | "article_published";
  actorName:   string;
  description: string;
  ticketId?:   string;
  ticketTitle?: string;
  createdAt:   string;
}

export async function getRecentActivity(orgId: string): Promise<ActivityItem[]> {
  const supabase = await createClient();

  const [{ data: recentMessages }, { data: recentTickets }] = await Promise.all([
    supabase.from("ticket_messages")
      .select("id, content, is_ai, is_customer, created_at, tickets!inner(id, title, org_id)")
      .eq("tickets.org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10),

    supabase.from("tickets")
      .select("id, title, status, created_at, updated_at")
      .eq("org_id", orgId)
      .order("updated_at", { ascending: false })
      .limit(6),
  ]);

  const items: ActivityItem[] = [];

  (recentMessages ?? []).forEach((m) => {
    const ticket = Array.isArray(m.tickets) ? m.tickets[0] : m.tickets;
    const ticketData = ticket as { id: string; title: string } | null;
    items.push({
      id:          m.id,
      type:        m.is_ai ? "ai_suggestion" : m.is_customer ? "ticket_replied" : "ticket_replied",
      actorName:   m.is_ai ? "AI" : m.is_customer ? "Customer" : "Agent",
      description: m.is_ai ? "drafted a reply for" : "replied to",
      ticketId:    ticketData?.id,
      ticketTitle: ticketData?.title,
      createdAt:   m.created_at,
    });
  });

  (recentTickets ?? []).forEach((t) => {
    const isResolved = t.status === "resolved";
    items.push({
      id:          `ticket-${t.id}`,
      type:        isResolved ? "ticket_resolved" : "ticket_created",
      actorName:   isResolved ? "Team" : "Customer",
      description: isResolved ? "resolved" : "opened",
      ticketId:    t.id,
      ticketTitle: t.title,
      createdAt:   isResolved ? t.updated_at : t.created_at,
    });
  });

  return items
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
}

// ─── Team performance ─────────────────────────────────────────────────────────

export interface TeamMemberStats {
  userId:            string;
  fullName:          string;
  role:              string;
  openTickets:       number;
  resolvedThisMonth: number;
  avgReplyMinutes:   number;
  csatScore:         number;
}

export async function getTeamPerformance(orgId: string): Promise<TeamMemberStats[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("org_id", orgId)
    .limit(10);

  if (!members?.length) return [];

  const memberIds  = members.map((m) => m.id);
  const monthStart = startOfMonth();

  const [{ data: openTickets }, { data: resolvedMonth }] = await Promise.all([
    supabase.from("tickets")
      .select("assignee_id")
      .eq("org_id", orgId)
      .in("status", ["open", "pending"])
      .in("assignee_id", memberIds),

    supabase.from("tickets")
      .select("assignee_id")
      .eq("org_id", orgId)
      .eq("status", "resolved")
      .gte("updated_at", monthStart)
      .in("assignee_id", memberIds),
  ]);

  const openMap:     Record<string, number> = {};
  const resolvedMap: Record<string, number> = {};

  (openTickets ?? []).forEach((t) => {
    if (t.assignee_id) openMap[t.assignee_id] = (openMap[t.assignee_id] ?? 0) + 1;
  });
  (resolvedMonth ?? []).forEach((t) => {
    if (t.assignee_id) resolvedMap[t.assignee_id] = (resolvedMap[t.assignee_id] ?? 0) + 1;
  });

  return members.map((m) => ({
    userId:            m.id,
    fullName:          m.full_name,
    role:              m.role,
    openTickets:       openMap[m.id] ?? 0,
    resolvedThisMonth: resolvedMap[m.id] ?? 0,
    avgReplyMinutes:   0,   // requires message timing — future enhancement
    csatScore:         0,   // no ratings table yet
  })).sort((a, b) => (b.resolvedThisMonth + b.openTickets) - (a.resolvedThisMonth + a.openTickets));
}

// ─── SLA / overdue tickets ────────────────────────────────────────────────────

export interface SlaTicket {
  id:           string;
  title:        string;
  customerName: string;
  assigneeName?: string;
  hoursOverdue: number;
}

export async function getSlaTickets(orgId: string): Promise<SlaTicket[]> {
  const supabase = await createClient();
  const threshold = daysAgo(0.5); // > 12h old

  const { data } = await supabase
    .from("tickets")
    .select("id, title, created_at, customers(name), profiles!assignee_id(full_name)")
    .eq("org_id", orgId)
    .in("status", ["open", "pending"])
    .in("priority", ["high", "urgent"])
    .lt("created_at", threshold)
    .order("created_at")
    .limit(8);

  const now = Date.now();
  return (data ?? []).map((t) => {
    const customer = Array.isArray(t.customers) ? t.customers[0] : t.customers;
    const assignee = Array.isArray(t.profiles)  ? t.profiles[0]  : t.profiles;
    return {
      id:           t.id,
      title:        t.title,
      customerName: (customer as { name: string } | null)?.name ?? "Unknown",
      assigneeName: (assignee as { full_name: string } | null)?.full_name,
      hoursOverdue: parseFloat(
        ((now - new Date(t.created_at).getTime()) / 36e5).toFixed(1)
      ),
    };
  });
}

// ─── Customer insights ────────────────────────────────────────────────────────

export interface CustomerInsight {
  id:          string;
  name:        string;
  email:       string;
  ticketCount: number;
  openTickets: number;
}

export async function getCustomerInsights(orgId: string): Promise<CustomerInsight[]> {
  const supabase = await createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("customer_id, status, customers(id, name, email)")
    .eq("org_id", orgId)
    .not("customer_id", "is", null)
    .limit(200);

  const customerMap: Record<string, { name: string; email: string; count: number; open: number }> = {};

  (tickets ?? []).forEach((t) => {
    const c = Array.isArray(t.customers) ? t.customers[0] : t.customers;
    const customer = c as { id: string; name: string; email: string } | null;
    if (!customer || !t.customer_id) return;
    const id = t.customer_id;
    if (!customerMap[id]) {
      customerMap[id] = { name: customer.name, email: customer.email, count: 0, open: 0 };
    }
    customerMap[id].count++;
    if (["open", "pending"].includes(t.status)) customerMap[id].open++;
  });

  return Object.entries(customerMap)
    .map(([id, v]) => ({ id, name: v.name, email: v.email, ticketCount: v.count, openTickets: v.open }))
    .sort((a, b) => b.ticketCount - a.ticketCount)
    .slice(0, 8);
}

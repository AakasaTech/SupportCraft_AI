import { prisma } from "@/lib/prisma";

// ─── Date helpers ─────────────────────────────────────────────────────────────

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 864e5);
}

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ─── KPI data ─────────────────────────────────────────────────────────────────

export async function getKpiData(orgId: string, userId: string) {
  const todayStart     = startOfToday();
  const yesterdayStart = startOfYesterday();
  const overdueThresh  = daysAgo(1);
  const monthStart     = startOfMonth();

  const [
    openTotal,
    openYesterday,
    myOpen,
    myHighPriority,
    pending,
    overdue,
    resolvedToday,
    resolvedYesterday,
    aiToday,
    aiMonth,
    resolvedRows,
    aiMsgToday,
  ] = await Promise.all([
    prisma.ticket.count({ where: { organizationId: orgId, status: "open" } }),

    prisma.ticket.count({ where: { organizationId: orgId, status: "open", createdAt: { lt: todayStart } } }),

    prisma.ticket.count({ where: { organizationId: orgId, assigneeId: userId, status: { in: ["open", "pending"] } } }),

    prisma.ticket.count({
      where: { organizationId: orgId, assigneeId: userId, priority: { in: ["high", "urgent"] }, status: { in: ["open", "pending"] } },
    }),

    prisma.ticket.count({ where: { organizationId: orgId, status: "pending" } }),

    prisma.ticket.count({
      where: { organizationId: orgId, status: { in: ["open", "pending"] }, priority: { in: ["high", "urgent"] }, createdAt: { lt: overdueThresh } },
    }),

    prisma.ticket.count({ where: { organizationId: orgId, status: "resolved", updatedAt: { gte: todayStart } } }),

    prisma.ticket.count({
      where: { organizationId: orgId, status: "resolved", updatedAt: { gte: yesterdayStart, lt: todayStart } },
    }),

    prisma.aiUsageLog.findMany({ where: { organizationId: orgId, createdAt: { gte: todayStart } }, select: { tokensUsed: true } }),

    prisma.aiUsageLog.findMany({ where: { organizationId: orgId, createdAt: { gte: monthStart } }, select: { tokensUsed: true } }),

    // For avg resolution hours
    prisma.ticket.findMany({
      where: { organizationId: orgId, status: "resolved", updatedAt: { gte: monthStart } },
      select: { createdAt: true, updatedAt: true },
      take: 100,
    }),

    // AI suggestions today (AI messages)
    prisma.ticketMessage.count({ where: { isAi: true, createdAt: { gte: todayStart } } }),
  ]);

  const todayAiRequests = aiToday.length;
  const todayTokens     = aiToday.reduce((s, r) => s + (r.tokensUsed ?? 0), 0);
  const monthTokens     = aiMonth.reduce((s, r) => s + (r.tokensUsed ?? 0), 0);

  const resolvedDelta = resolvedToday - resolvedYesterday;
  const openDelta     = openTotal - openYesterday;

  // Avg resolution time (hours)
  let avgResolutionHours = 0;
  if (resolvedRows.length) {
    const total = resolvedRows.reduce((sum, t) => {
      const ms = t.updatedAt.getTime() - t.createdAt.getTime();
      return sum + Math.max(ms, 0);
    }, 0);
    avgResolutionHours = parseFloat((total / resolvedRows.length / 36e5).toFixed(1));
  }

  const aiSuggestionCount = aiMsgToday;
  const aiTimeSavedHours  = parseFloat((aiSuggestionCount * 0.3).toFixed(1));

  return {
    openTotal,
    openDelta,
    myOpen,
    myHighPriority,
    pending,
    overdue,
    resolvedToday,
    resolvedDelta,
    aiRequestsToday:    todayAiRequests,
    aiTokensToday:      todayTokens,
    aiTokensMonth:      monthTokens,
    avgResolutionHours,
    aiSuggestionCount,
    aiTimeSavedHours,
    slaBreachedCount:   overdue,
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
  const rows = await prisma.ticket.findMany({
    where:   { organizationId: orgId, createdAt: { gte: daysAgo(30) } },
    select:  { status: true, priority: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Last 7 days volume
  const volumeMap: Record<string, { created: number; resolved: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    volumeMap[key] = { created: 0, resolved: 0 };
  }

  rows.forEach((t) => {
    const dayLabel = t.createdAt.toLocaleDateString("en-US", { weekday: "short" });
    if (volumeMap[dayLabel]) volumeMap[dayLabel].created++;
    if (t.status === "resolved" && t.updatedAt) {
      const resLabel = t.updatedAt.toLocaleDateString("en-US", { weekday: "short" });
      if (volumeMap[resLabel]) volumeMap[resLabel].resolved++;
    }
  });

  const volumeData: DayPoint[] = Object.entries(volumeMap).map(([label, v]) => ({
    label,
    ...v,
  }));

  // Status distribution (all-time for org)
  const allTickets = await prisma.ticket.findMany({
    where:  { organizationId: orgId },
    select: { status: true },
  });

  const statusCounts: Record<string, number> = { open: 0, pending: 0, resolved: 0, closed: 0 };
  allTickets.forEach((t) => { statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1; });

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
  const overdueThresh = daysAgo(1);

  const rows = await prisma.ticket.findMany({
    where: {
      organizationId: orgId,
      assigneeId: userId,
      status: { in: ["open", "pending"] },
    },
    select: {
      id: true, title: true, status: true, priority: true, updatedAt: true, createdAt: true,
      customer: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return rows.map((t) => ({
    id:           t.id,
    title:        t.title,
    status:       t.status,
    priority:     t.priority,
    customerName: t.customer?.name ?? "Unknown",
    updatedAt:    t.updatedAt.toISOString(),
    isOverdue:    ["high", "urgent"].includes(t.priority) && t.createdAt < overdueThresh,
  }));
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
  const [recentMessages, recentTickets] = await Promise.all([
    prisma.ticketMessage.findMany({
      where:   { ticket: { organizationId: orgId } },
      select:  { id: true, isAi: true, isCustomer: true, createdAt: true, ticket: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take:    10,
    }),

    prisma.ticket.findMany({
      where:   { organizationId: orgId },
      select:  { id: true, title: true, status: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take:    6,
    }),
  ]);

  const items: ActivityItem[] = [];

  recentMessages.forEach((m) => {
    items.push({
      id:          m.id,
      type:        m.isAi ? "ai_suggestion" : m.isCustomer ? "ticket_replied" : "ticket_replied",
      actorName:   m.isAi ? "AI" : m.isCustomer ? "Customer" : "Agent",
      description: m.isAi ? "drafted a reply for" : "replied to",
      ticketId:    m.ticket.id,
      ticketTitle: m.ticket.title,
      createdAt:   m.createdAt.toISOString(),
    });
  });

  recentTickets.forEach((t) => {
    const isResolved = t.status === "resolved";
    items.push({
      id:          `ticket-${t.id}`,
      type:        isResolved ? "ticket_resolved" : "ticket_created",
      actorName:   isResolved ? "Team" : "Customer",
      description: isResolved ? "resolved" : "opened",
      ticketId:    t.id,
      ticketTitle: t.title,
      createdAt:   (isResolved ? t.updatedAt : t.createdAt).toISOString(),
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
  const members = await prisma.profile.findMany({
    where:  { organizationId: orgId },
    select: { id: true, fullName: true, role: true },
    take:   10,
  });

  if (!members.length) return [];

  const memberIds  = members.map((m) => m.id);
  const monthStart = startOfMonth();

  const [openTickets, resolvedMonth] = await Promise.all([
    prisma.ticket.findMany({
      where:  { organizationId: orgId, status: { in: ["open", "pending"] }, assigneeId: { in: memberIds } },
      select: { assigneeId: true },
    }),

    prisma.ticket.findMany({
      where:  { organizationId: orgId, status: "resolved", updatedAt: { gte: monthStart }, assigneeId: { in: memberIds } },
      select: { assigneeId: true },
    }),
  ]);

  const openMap:     Record<string, number> = {};
  const resolvedMap: Record<string, number> = {};

  openTickets.forEach((t) => {
    if (t.assigneeId) openMap[t.assigneeId] = (openMap[t.assigneeId] ?? 0) + 1;
  });
  resolvedMonth.forEach((t) => {
    if (t.assigneeId) resolvedMap[t.assigneeId] = (resolvedMap[t.assigneeId] ?? 0) + 1;
  });

  return members.map((m) => ({
    userId:            m.id,
    fullName:          m.fullName,
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
  const threshold = daysAgo(0.5); // > 12h old

  const rows = await prisma.ticket.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["open", "pending"] },
      priority: { in: ["high", "urgent"] },
      createdAt: { lt: threshold },
    },
    select: {
      id: true, title: true, createdAt: true,
      customer: { select: { name: true } },
      assignee: { select: { fullName: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 8,
  });

  const now = Date.now();
  return rows.map((t) => ({
    id:           t.id,
    title:        t.title,
    customerName: t.customer?.name ?? "Unknown",
    assigneeName: t.assignee?.fullName,
    hoursOverdue: parseFloat(
      ((now - t.createdAt.getTime()) / 36e5).toFixed(1)
    ),
  }));
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
  const tickets = await prisma.ticket.findMany({
    where:  { organizationId: orgId, customerId: { not: null } },
    select: { customerId: true, status: true, customer: { select: { id: true, name: true, email: true } } },
    take:   200,
  });

  const customerMap: Record<string, { name: string; email: string; count: number; open: number }> = {};

  tickets.forEach((t) => {
    if (!t.customer || !t.customerId) return;
    const id = t.customerId;
    if (!customerMap[id]) {
      customerMap[id] = { name: t.customer.name, email: t.customer.email, count: 0, open: 0 };
    }
    customerMap[id].count++;
    if (["open", "pending"].includes(t.status)) customerMap[id].open++;
  });

  return Object.entries(customerMap)
    .map(([id, v]) => ({ id, name: v.name, email: v.email, ticketCount: v.count, openTickets: v.open }))
    .sort((a, b) => b.ticketCount - a.ticketCount)
    .slice(0, 8);
}

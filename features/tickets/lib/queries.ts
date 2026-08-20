import { prisma } from "@/lib/prisma";
import type { Prisma, TicketStatus, TicketPriority } from "@/lib/generated/prisma/client";

// ─── Filter / sort params ─────────────────────────────────────────────────────

export interface TicketListParams {
  status?:     TicketStatus | "all";
  priority?:   TicketPriority;
  search?:     string;
  assigneeId?: string;
  customerId?: string;
  department?: string;
  category?:   string;
  source?:     string;
  unassigned?: boolean;
  dateFrom?:   string;
  dateTo?:     string;
  sort?:       "created_at" | "updated_at" | "priority" | "status" | "ticket_number";
  order?:      "asc" | "desc";
  page?:       number;
  limit?:      number;
}

const PAGE_SIZE = 25;

const SORT_FIELD_MAP: Record<NonNullable<TicketListParams["sort"]>, "createdAt" | "updatedAt" | "priority" | "status" | "ticketNumber"> = {
  created_at: "createdAt",
  updated_at: "updatedAt",
  priority: "priority",
  status: "status",
  ticket_number: "ticketNumber",
};

// ─── Ticket list (paginated) ──────────────────────────────────────────────────

export async function getTickets(orgId: string, params: TicketListParams = {}) {
  const {
    status, priority, search, assigneeId, customerId,
    department, category, source, unassigned,
    dateFrom, dateTo,
    sort = "updated_at", order = "desc",
    page = 1, limit = PAGE_SIZE,
  } = params;

  const where: Prisma.TicketWhereInput = {
    organizationId: orgId,
    isSpam: false,
  };

  if (status && status !== "all") where.status = status;
  if (priority) where.priority = priority;
  if (department) where.department = department;
  if (category) where.category = category;
  if (source) where.source = source;
  if (assigneeId) where.assigneeId = assigneeId;
  if (customerId) where.customerId = customerId;
  if (unassigned) where.assigneeId = null;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
      ...(dateTo ? { lte: new Date(dateTo) } : {}),
    };
  }

  // Full-text search: resolve matching ticket IDs via the trigger-maintained
  // search_vector column (Prisma has no native tsvector query support), then
  // fold that into the normal Prisma where-clause so all other filters,
  // sorting, and pagination stay type-safe.
  if (search?.trim()) {
    const matches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM tickets
      WHERE org_id = ${orgId}
        AND search_vector @@ websearch_to_tsquery('english', ${search.trim()})
    `;
    where.id = { in: matches.map((m) => m.id) };
  }

  const skip = (page - 1) * limit;

  const [tickets, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      select: {
        id: true, ticketNumber: true, title: true, status: true, priority: true,
        category: true, department: true, source: true, tags: true,
        createdAt: true, updatedAt: true, dueDate: true, firstResponseAt: true,
        customer: { select: { id: true, name: true, email: true, company: true } },
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { [SORT_FIELD_MAP[sort]]: order },
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    tickets,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
}

// ─── Ticket detail ────────────────────────────────────────────────────────────

export async function getTicketById(ticketId: string) {
  const [ticket, messages, attachments] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        assignee: {
          select: { id: true, fullName: true, avatarUrl: true, email: true, role: true, jobTitle: true },
        },
      },
    }),
    prisma.ticketMessage.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ticketAttachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { ticket, messages, attachments };
}

// ─── Ticket stats ─────────────────────────────────────────────────────────────

export async function getTicketStats(orgId: string) {
  const counts = await prisma.ticket.groupBy({
    by: ["status"],
    where: { organizationId: orgId, isSpam: false },
    _count: { _all: true },
  });

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  return {
    new: byStatus.new ?? 0,
    open: byStatus.open ?? 0,
    in_progress: byStatus.in_progress ?? 0,
    pending: byStatus.pending ?? 0,
    resolved: byStatus.resolved ?? 0,
    closed: byStatus.closed ?? 0,
    total: counts.reduce((sum, c) => sum + c._count._all, 0),
  };
}

// ─── Related data ─────────────────────────────────────────────────────────────

export async function getAgents(orgId: string) {
  return prisma.profile.findMany({
    where: { organizationId: orgId, role: { in: ["owner", "admin", "agent"] } },
    select: { id: true, fullName: true, avatarUrl: true, role: true, email: true },
    orderBy: { fullName: "asc" },
  });
}

export async function getDepartments(orgId: string) {
  return prisma.department.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function getTicketTemplates(orgId: string) {
  return prisma.ticketTemplate.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function getSavedViews(orgId: string, userId: string) {
  return prisma.savedView.findMany({
    where: {
      organizationId: orgId,
      OR: [{ userId }, { isShared: true }],
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerTickets(customerId: string, excludeTicketId?: string) {
  return prisma.ticket.findMany({
    where: {
      customerId,
      ...(excludeTicketId ? { id: { not: excludeTicketId } } : {}),
    },
    select: { id: true, ticketNumber: true, title: true, status: true, priority: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export async function getActivityLog(ticketId: string) {
  return prisma.auditLog.findMany({
    where: { metadata: { path: ["ticketId"], equals: ticketId } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

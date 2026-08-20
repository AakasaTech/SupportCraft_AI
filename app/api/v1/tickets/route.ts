import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import type { TicketStatus } from '@/lib/generated/prisma/client'

// ── Status / priority mappings ────────────────────────────────────────────────
//
// SupportCraft DB statuses: new | open | in_progress | pending | resolved | closed
// TaskCraft expected:       open | pending | resolved | closed
//
// SupportCraft DB priorities: low | medium | high | urgent
// TaskCraft expected:         low | normal  | high | urgent

type TcStatus = 'open' | 'pending' | 'resolved' | 'closed'

// TaskCraft status → one or more SupportCraft DB statuses for filtering
const TC_TO_SC_STATUS: Record<TcStatus, TicketStatus[]> = {
  open:     ['new', 'open'],
  pending:  ['in_progress', 'pending'],
  resolved: ['resolved'],
  closed:   ['closed'],
}

// SupportCraft DB status → TaskCraft status for responses
function scStatusToTc(status: string): TcStatus {
  if (status === 'new' || status === 'open')       return 'open'
  if (status === 'in_progress' || status === 'pending') return 'pending'
  if (status === 'resolved') return 'resolved'
  return 'closed'
}

// SupportCraft DB priority → TaskCraft priority
function scPriorityToTc(priority: string): string {
  return priority === 'medium' ? 'normal' : priority
}

// ── GET /api/v1/tickets ───────────────────────────────────────────────────────
// Query params: status (TaskCraft value), per_page (default 50), page (default 1)
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get('Authorization'))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get('status') as TcStatus | null
  const perPage     = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page        = Math.max(1, Number(searchParams.get('page') ?? 1))
  const offset      = (page - 1) * perPage

  const where = {
    organizationId: auth.orgId,
    isSpam: false,
    ...(statusParam && TC_TO_SC_STATUS[statusParam] ? { status: { in: TC_TO_SC_STATUS[statusParam] } } : {}),
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      select: {
        id: true, ticketNumber: true, title: true, description: true, status: true, priority: true,
        customerId: true, createdAt: true, updatedAt: true, customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: perPage,
    }),
    prisma.ticket.count({ where }),
  ])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return NextResponse.json({
    data: tickets.map((t) => ({
      id:          t.id,
      number:      t.ticketNumber,
      title:       t.title,
      description: t.description ?? '',
      status:      scStatusToTc(t.status),
      priority:    scPriorityToTc(t.priority),
      client_id:   t.customerId,
      client_name: t.customer?.name ?? '',
      url:         `${baseUrl}/tickets/${t.id}`,
      created_at:  t.createdAt,
      updated_at:  t.updatedAt,
    })),
    total,
    page,
    per_page: perPage,
  })
}

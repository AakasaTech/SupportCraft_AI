import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'
import { dispatchWebhookEvent } from '@/lib/webhooks'

// ── Status / priority helpers ─────────────────────────────────────────────────

type TcStatus = 'open' | 'pending' | 'resolved' | 'closed'

function scStatusToTc(status: string): TcStatus {
  if (status === 'new' || status === 'open')            return 'open'
  if (status === 'in_progress' || status === 'pending') return 'pending'
  if (status === 'resolved')                            return 'resolved'
  return 'closed'
}

function tcStatusToSc(status: TcStatus): 'open' | 'in_progress' | 'resolved' | 'closed' {
  const map: Record<TcStatus, 'open' | 'in_progress' | 'resolved' | 'closed'> = {
    open:     'open',
    pending:  'in_progress',
    resolved: 'resolved',
    closed:   'closed',
  }
  return map[status]
}

function scPriorityToTc(priority: string): string {
  return priority === 'medium' ? 'normal' : priority
}

// ── GET /api/v1/tickets/:id ───────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await validateApiKey(req.headers.get('Authorization'))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const t = await prisma.ticket.findFirst({
    where: { id, organizationId: auth.orgId },
    select: {
      id: true, ticketNumber: true, title: true, description: true, status: true, priority: true,
      customerId: true, createdAt: true, updatedAt: true, customer: { select: { name: true } },
    },
  })

  if (!t) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return NextResponse.json({
    data: {
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
    },
  })
}

// ── PATCH /api/v1/tickets/:id ─────────────────────────────────────────────────
// Body: { status: 'open' | 'pending' | 'resolved' | 'closed' }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await validateApiKey(req.headers.get('Authorization'))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  let body: { status?: TcStatus }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const validStatuses: TcStatus[] = ['open', 'pending', 'resolved', 'closed']
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  const scStatus = tcStatusToSc(body.status)

  // Verify ticket belongs to this org
  const existing = await prisma.ticket.findFirst({
    where: { id, organizationId: auth.orgId },
    select: { id: true },
  })

  if (!existing) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const now = new Date()
  const { count } = await prisma.ticket.updateMany({
    where: { id, organizationId: auth.orgId },
    data: {
      status: scStatus,
      ...(body.status === 'resolved' ? { resolvedAt: now } : {}),
      ...(body.status === 'closed'   ? { closedAt: now }   : {}),
    },
  })

  if (count === 0) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  // Fire webhook non-blocking — fetch updated ticket for payload
  prisma.ticket.findUnique({
    where: { id },
    select: { ticketNumber: true, title: true, status: true, priority: true },
  }).then((t) => {
    if (t) dispatchWebhookEvent(auth.orgId, 'ticket.status_changed', {
      id,
      number:   t.ticketNumber ?? '',
      title:    t.title,
      status:   t.status,
      priority: t.priority,
      url:      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/tickets/${id}`,
    }).catch(() => {})
  }).catch(() => {})

  return NextResponse.json({ data: { id, status: body.status } })
}

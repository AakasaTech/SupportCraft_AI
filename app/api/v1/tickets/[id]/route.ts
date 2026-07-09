import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks'

// ── Status / priority helpers ─────────────────────────────────────────────────

type TcStatus = 'open' | 'pending' | 'resolved' | 'closed'

function scStatusToTc(status: string): TcStatus {
  if (status === 'new' || status === 'open')            return 'open'
  if (status === 'in_progress' || status === 'pending') return 'pending'
  if (status === 'resolved')                            return 'resolved'
  return 'closed'
}

function tcStatusToSc(status: TcStatus): string {
  const map: Record<TcStatus, string> = {
    open:     'open',
    pending:  'in_progress',
    resolved: 'resolved',
    closed:   'closed',
  }
  return map[status] ?? status
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
  const db = createAdminClient()

  const { data: t, error } = await db
    .from('tickets')
    .select(`
      id,
      ticket_number,
      title,
      description,
      status,
      priority,
      customer_id,
      created_at,
      updated_at,
      customers ( name )
    `)
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .single()

  if (error || !t) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return NextResponse.json({
    data: {
      id:          t.id,
      number:      t.ticket_number,
      title:       t.title,
      description: t.description ?? '',
      status:      scStatusToTc(t.status),
      priority:    scPriorityToTc(t.priority),
      client_id:   t.customer_id,
      client_name: (t.customers as unknown as { name: string } | null)?.name ?? '',
      url:         `${baseUrl}/tickets/${t.id}`,
      created_at:  t.created_at,
      updated_at:  t.updated_at,
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
  const db = createAdminClient()

  // Verify ticket belongs to this org
  const { data: existing } = await db
    .from('tickets')
    .select('id')
    .eq('id', id)
    .eq('org_id', auth.orgId)
    .single()

  if (!existing) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const now = new Date().toISOString()
  const updates: Record<string, string | null> = {
    status:     scStatus,
    updated_at: now,
  }
  if (body.status === 'resolved') updates.resolved_at = now
  if (body.status === 'closed')   updates.closed_at   = now

  const { error } = await db
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .eq('org_id', auth.orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire webhook non-blocking — fetch updated ticket for payload
  db.from('tickets').select('ticket_number, title, status, priority').eq('id', id).single()
    .then(({ data: t }) => {
      if (t) dispatchWebhookEvent(auth.orgId, 'ticket.status_changed', {
        id,
        number:   t.ticket_number ?? '',
        title:    t.title,
        status:   t.status,
        priority: t.priority,
        url:      `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/tickets/${id}`,
      }).catch(() => {})
    })

  return NextResponse.json({ data: { id, status: body.status } })
}

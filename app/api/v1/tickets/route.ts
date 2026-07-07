import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

// ── Status / priority mappings ────────────────────────────────────────────────
//
// SupportCraft DB statuses: new | open | in_progress | pending | resolved | closed
// TaskCraft expected:       open | pending | resolved | closed
//
// SupportCraft DB priorities: low | medium | high | urgent
// TaskCraft expected:         low | normal  | high | urgent

type ScStatus = 'new' | 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
type TcStatus = 'open' | 'pending' | 'resolved' | 'closed'

// TaskCraft status → one or more SupportCraft DB statuses for filtering
const TC_TO_SC_STATUS: Record<TcStatus, ScStatus[]> = {
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

  const db = createAdminClient()

  let query = db
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
    `, { count: 'exact' })
    .eq('org_id', auth.orgId)
    .eq('is_spam', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (statusParam && TC_TO_SC_STATUS[statusParam]) {
    query = query.in('status', TC_TO_SC_STATUS[statusParam])
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return NextResponse.json({
    data: (data ?? []).map((t) => ({
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
    })),
    total:    count ?? 0,
    page,
    per_page: perPage,
  })
}

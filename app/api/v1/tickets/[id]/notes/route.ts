import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

// ── POST /api/v1/tickets/:id/notes ───────────────────────────────────────────
// Body: { content: string; is_internal?: boolean }
// Creates an internal ticket message (note) attributed to the API integration.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await validateApiKey(req.headers.get('Authorization'))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: ticketId } = await params

  let body: { content?: string; is_internal?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content = (body.content ?? '').trim()
  if (!content) return NextResponse.json({ error: 'content is required' }, { status: 400 })

  const isInternal = body.is_internal !== false // default true

  const db = createAdminClient()

  // Verify ticket belongs to this org
  const { data: ticket } = await db
    .from('tickets')
    .select('id')
    .eq('id', ticketId)
    .eq('org_id', auth.orgId)
    .single()

  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const { data: message, error } = await db
    .from('ticket_messages')
    .insert({
      ticket_id:   ticketId,
      author_id:   null,       // API-created — no agent profile
      content,
      is_internal: isInternal,
      is_customer: false,
      is_ai:       false,
      metadata:    { source: 'api', via: 'taskcraft' },
    })
    .select('id, ticket_id, content, is_internal, created_at')
    .single()

  if (error || !message) {
    return NextResponse.json({ error: error?.message ?? 'Failed to add note' }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      id:          message.id,
      ticket_id:   message.ticket_id,
      content:     message.content,
      author:      'TaskCraft AI',
      is_internal: message.is_internal,
      created_at:  message.created_at,
    },
  }, { status: 201 })
}

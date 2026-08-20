import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

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

  // Verify ticket belongs to this org
  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, organizationId: auth.orgId },
    select: { id: true },
  })

  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  let message
  try {
    message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId:   null, // API-created — no agent profile
        content,
        isInternal,
        isCustomer: false,
        isAi:       false,
        metadata:   { source: 'api', via: 'taskcraft' },
      },
      select: { id: true, ticketId: true, content: true, isInternal: true, createdAt: true },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to add note' }, { status: 500 })
  }

  return NextResponse.json({
    data: {
      id:          message.id,
      ticket_id:   message.ticketId,
      content:     message.content,
      author:      'TaskCraft AI',
      is_internal: message.isInternal,
      created_at:  message.createdAt,
    },
  }, { status: 201 })
}

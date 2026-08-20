import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET /api/v1/workspace — connection test + org info
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get('Authorization'))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await prisma.organization.findUnique({
    where: { id: auth.orgId },
    select: { id: true, name: true },
  })

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    workspace: {
      id:   org.id,
      name: org.name,
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/workspace — connection test + org info
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req.headers.get('Authorization'))
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminClient()
  const { data: org } = await db
    .from('organizations')
    .select('id, name')
    .eq('id', auth.orgId)
    .single()

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    workspace: {
      id:   org.id,
      name: org.name,
    },
  })
}

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    api:     'SupportCraft AI',
    version: 'v1',
    endpoints: [
      'GET  /api/v1/workspace',
      'GET  /api/v1/tickets',
      'GET  /api/v1/tickets/:id',
      'PATCH /api/v1/tickets/:id',
      'POST /api/v1/tickets/:id/notes',
    ],
  })
}

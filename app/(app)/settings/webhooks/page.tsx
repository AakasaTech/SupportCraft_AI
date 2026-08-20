import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/shared/Header'
import { WebhooksClient } from './_components/WebhooksClient'

export const metadata: Metadata = { title: 'Webhooks — Settings' }

export default async function WebhooksPage() {
  const user = await requireAuth()
  const canManage = ['owner', 'admin'].includes(user.profile.role)

  const rows = await prisma.outboundWebhook.findMany({
    where:   { organizationId: user.profile.organizationId },
    select:  { id: true, name: true, url: true, events: true, enabled: true, secret: true, lastFiredAt: true, lastStatus: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  const webhooks = rows.map((w) => ({
    id: w.id, name: w.name, url: w.url, events: w.events, enabled: w.enabled, secret: w.secret,
    last_fired_at: w.lastFiredAt?.toISOString() ?? null, last_status: w.lastStatus, created_at: w.createdAt.toISOString(),
  }))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://supportcraft.aakasa.dev'

  return (
    <div>
      <Header
        title="Webhooks"
        description="Send ticket events to external services like TaskCraft AI"
      />
      <div className="p-6 max-w-3xl">
        <WebhooksClient
          webhooks={webhooks ?? []}
          canManage={canManage}
          appUrl={appUrl}
        />
      </div>
    </div>
  )
}

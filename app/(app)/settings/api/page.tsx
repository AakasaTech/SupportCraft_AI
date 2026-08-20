import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/helpers'
import { prisma } from '@/lib/prisma'
import { Header } from '@/components/shared/Header'
import { ApiKeysClient } from './_components/ApiKeysClient'

export const metadata: Metadata = { title: 'API Keys — Settings' }

export default async function ApiSettingsPage() {
  const user = await requireAuth()
  const canManage = ['owner', 'admin'].includes(user.profile.role)

  const keys = await prisma.apiKey.findMany({
    where:   { organizationId: user.profile.organizationId },
    select:  { id: true, name: true, keyPrefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <Header title="API Keys" description="Connect TaskCraft AI and other tools to your SupportCraft account" />
      <div className="p-6 max-w-3xl">
        <ApiKeysClient
          keys={keys.map((k) => ({
            id:         k.id,
            name:       k.name,
            prefix:     k.keyPrefix,
            lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
            revokedAt:  k.revokedAt?.toISOString() ?? null,
            createdAt:  k.createdAt.toISOString(),
          }))}
          canManage={canManage}
        />
      </div>
    </div>
  )
}

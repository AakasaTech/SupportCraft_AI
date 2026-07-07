import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ApiKeysClient } from './_components/ApiKeysClient'

export const metadata: Metadata = { title: 'API Keys — Settings' }

interface ApiKeyRow {
  id:          string
  name:        string
  key_prefix:  string
  last_used_at: string | null
  revoked_at:  string | null
  created_at:  string
}

export default async function ApiSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/login')

  const canManage = ['owner', 'admin'].includes(profile.role)

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, last_used_at, revoked_at, created_at')
    .eq('organization_id', profile.org_id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <Header title="API Keys" description="Connect TaskCraft AI and other tools to your SupportCraft account" />
      <div className="p-6 max-w-3xl">
        <ApiKeysClient
          keys={(keys ?? [] as ApiKeyRow[]).map((k) => ({
            id:         k.id,
            name:       k.name,
            prefix:     k.key_prefix,
            lastUsedAt: k.last_used_at,
            revokedAt:  k.revoked_at,
            createdAt:  k.created_at,
          }))}
          canManage={canManage}
        />
      </div>
    </div>
  )
}

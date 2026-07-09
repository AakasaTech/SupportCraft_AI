import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { WebhooksClient } from './_components/WebhooksClient'

export const metadata: Metadata = { title: 'Webhooks — Settings' }

export default async function WebhooksPage() {
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

  const { data: webhooks } = await supabase
    .from('outbound_webhooks')
    .select('id, name, url, events, enabled, secret, last_fired_at, last_status, created_at')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

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

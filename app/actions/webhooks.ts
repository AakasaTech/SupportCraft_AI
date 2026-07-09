'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { testWebhookDelivery } from '@/lib/webhooks'

async function getCtx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) return null
  return { supabase, userId: user.id, orgId: profile.org_id, role: profile.role as string }
}

function requireAdmin(role: string) {
  return ['owner', 'admin'].includes(role)
}

export async function createWebhookAction(input: {
  name:   string
  url:    string
  events: string[]
}) {
  const ctx = await getCtx()
  if (!ctx || !requireAdmin(ctx.role)) return { error: 'Unauthorized' }

  const secret = randomBytes(24).toString('hex')

  const { data, error } = await ctx.supabase
    .from('outbound_webhooks')
    .insert({
      org_id:     ctx.orgId,
      created_by: ctx.userId,
      name:       input.name.trim(),
      url:        input.url.trim(),
      secret,
      events:     input.events,
    })
    .select('id, name, url, events, enabled, secret, created_at, last_fired_at, last_status')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/settings/webhooks')
  return { data }
}

export async function updateWebhookAction(id: string, input: {
  name?:    string
  url?:     string
  events?:  string[]
  enabled?: boolean
}) {
  const ctx = await getCtx()
  if (!ctx || !requireAdmin(ctx.role)) return { error: 'Unauthorized' }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.name    !== undefined) updates.name    = input.name.trim()
  if (input.url     !== undefined) updates.url     = input.url.trim()
  if (input.events  !== undefined) updates.events  = input.events
  if (input.enabled !== undefined) updates.enabled = input.enabled

  const { error } = await ctx.supabase
    .from('outbound_webhooks')
    .update(updates)
    .eq('id', id)
    .eq('org_id', ctx.orgId)

  if (error) return { error: error.message }
  revalidatePath('/settings/webhooks')
  return { ok: true }
}

export async function deleteWebhookAction(id: string) {
  const ctx = await getCtx()
  if (!ctx || !requireAdmin(ctx.role)) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('outbound_webhooks')
    .delete()
    .eq('id', id)
    .eq('org_id', ctx.orgId)

  if (error) return { error: error.message }
  revalidatePath('/settings/webhooks')
  return { ok: true }
}

export async function testWebhookAction(id: string) {
  const ctx = await getCtx()
  if (!ctx || !requireAdmin(ctx.role)) return { error: 'Unauthorized' }

  const { status } = await testWebhookDelivery(id, ctx.orgId)
  revalidatePath('/settings/webhooks')
  return { status }
}

export async function regenerateWebhookSecretAction(id: string) {
  const ctx = await getCtx()
  if (!ctx || !requireAdmin(ctx.role)) return { error: 'Unauthorized' }

  const secret = randomBytes(24).toString('hex')

  const { error } = await ctx.supabase
    .from('outbound_webhooks')
    .update({ secret, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('org_id', ctx.orgId)

  if (error) return { error: error.message }
  return { secret }
}

// Outbound webhook dispatcher for SupportCraft AI.
// Uses node:http/https to avoid undici/fetch issues.
// Payload is HMAC-SHA256 signed with the webhook's secret.

import { createHmac } from 'node:crypto'
import http  from 'node:http'
import https from 'node:https'
import { prisma } from '@/lib/prisma'

export type WebhookEvent =
  | 'ticket.created'
  | 'ticket.updated'
  | 'ticket.status_changed'

export interface WebhookTicketData {
  id:          string
  number:      string
  title:       string
  status:      string
  priority:    string
  client_name?: string
  url:         string
}

interface WebhookPayload {
  event:     WebhookEvent | 'test'
  timestamp: string
  data:      WebhookTicketData | { message: string }
}

function sign(secret: string, body: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex')
}

function deliver(
  url: string,
  body: string,
  signature: string,
): Promise<number> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url)
      const isHttps = u.protocol === 'https:'
      const options = {
        hostname: u.hostname,
        port:     u.port || (isHttps ? 443 : 80),
        path:     u.pathname + u.search,
        method:   'POST',
        headers: {
          'Content-Type':            'application/json',
          'Content-Length':          String(Buffer.byteLength(body)),
          'X-SupportCraft-Event':    'webhook',
          'X-SupportCraft-Signature': signature,
          'User-Agent':              'SupportCraft-Webhooks/1.0',
        },
        agent: isHttps
          ? new https.Agent({ keepAlive: false })
          : new http.Agent({ keepAlive: false }),
      }
      const transport = isHttps ? https : http
      const req = transport.request(options, (res) => {
        res.resume() // drain response
        resolve(res.statusCode ?? 0)
      })
      req.setTimeout(10_000, () => { req.destroy(); resolve(0) })
      req.on('error', () => resolve(0))
      req.write(body)
      req.end()
    } catch {
      resolve(0)
    }
  })
}

export async function dispatchWebhookEvent(
  orgId: string,
  event: WebhookEvent,
  data:  WebhookTicketData,
): Promise<void> {
  const hooks = await prisma.outboundWebhook.findMany({
    where: { organizationId: orgId, enabled: true, events: { has: event } },
    select: { id: true, url: true, secret: true },
  })

  if (!hooks.length) return

  const payload: WebhookPayload = { event, timestamp: new Date().toISOString(), data }
  const body = JSON.stringify(payload)

  await Promise.all(
    hooks.map(async (hook) => {
      const status = await deliver(hook.url, body, sign(hook.secret, body))
      await prisma.outboundWebhook.update({
        where: { id: hook.id },
        data: { lastFiredAt: new Date(), lastStatus: status },
      })
    }),
  )
}

export async function testWebhookDelivery(webhookId: string, orgId: string): Promise<{ status: number }> {
  const hook = await prisma.outboundWebhook.findFirst({
    where: { id: webhookId, organizationId: orgId },
    select: { url: true, secret: true },
  })

  if (!hook) return { status: 0 }

  const payload: WebhookPayload = {
    event:     'test',
    timestamp: new Date().toISOString(),
    data:      { message: 'This is a test event from SupportCraft AI' },
  }
  const body   = JSON.stringify(payload)
  const status = await deliver(hook.url, body, sign(hook.secret, body))

  await prisma.outboundWebhook.update({
    where: { id: webhookId },
    data: { lastFiredAt: new Date(), lastStatus: status },
  })

  return { status }
}

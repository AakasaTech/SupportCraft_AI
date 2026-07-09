'use client'

import { useState, useTransition } from 'react'
import {
  Plus, Trash2, Play, Loader2, Check, Copy, Eye, EyeOff,
  RefreshCw, CheckCircle2, XCircle, Clock, Webhook,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createWebhookAction,
  updateWebhookAction,
  deleteWebhookAction,
  testWebhookAction,
  regenerateWebhookSecretAction,
} from '@/app/actions/webhooks'

interface WebhookRow {
  id:            string
  name:          string
  url:           string
  events:        string[]
  enabled:       boolean
  secret:        string
  last_fired_at: string | null
  last_status:   number | null
  created_at:    string
}

interface Props {
  webhooks:   WebhookRow[]
  canManage:  boolean
  appUrl:     string
}

const ALL_EVENTS = [
  { value: 'ticket.created',        label: 'Ticket Created' },
  { value: 'ticket.status_changed', label: 'Status Changed' },
  { value: 'ticket.updated',        label: 'Ticket Updated' },
]

function EventBadge({ event }: { event: string }) {
  const labels: Record<string, string> = {
    'ticket.created':        'created',
    'ticket.status_changed': 'status',
    'ticket.updated':        'updated',
  }
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium">
      {labels[event] ?? event}
    </span>
  )
}

function StatusIcon({ status }: { status: number | null }) {
  if (!status) return <Clock className="h-3.5 w-3.5 text-muted-foreground" />
  if (status >= 200 && status < 300) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
  return <XCircle className="h-3.5 w-3.5 text-destructive" />
}

function SecretField({ secret, onRegenerate, canManage }: {
  secret:        string
  onRegenerate:  () => Promise<void>
  canManage:     boolean
}) {
  const [visible,  setVisible]  = useState(false)
  const [copied,   setCopied]   = useState(false)
  const [isPending, start]      = useTransition()

  function handleCopy() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-1.5">
      <code className="flex-1 rounded bg-muted px-2 py-1 text-[11px] font-mono truncate">
        {visible ? secret : '••••••••••••••••••••••••'}
      </code>
      <button onClick={() => setVisible((v) => !v)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title={visible ? 'Hide' : 'Show'}>
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
      <button onClick={handleCopy} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Copy secret">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {canManage && (
        <button
          onClick={() => start(onRegenerate)}
          disabled={isPending}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Regenerate secret"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  )
}

export function WebhooksClient({ webhooks: initialWebhooks, canManage, appUrl }: Props) {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>(initialWebhooks)
  const [showForm, setShowForm] = useState(false)

  // New webhook form state
  const [newName,   setNewName]   = useState('')
  const [newUrl,    setNewUrl]    = useState('')
  const [newEvents, setNewEvents] = useState<string[]>(['ticket.created', 'ticket.status_changed'])
  const [newSecret, setNewSecret] = useState<string | null>(null)

  const [isCreating,  startCreate]  = useTransition()
  const [testingId,   setTestingId] = useState<string | null>(null)
  const [deletingId,  setDeletingId] = useState<string | null>(null)

  function toggleEvent(value: string) {
    setNewEvents((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value],
    )
  }

  function handleCreate() {
    if (!newName.trim() || !newUrl.trim() || !newEvents.length) {
      toast.error('Name, URL and at least one event are required')
      return
    }
    startCreate(async () => {
      const res = await createWebhookAction({ name: newName, url: newUrl, events: newEvents })
      if ('error' in res && res.error) { toast.error(res.error); return }
      if ('data' in res && res.data) {
        setWebhooks((prev) => [res.data as WebhookRow, ...prev])
        setNewSecret((res.data as WebhookRow).secret)
        setNewName('')
        setNewUrl('')
        setNewEvents(['ticket.created', 'ticket.status_changed'])
        setShowForm(false)
        toast.success('Webhook created')
      }
    })
  }

  function handleToggle(id: string, enabled: boolean) {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, enabled } : w))
    updateWebhookAction(id, { enabled }).then((res) => {
      if ('error' in res && res.error) {
        setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, enabled: !enabled } : w))
        toast.error(res.error)
      }
    })
  }

  function handleTest(id: string) {
    setTestingId(id)
    testWebhookAction(id).then((res) => {
      setTestingId(null)
      if ('error' in res && res.error) { toast.error(res.error); return }
      if ('status' in res && res.status !== undefined) {
        const s = res.status
        const ok = s >= 200 && s < 300
        setWebhooks((prev) => prev.map((w) =>
          w.id === id ? { ...w, last_fired_at: new Date().toISOString(), last_status: s } : w,
        ))
        ok ? toast.success(`Test delivered — HTTP ${s}`) : toast.error(`Test failed — HTTP ${s || 'no response'}`)
      }
    })
  }

  function handleDelete(id: string) {
    setDeletingId(id)
    deleteWebhookAction(id).then((res) => {
      setDeletingId(null)
      if ('error' in res && res.error) { toast.error(res.error); return }
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
      toast.success('Webhook deleted')
    })
  }

  async function handleRegenerate(id: string) {
    const res = await regenerateWebhookSecretAction(id)
    if ('error' in res && res.error) { toast.error(res.error); return }
    if ('secret' in res && res.secret) {
      setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, secret: res.secret! } : w))
      toast.success('Signing secret regenerated')
    }
  }

  return (
    <div className="space-y-6">

      {/* How it works */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/80 space-y-1">
        <p className="font-medium text-foreground">How webhooks work</p>
        <p>SupportCraft sends a signed <code className="rounded bg-background border border-border px-1 text-xs">POST</code> request to your URL when ticket events occur. Verify the <code className="rounded bg-background border border-border px-1 text-xs">X-SupportCraft-Signature</code> header using HMAC-SHA256 with your signing secret.</p>
        <p className="text-xs text-muted-foreground pt-1">TaskCraft webhook URL: <span className="font-mono">{appUrl.replace('supportcraft', 'taskcraft')}/api/supportcraft/webhook?workspace_id=YOUR_WORKSPACE_ID</span></p>
      </div>

      {/* One-time secret reveal after creation */}
      {newSecret && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Save your signing secret — it won&apos;t be shown again</p>
          <code className="block w-full rounded bg-background border border-border px-3 py-2 text-xs font-mono break-all select-all">{newSecret}</code>
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newSecret); toast.success('Copied') }}>
            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy secret
          </Button>
          <Button size="sm" variant="ghost" className="ml-2" onClick={() => setNewSecret(null)}>Dismiss</Button>
        </div>
      )}

      {/* Add webhook form */}
      {canManage && (
        showForm ? (
          <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
            <p className="text-sm font-semibold">New webhook</p>

            <div className="space-y-1.5">
              <Label htmlFor="wh-name">Name</Label>
              <Input id="wh-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. TaskCraft AI" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wh-url">Endpoint URL</Label>
              <Input id="wh-url" type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://taskcraft.aakasa.dev/api/supportcraft/webhook?workspace_id=..." />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <div className="flex flex-wrap gap-3">
                {ALL_EVENTS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={newEvents.includes(value)}
                      onChange={() => toggleEvent(value)}
                      className="rounded"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={handleCreate} disabled={isCreating}>
                {isCreating && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Create Webhook
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setNewName(''); setNewUrl('') }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Webhook
          </Button>
        )
      )}

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
          <Webhook className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">No webhooks configured</p>
          <p className="text-xs text-muted-foreground mt-1">Add a webhook to push ticket events to TaskCraft AI or other services.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${wh.enabled ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{wh.name}</p>
                    <div className="flex gap-1 flex-wrap">
                      {wh.events.map((e) => <EventBadge key={e} event={e} />)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{wh.url}</p>
                </div>
                {/* Actions */}
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Enable toggle */}
                    <button
                      onClick={() => handleToggle(wh.id, !wh.enabled)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${wh.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                      title={wh.enabled ? 'Disable' : 'Enable'}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${wh.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Send test event"
                      onClick={() => handleTest(wh.id)}
                      disabled={testingId === wh.id}
                    >
                      {testingId === wh.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Play className="h-3.5 w-3.5" />
                      }
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Delete webhook"
                      onClick={() => handleDelete(wh.id)}
                      disabled={deletingId === wh.id}
                    >
                      {deletingId === wh.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                    </Button>
                  </div>
                )}
              </div>

              {/* Signing secret */}
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Signing Secret</p>
                <SecretField
                  secret={wh.secret}
                  canManage={canManage}
                  onRegenerate={() => handleRegenerate(wh.id)}
                />
              </div>

              {/* Last delivery */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusIcon status={wh.last_status} />
                {wh.last_fired_at
                  ? <>Last fired {new Date(wh.last_fired_at).toLocaleString()} · HTTP {wh.last_status ?? '—'}</>
                  : 'Never fired'
                }
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import type { InboundEmailPayload } from "./payload-builder";

export interface ForwardResult {
  ok:       boolean;
  status:   number;
  ticketId?: string;
  error?:   string;
}

export async function forwardToSupabase(
  payload:  InboundEmailPayload,
  url:      string,
  secret:   string
): Promise<ForwardResult> {
  let response: Response;
  try {
    response = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return { ok: false, status: 0, error: String(err) };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return { ok: false, status: response.status, error: text };
  }

  const json = await response.json().catch(() => ({})) as { ticket_id?: string };
  return { ok: true, status: response.status, ticketId: json.ticket_id };
}

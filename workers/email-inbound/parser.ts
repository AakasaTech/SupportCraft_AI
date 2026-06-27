import PostalMime from "postal-mime";

export interface ParsedEmail {
  from:        { address: string; name: string | null };
  to:          { address: string; name: string | null }[];
  replyTo:     string | null;
  subject:     string;
  messageId:   string;
  inReplyTo:   string | null;
  references:  string[];
  date:        string;
  bodyPlain:   string | null;
  bodyHtml:    string | null;
  attachments: ParsedAttachment[];
  headers:     Record<string, string>;
}

export interface ParsedAttachment {
  filename:    string;
  contentType: string;
  size:        number;
  contentId:   string | null;
  content:     string; // base64
}

export async function parseEmail(rawStream: ReadableStream): Promise<ParsedEmail> {
  const buffer = await new Response(rawStream).arrayBuffer();
  const parser = new PostalMime();
  const parsed = await parser.parse(buffer);

  return {
    from: {
      address: parsed.from?.address ?? "",
      name:    parsed.from?.name    ?? null,
    },
    to: (parsed.to ?? []).map(a => ({
      address: a.address ?? "",
      name:    a.name    ?? null,
    })),
    replyTo:  parsed.replyTo?.[0]?.address ?? null,
    subject:  parsed.subject ?? "(No Subject)",
    messageId: stripAngleBrackets(parsed.messageId ?? ""),
    inReplyTo: parsed.inReplyTo ? stripAngleBrackets(parsed.inReplyTo) : null,
    references: (parsed.references ?? "")
      .split(/\s+/)
      .map(stripAngleBrackets)
      .filter(Boolean),
    date:      parsed.date ?? new Date().toISOString(),
    bodyPlain: parsed.text ?? null,
    bodyHtml:  parsed.html ?? null,
    attachments: (parsed.attachments ?? []).map(att => ({
      filename:    att.filename    ?? "attachment",
      contentType: att.mimeType   ?? "application/octet-stream",
      size:        att.content?.byteLength ?? 0,
      contentId:   att.contentId  ?? null,
      content:     uint8ToBase64(att.content instanceof ArrayBuffer
        ? new Uint8Array(att.content)
        : att.content ?? new Uint8Array()),
    })),
    headers: flattenHeaders(parsed),
  };
}

function stripAngleBrackets(id: string): string {
  return id.replace(/^<|>$/g, "").trim();
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// postal-mime exposes headers as a Map or plain object depending on version
function flattenHeaders(parsed: Record<string, unknown>): Record<string, string> {
  const headers: Record<string, string> = {};
  const raw = parsed.headers;
  if (!raw) return headers;
  if (raw instanceof Map) {
    raw.forEach((v: unknown, k: unknown) => {
      headers[String(k).toLowerCase()] = String(v);
    });
  } else if (typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      headers[k.toLowerCase()] = String(v);
    }
  }
  return headers;
}

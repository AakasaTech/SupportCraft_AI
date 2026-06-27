import { createAdminClient } from "@/lib/supabase/server";

interface RawAttachment {
  filename:    string;
  contentType: string;
  size:        number;
  contentId:   string | null;
  content:     string; // base64
}

export interface StoredAttachment {
  id:          string;
  filename:    string;
  contentType: string;
  sizeBytes:   number;
  storagePath: string;
  isInline:    boolean;
  contentId:   string | null;
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per attachment

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
  "application/zip", "application/x-zip-compressed",
]);

export async function processAttachments(params: {
  orgId:          string;
  ticketId:       string;
  emailMessageId: string;
  attachments:    RawAttachment[];
}): Promise<StoredAttachment[]> {
  const admin   = createAdminClient();
  const results: StoredAttachment[] = [];

  for (const att of params.attachments) {
    // Size guard
    if (att.size > MAX_ATTACHMENT_BYTES) continue;

    // Content type guard
    const normalizedType = att.contentType.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_CONTENT_TYPES.has(normalizedType)) continue;

    // Decode base64
    let bytes: Uint8Array;
    try {
      const binary = atob(att.content);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
    } catch {
      continue;
    }

    // Sanitize filename
    const safeFilename = att.filename
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(0, 100);

    const storagePath = `attachments/${params.orgId}/${params.ticketId}/${Date.now()}_${safeFilename}`;

    // Upload to Supabase Storage
    const { error: uploadErr } = await admin.storage
      .from("email-attachments")
      .upload(storagePath, bytes, { contentType: normalizedType, upsert: false });

    if (uploadErr) continue;

    // Record in DB
    const { data: record } = await admin
      .from("email_attachments")
      .insert({
        org_id:           params.orgId,
        email_message_id: params.emailMessageId,
        ticket_id:        params.ticketId,
        filename:         safeFilename,
        content_type:     normalizedType,
        size_bytes:       att.size,
        storage_path:     storagePath,
        is_inline:        Boolean(att.contentId),
        content_id:       att.contentId,
      })
      .select("id")
      .single();

    if (record) {
      results.push({
        id:          record.id,
        filename:    safeFilename,
        contentType: normalizedType,
        sizeBytes:   att.size,
        storagePath,
        isInline:    Boolean(att.contentId),
        contentId:   att.contentId,
      });
    }
  }

  return results;
}

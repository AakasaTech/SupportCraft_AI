import type { InboundEmailPayload } from "../types";

export interface SpamResult {
  isSpam:  boolean;
  score:   number; // 0-10; >= 5 = spam
  reasons: string[];
}

const SPAM_SUBJECT_PATTERNS = [
  /\b(win|winner|lottery|prize|million|billion|claim|urgent|verify)\b/i,
  /\b(free|100%|guaranteed|no risk|click here|act now)\b/i,
  /\b(viagra|cialis|casino|crypto|bitcoin|investment|get rich)\b/i,
];

const SPAM_BODY_PATTERNS = [
  /\b(unsubscribe|click here to unsubscribe)\b/i,
  /\b(dear (customer|user|friend)|to whom it may concern)\b/i,
  /\bhttps?:\/\/bit\.ly\//i,
];

const PHISHING_PATTERNS = [
  /\b(password|login|account|credit card|social security|ssn)\b.{0,50}(update|verify|confirm|click)/i,
  /verify.{0,20}(account|identity|email)/i,
];

export function checkSpam(payload: InboundEmailPayload): SpamResult {
  const reasons: string[] = [];
  let score = 0;

  // Layer 1 signals from Cloudflare Worker
  if (payload.spam_signals.auto_submitted) { score += 3; reasons.push("auto-submitted"); }
  if (payload.spam_signals.has_x_loop)    { score += 4; reasons.push("x-loop"); }
  if (payload.spam_signals.is_bounce)     { score += 5; reasons.push("bounce"); }
  if (payload.spam_signals.list_unsubscribe) { score += 2; reasons.push("newsletter"); }

  // Subject patterns
  for (const pattern of SPAM_SUBJECT_PATTERNS) {
    if (pattern.test(payload.subject)) {
      score += 2;
      reasons.push(`spam-subject: ${pattern.source.slice(0, 30)}`);
    }
  }

  // Body patterns
  const body = [payload.body_plain ?? "", payload.body_html ?? ""].join(" ");
  for (const pattern of SPAM_BODY_PATTERNS) {
    if (pattern.test(body)) {
      score += 1;
      reasons.push(`spam-body: ${pattern.source.slice(0, 30)}`);
    }
  }

  // Phishing patterns
  for (const pattern of PHISHING_PATTERNS) {
    if (pattern.test(body)) {
      score += 3;
      reasons.push("phishing-pattern");
    }
  }

  // Empty body
  if (!payload.body_plain && !payload.body_html) {
    score += 1;
    reasons.push("empty-body");
  }

  return { isSpam: score >= 5, score, reasons };
}

export function checkDuplicate(messageId: string, existingIds: Set<string>): boolean {
  return existingIds.has(messageId);
}

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /you\s+are\s+now\s+a/i,
  /forget\s+(everything|all|your)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /system\s*prompt/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /###\s*system/i,
];

const SENSITIVE_PATTERNS = [
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,  // credit card
  /\b\d{3}-\d{2}-\d{4}\b/g,                       // SSN
  /password\s*[:=]\s*\S+/gi,
  /api[_-]?key\s*[:=]\s*\S+/gi,
  /secret\s*[:=]\s*\S+/gi,
];

export function sanitizeInput(text: string): string {
  let sanitized = text
    .replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"))
    .replace(/\0/g, "")
    .slice(0, 8000);

  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  return sanitized;
}

export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

export function safeUserContent(text: string): { safe: boolean; sanitized: string } {
  const sanitized = sanitizeInput(text);
  const safe      = !detectInjection(sanitized);
  return { safe, sanitized };
}

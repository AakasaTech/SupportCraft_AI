import sanitizeHtml from "sanitize-html";

// ─── HTML sanitization ────────────────────────────────────────────────────────

const ALLOWED_TAGS = [
  "p", "br", "div", "span", "section", "article",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "dl", "dt", "dd",
  "strong", "b", "em", "i", "u", "s", "del", "ins",
  "a", "img",
  "blockquote", "pre", "code",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a:   ["href", "title", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "style"],
  "*": ["class", "style", "id"],
};

export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags:       ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes:    ["http", "https", "mailto"],
    // Prevent tracking pixels
    transformTags: {
      img: (tagName, attribs) => {
        // Block 1×1 tracking pixels
        const w = parseInt(attribs.width ?? "99", 10);
        const h = parseInt(attribs.height ?? "99", 10);
        if (w <= 1 && h <= 1) return { tagName: "span", attribs: {} };
        return { tagName, attribs };
      },
    },
  });
}

// ─── Quoted reply stripping ───────────────────────────────────────────────────

// Patterns that indicate the start of a quoted section in plain text
const QUOTE_PATTERNS = [
  /^On .+ wrote:$/m,
  /^>{1,}/m,
  /^-{5,}/m,
  /^_{5,}/m,
  /^From:\s+/m,
  /^Sent:\s+/m,
];

export function stripQuotedText(text: string): string {
  for (const pattern of QUOTE_PATTERNS) {
    const match = text.search(pattern);
    if (match > 50) { // at least 50 chars of content before the quote marker
      return text.slice(0, match).trim();
    }
  }
  return text.trim();
}

// ─── Email signature stripping ────────────────────────────────────────────────

const SIGNATURE_DELIMITERS = [
  /^--\s*$/m,
  /^_{3,}\s*$/m,
  /^Sent from my (iPhone|iPad|Android|Samsung|Pixel)/m,
  /^Get Outlook for (iOS|Android)/m,
];

export function stripSignature(text: string): string {
  for (const delimiter of SIGNATURE_DELIMITERS) {
    const match = text.search(delimiter);
    if (match > 50) {
      return text.slice(0, match).trim();
    }
  }
  return text.trim();
}

// ─── Combined clean ───────────────────────────────────────────────────────────

export function cleanPlainText(text: string): string {
  return stripQuotedText(stripSignature(text));
}

// ─── Language detection (simple heuristic) ────────────────────────────────────

export function detectLanguage(text: string): string {
  // Simple scoring by common language markers
  const samples: [string, RegExp][] = [
    ["es", /\b(hola|gracias|por favor|problema|ayuda)\b/i],
    ["fr", /\b(bonjour|merci|s'il vous plaît|problème|aide)\b/i],
    ["de", /\b(hallo|danke|bitte|problem|hilfe)\b/i],
    ["pt", /\b(olá|obrigado|por favor|problema|ajuda)\b/i],
  ];
  for (const [lang, pattern] of samples) {
    if (pattern.test(text)) return lang;
  }
  return "en";
}

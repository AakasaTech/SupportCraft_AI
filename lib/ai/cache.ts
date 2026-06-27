interface CacheEntry {
  value:     string;
  expiresAt: number;
}

const store = new Map<string, CacheEntry>();

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function buildCacheKey(feature: string, ...parts: string[]): string {
  const raw = [feature, ...parts].join("|");
  // Simple hash to keep key short
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return `ai:${feature}:${hash}`;
}

export function getCached(key: string): string | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCached(key: string, value: string, ttlMs = DEFAULT_TTL_MS): void {
  // Prune expired entries when cache grows
  if (store.size > 500) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k);
    }
  }
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function clearCache(): void {
  store.clear();
}

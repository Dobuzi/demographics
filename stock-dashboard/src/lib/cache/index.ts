/**
 * Simple in-memory TTL cache for server-side route handlers.
 * Prevents hammering third-party APIs on repeated requests.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Default TTLs (in seconds)
export const TTL = {
  PRICES: 5 * 60,         // 5 min — prices change frequently
  FINANCIALS: 24 * 60 * 60, // 24 hours — financials update quarterly
  NEWS: 15 * 60,           // 15 min
  VALIDATION: 60 * 60,     // 1 hour
} as const;

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlSeconds: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });

  // Evict expired entries periodically (keep map from growing unbounded)
  if (store.size > 500) {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now > v.expiresAt) store.delete(k);
    }
  }
}

export function cacheKey(...parts: string[]): string {
  return parts.join(':');
}

import "server-only";

/**
 * Simple fixed-window rate limit per client key (IP). In-memory, so it is
 * per server instance: enough to blunt scripted spam alongside the honeypot.
 * For multi-instance production, swap for a shared store (e.g. Upstash Redis).
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_MAX ?? 5);
const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string): { ok: boolean; retryAfterMin: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return { ok: true, retryAfterMin: 0 };
  }
  entry.count += 1;
  return { ok: entry.count <= MAX_PER_WINDOW, retryAfterMin: Math.ceil((entry.reset - now) / 60000) };
}

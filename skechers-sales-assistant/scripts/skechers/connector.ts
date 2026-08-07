// Network hygiene for any AUTHORIZED live source adapter: bounded timeouts,
// bounded retries with exponential backoff, a descriptive User-Agent, and a
// minimum delay between requests (rate limiting). This module performs no
// requests to skechers.com by itself — it is the transport a permission-gated
// adapter would use once authorization is configured. The default pipeline uses
// the fixture adapter and never touches the network.

export interface ResilientFetchOptions {
  timeoutMs?: number; // per-attempt timeout boundary
  retries?: number; // additional attempts after the first
  backoffBaseMs?: number; // exponential backoff base (2^n * base)
  userAgent?: string;
}

const DEFAULTS: Required<Omit<ResilientFetchOptions, 'userAgent'>> & { userAgent: string } = {
  timeoutMs: 10_000,
  retries: 3,
  backoffBaseMs: 500,
  userAgent: 'SkechersSalesAssistant-Ingest/1.0 (+authorized-partner; backend-only)',
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Fetch a URL with a timeout and retry/backoff. Used only by an authorized live
 * adapter; the URL must be an approved endpoint the operator has permission to
 * call. Never call this against an unauthorized site.
 */
export async function resilientFetch(url: string, opts: ResilientFetchOptions = {}): Promise<string> {
  const cfg = { ...DEFAULTS, ...opts };
  let lastErr: unknown;
  for (let attempt = 0; attempt <= cfg.retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': cfg.userAgent, Accept: 'text/html,application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.text();
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt < cfg.retries) await sleep(cfg.backoffBaseMs * 2 ** attempt);
    }
  }
  throw new Error(`resilientFetch failed after ${cfg.retries + 1} attempts: ${String(lastErr)}`);
}

/** A simple rate limiter: ensures at least `minGapMs` between successive calls. */
export function createRateLimiter(minGapMs: number): () => Promise<void> {
  let last = 0;
  return async () => {
    const now = Date.now();
    const wait = last + minGapMs - now;
    if (wait > 0) await sleep(wait);
    last = Date.now();
  };
}

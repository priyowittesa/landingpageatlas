const RATE_LIMIT_COOLDOWN_MS = 60_000;

interface TransportError {
  description?: unknown;
  context?: {
    status?: number;
    getResponseHeader?: (name: string) => string | null;
  };
}

/** Engine.IO exposes polling HTTP failures through description and the XHR context. */
export function getSocketRateLimitDelay(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const { description, context } = error as TransportError;
  if (description !== 429 && context?.status !== 429) return null;

  let retryAfter: string | null = null;
  try {
    retryAfter = context?.getResponseHeader?.("Retry-After") ?? null;
  } catch {
    // Cross-origin responses may not expose Retry-After.
  }
  if (!retryAfter?.trim()) return RATE_LIMIT_COOLDOWN_MS;

  const seconds = Number(retryAfter);
  const delay = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter) - Date.now();
  return Number.isFinite(delay)
    ? Math.max(RATE_LIMIT_COOLDOWN_MS, delay)
    : RATE_LIMIT_COOLDOWN_MS;
}

// Simple in-memory rate limiter for per-IP throttling

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;

const rateLimitMap = new Map();

export function isRateLimitAllowed(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitMap.set(ip, entry);
    return true;
  }

  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX;
}


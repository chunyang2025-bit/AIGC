type HitBucket = {
  count: number;
  resetAt: number;
};

const globalRateStore = globalThis as typeof globalThis & {
  __aigcRateLimits?: Map<string, HitBucket>;
};

function store() {
  if (!globalRateStore.__aigcRateLimits) {
    globalRateStore.__aigcRateLimits = new Map<string, HitBucket>();
  }
  return globalRateStore.__aigcRateLimits;
}

export function rateLimit(request: Request, scope: string, limit = 20, windowMs = 60_000) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const subject = forwarded || request.headers.get("x-real-ip") || "local";
  const key = `${scope}:${subject}`;
  const now = Date.now();
  const buckets = store();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

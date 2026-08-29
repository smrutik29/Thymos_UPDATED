import { NextRequest, NextResponse } from "next/server";

/**
 * Next 16 "proxy" (formerly "middleware") — first-layer abuse controls for
 * the public form APIs:
 *  - per-IP rate limit (token bucket, in-memory per instance)
 *  - hard request-body size cap
 *
 * In-memory state is per Cloud Run instance, not shared cluster-wide (and the
 * proxy docs explicitly warn against relying on module globals), so a
 * determined attacker spread across many instances still gets more than one
 * instance's ceiling. It is a meaningful first cut; a shared limiter
 * (Cloud Armor rule or a Redis/Memorystore bucket) is the follow-up if the
 * forms ever see real abuse.
 */

export const config = {
  matcher: ["/api/:path*"],
};

// --- tuning -----------------------------------------------------------------
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12; // per IP per window, across all /api routes
const MAX_BODY_BYTES = 64 * 1024; // 64 KB — forms are tiny

// --- token bucket ---------------------------------------------------------
interface Bucket {
  count: number;
  resetAt: number;
}
const buckets = new Map<string, Bucket>();

// Opportunistic sweep so the Map can't grow without bound.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function proxy(req: NextRequest) {
  // Only rate-limit state-changing calls; GETs to /api are cheap/none today.
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return NextResponse.next();
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: "payload_too_large" },
      { status: 413 }
    );
  }

  const now = Date.now();
  sweep(now);

  const ip = clientIp(req);
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (bucket.count >= MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  bucket.count += 1;
  return NextResponse.next();
}

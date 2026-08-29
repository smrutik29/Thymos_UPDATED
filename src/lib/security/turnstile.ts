/**
 * Cloudflare Turnstile server-side verification.
 *
 * Rollout model:
 *  - If TURNSTILE_SECRET_KEY is NOT set, verification is skipped (returns
 *    true). This lets the code ship before the keys are provisioned without
 *    breaking every form. The honeypot + rate limiter still apply.
 *  - Once TURNSTILE_SECRET_KEY IS set, a missing/invalid token is REJECTED
 *    (returns false) — i.e. it fails closed the moment it is switched on.
 *
 * Client widget site key: NEXT_PUBLIC_TURNSTILE_SITE_KEY (baked into the
 * bundle) / the `data-sitekey` on the .dc.html widgets. Cloudflare's
 * always-passing test keys:
 *   site   1x00000000000000000000AA
 *   secret 1x0000000000000000000000000000000AA
 */

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileResult {
  ok: boolean;
  /** "disabled" when no secret is configured; otherwise the outcome. */
  reason: "disabled" | "success" | "missing_token" | "failed" | "error";
}

export async function verifyTurnstile(
  token: unknown,
  ip?: string
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, reason: "disabled" };

  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return { ok: false, reason: "missing_token" };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { ok: false, reason: "error" };
    const data = (await res.json()) as { success?: boolean };
    return data.success
      ? { ok: true, reason: "success" }
      : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "error" };
  }
}

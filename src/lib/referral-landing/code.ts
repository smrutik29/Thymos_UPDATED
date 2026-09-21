/**
 * Patient refer-a-friend code handling for the `/r/<CODE>` landing page.
 *
 * NOT the provider referral form (`src/lib/db/referrals.ts`) — that one holds PHI.
 * This module never touches a database or the backend API: the page only
 * displays the code from the URL (ADR-0006 — the link carries the code and
 * nothing else). Validation here is purely about shape, so the page never
 * echoes arbitrary text back to a visitor.
 */

/**
 * Shape a Thymos referral code can take. Patient codes are `<INITIALS>-<5 chars>`
 * (backend `REFERRAL_CODE_REGEX`); this is the deliberately looser bound the
 * mobile app also uses so future campaign codes (ADR-0004 Consequences) still
 * land on this page without a web deploy.
 */
export const REFERRAL_CODE_RE = /^[A-Z0-9]{1,4}-[A-Z0-9]{4,8}$/;

/** Codes are stored and compared upper-case; visitors may type or paste them any way. */
export function normalizeReferralCode(input: string): string {
  return input.trim().toUpperCase();
}

/**
 * Returns the normalized code when `input` has the shape of a referral code,
 * `null` otherwise. `null` means "render 404", not "the code is unknown" — the
 * site has no way to know whether a code exists; the app checks that at payment.
 */
export function parseReferralCode(input: string | undefined): string | null {
  if (!input) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    return null;
  }
  const code = normalizeReferralCode(decoded);
  return REFERRAL_CODE_RE.test(code) ? code : null;
}

/** Custom-scheme fallback the mobile app registers (ADR-0006 §1). */
export function appDeepLinkFor(code: string): string {
  return `thymos://r/${encodeURIComponent(code)}`;
}

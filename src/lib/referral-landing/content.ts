/**
 * Copy and amounts for the refer-a-friend landing page.
 *
 * The amounts Thymos actually gives live in `thymos-backend` (`referral_programs`,
 * ADR-0004 §3) and this site never calls the backend (code-map convention). So
 * the figures shown here are display copy, overridable per environment without a
 * code change. Keep them in step with the `refer-a-friend` program row.
 */

const DEFAULT_RECIPIENT_DISCOUNT = "$50";
const DEFAULT_REFERRER_REWARD = "$50";

function amountFromEnv(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && /^\$?\d{1,4}(\.\d{2})?%?$/.test(trimmed) ? trimmed : fallback;
}

export interface ReferralOffer {
  /** What the friend saves on their first month, e.g. "$50". */
  recipientDiscount: string;
  /** What the referrer earns off their next membership fee, e.g. "$50". */
  referrerReward: string;
}

export function getReferralOffer(): ReferralOffer {
  return {
    recipientDiscount: amountFromEnv(
      process.env.REFERRAL_RECIPIENT_DISCOUNT,
      DEFAULT_RECIPIENT_DISCOUNT
    ),
    referrerReward: amountFromEnv(
      process.env.REFERRAL_REFERRER_REWARD,
      DEFAULT_REFERRER_REWARD
    ),
  };
}

/** Public origin of this site — the apex, never `www` (code-map landmine). */
export const SITE_ORIGIN = "https://thymoshealth.com";

export const APP_NAME = "Thymos Health";

export interface StoreBadge {
  store: "apple" | "google";
  label: string;
  /** Store URL once the app is listed; `null` renders the badge as "Coming soon". */
  href: string | null;
}

/**
 * The apps are not in the stores yet (ADR-0006 §6). Fill `href` when the
 * listings go live; the badge component switches from "Coming soon" to a link.
 */
export const STORE_BADGES: StoreBadge[] = [
  { store: "apple", label: "App Store", href: null },
  { store: "google", label: "Google Play", href: null },
];

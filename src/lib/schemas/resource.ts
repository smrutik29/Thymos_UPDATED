import { z } from "zod";

/**
 * "Get instant access" lead-capture form on the Resources page
 * (public/resources.html → the shared #access-form modal). One form serves
 * both featured resources; `resource` says which one the visitor asked for
 * so the page can start the right PDF download on success.
 *
 *   guide      → "The Root-Cause Autoimmune Care Guide"
 *                (public/autoimmune-guide.html / .pdf)
 *   whitepaper → "The Autoimmune and Inflammatory Disease Whitepaper"
 *                (public/thymos-autoimmune-whitepaper.html / .pdf)
 *
 * Contact details only, no PHI. Stored in its own isolated database
 * (`thymos_resources`) reached by a de-privileged `resource_app` user —
 * see db/resource-schema.sql.
 *
 * Field names mirror the form's `name=` attributes.
 */

export const RESOURCE_KEYS = ["guide", "whitepaper"] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

/**
 * Canonical opt-in wording shown next to the marketing checkbox in the
 * modal. The server stores THIS string on every row (not whatever the
 * client sends) so the consent record stays trustworthy. If you change the
 * copy in public/resources.html, change it here too.
 */
export const RESOURCE_MARKETING_OPT_IN_TEXT =
  "Yes, I'd like to receive occasional news and updates from Thymos Health. " +
  "I can unsubscribe at any time.";

export const ResourceRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(254),
  // The modal's <select> covers all states + "Outside the U.S." — a wider
  // set than US_STATES, so keep this a free string, not an enum.
  state: z.string().trim().min(1, "Select your state").max(100),
  reason: z.string().trim().min(1, "Select a reason").max(100),
  // Which document was requested — drives the download on the client.
  resource: z.enum(RESOURCE_KEYS),
  // Marketing opt-in checkbox — defaults checked, but the visitor may clear
  // it, so this is a plain boolean (not a required literal true).
  marketingOptIn: z.boolean(),
  sourcePage: z.string().max(300).optional(),
  // Honeypot — real visitors never fill this hidden field in.
  companyWebsite: z.string().optional(),
});

export type ResourceRequest = z.infer<typeof ResourceRequestSchema>;

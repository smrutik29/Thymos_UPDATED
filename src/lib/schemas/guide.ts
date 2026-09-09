import { z } from "zod";

/**
 * "Send Me the Guide" lead-capture form on the Membership page
 * (public/thymos-membership.dc.html, section #guide → the #whitepaperForm
 * modal). Delivers "The Root-Cause Autoimmune Care Guide"
 * (public/autoimmune-guide.html).
 *
 * Field names mirror the form's `name=` attributes.
 */

/**
 * Canonical opt-in wording shown next to the consent checkbox in the guide
 * modal. The server stores THIS string on every row (not whatever the client
 * sends) so the consent record stays trustworthy. If you change the copy in
 * public/thymos-membership.dc.html, change it here too.
 */
export const GUIDE_CONSENT_TEXT =
  "I agree to receive calls, texts, and emails from Thymos Health about care " +
  "options, including by automated means. Message and data rates may apply. " +
  "Reply STOP to opt out anytime.";

export const GuideRequestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(254),
  // The modal's <select> covers states + territories (Guam, Puerto Rico, …),
  // a wider set than US_STATES — keep this a free string rather than an enum
  // so a valid territory selection isn't rejected.
  state: z.string().trim().min(1, "Select your state").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{7,20}$/, "Enter a valid phone number"),
  // The checkbox is required — must be literally true.
  consent: z.literal(true, {
    message: "Please agree to the consent statement",
  }),
  sourcePage: z.string().max(300).optional(),
  // Honeypot — real visitors never fill this hidden field in.
  companyWebsite: z.string().optional(),
});

export type GuideRequest = z.infer<typeof GuideRequestSchema>;

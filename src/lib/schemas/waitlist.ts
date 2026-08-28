import { z } from "zod";
import { US_STATES } from "@/lib/quiz/us-states";

/**
 * "Where did you hear about us?" options — carried over verbatim from the
 * old JotForm waitlist so historical values stay comparable.
 */
export const REFERRAL_SOURCES = [
  "Google Search",
  "Facebook",
  "Instagram",
  "LinkedIn",
  "Friend",
  "Word of Mouth",
  "Email",
  "Other",
] as const;

/**
 * Canonical CAN-SPAM opt-in wording. The server stores THIS string on every
 * row (not whatever the client sends) so the consent record is trustworthy.
 * If you change the copy here, change it in public/waitlist-modal.js too —
 * the modal renders the same text next to the checkbox.
 */
export const CONSENT_TEXT =
  "I agree to receive emails from Thymos Health about my waitlist status, " +
  "new-patient enrollment, and related updates. I understand I can " +
  "unsubscribe at any time via the link in any email, and that my " +
  "information will be handled per the Thymos Health Privacy Policy.";

export const WaitlistSubmissionSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(254),
  state: z.enum(US_STATES as unknown as [string, ...string[]], {
    message: "Select your state of residence",
  }),
  referralSource: z.enum(REFERRAL_SOURCES, {
    message: "Select where you heard about us",
  }),
  questions: z.string().trim().max(2000).optional().default(""),
  // Not on the form yet; accepted if a future build adds the input.
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{7,20}$/, "Enter a valid phone number")
    .or(z.literal(""))
    .optional(),
  // The checkbox is required — must be literally true.
  consent: z.literal(true, {
    message: "Please agree to the consent statement",
  }),
  sourcePage: z.string().max(300).optional(),
  // Honeypot — real visitors never fill this hidden field in.
  companyWebsite: z.string().optional(),
});

export type WaitlistSubmission = z.infer<typeof WaitlistSubmissionSchema>;

import { z } from "zod";

/**
 * Canonical disclaimer/consent wording shown beneath the "Request a Health
 * System Analysis" form. Server stores THIS string on every row. If the copy
 * in public/Thymos Health Systems.dc.html changes, update it here too.
 */
export const HEALTH_SYSTEM_DISCLAIMER_TEXT =
  "Thymos Health needs your information to contact you about partnering for " +
  "our services. You may unsubscribe from these communications at any time. " +
  "For information on how to unsubscribe, as well as our privacy practices " +
  "and commitment to protecting your privacy, please review our Privacy Policy.";

export const HealthSystemRequestSchema = z.object({
  firstName: z.string().trim().max(100).optional().default(""),
  lastName: z.string().trim().max(100).optional().default(""),
  organization: z.string().trim().min(1, "Organization name is required").max(200),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{7,20}$/, "Enter a valid phone number")
    .or(z.literal(""))
    .optional(),
  jobTitle: z.string().trim().max(150).optional().default(""),
  sourcePage: z.string().max(300).optional(),
  // Honeypot — must stay empty.
  companyWebsite: z.string().optional(),
});

export type HealthSystemRequest = z.infer<typeof HealthSystemRequestSchema>;

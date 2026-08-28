import { z } from "zod";

const trimmed = (max: number) => z.string().trim().min(1).max(max);
const phone = z
  .string()
  .trim()
  .regex(/^[0-9+()\-.\s]{7,20}$/, "Enter a valid phone number");
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().default("");

/**
 * Provider-referral form (public/Thymos Refer A Patient.dc.html).
 * Field names match the form's `name=` attributes.
 *
 * NOTE: patient_* / address_* fields are PHI.
 */
export const ReferralSubmissionSchema = z.object({
  // Referring provider
  providerName: trimmed(200),
  practiceName: trimmed(200),
  providerPhone: phone,
  providerFax: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{7,20}$/, "Enter a valid fax number")
    .or(z.literal(""))
    .optional(),
  providerEmail: z.string().trim().min(1).email("Enter a valid email").max(254),

  // Patient (PHI)
  patientFirstName: trimmed(100),
  patientLastName: trimmed(100),
  patientDob: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date")
    .refine((v) => v >= "1900-01-01", "Date too early")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "Date is in the future"),
  patientPhone: phone,
  patientEmail: z.string().trim().min(1).email("Enter a valid email").max(254),
  patientLanguage: optionalText(80),

  // Patient address (PHI)
  addressLine1: trimmed(200),
  addressLine2: optionalText(200),
  addressCity: trimmed(120),
  // Combobox strings, e.g. "California (CA)".
  addressState: trimmed(80),
  addressZip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
  stateOfResidence: trimmed(80),

  sourcePage: z.string().max(300).optional(),
  // Honeypot — must stay empty.
  companyWebsite: z.string().optional(),
});

export type ReferralSubmission = z.infer<typeof ReferralSubmissionSchema>;

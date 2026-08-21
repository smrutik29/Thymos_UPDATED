import { z } from "zod";

export const NewsletterSignupSchema = z.object({
  email: z.string().trim().email(),
  sourcePage: z.string().optional(),
  // Anti-spam field, not part of the domain payload — should stay empty.
  companyWebsite: z.string().optional(),
});

export type NewsletterSignup = z.infer<typeof NewsletterSignupSchema>;

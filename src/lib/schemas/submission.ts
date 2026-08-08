import { z } from "zod";
import { ContactSchema } from "./contact";

const DiagnosisRowSchema = z.object({
  diagnosis: z.string(),
  since: z.string(),
});

const OtherDiagnosisRowSchema = z.object({
  diagnosis: z.string(),
  date: z.string(),
});

export const QuizSubmissionSchema = z.object({
  q1status: z.enum(["diagnosed", "none"]).nullable(),
  q1rows: z.array(DiagnosisRowSchema),
  q2rows: z.array(OtherDiagnosisRowSchema),
  symptoms: z.record(z.string(), z.boolean()),
  otherSymptomText: z.string(),
  q4choice: z.string().nullable(),
  q4other: z.string(),
  q5choice: z.enum(["Yes", "Maybe", "No"]).nullable(),
  contact: ContactSchema,
  finalChoice: z.enum(["yes", "waitlist", "no"]).nullable(),
  // Anti-spam fields, not part of the domain payload
  companyWebsite: z.string().optional(), // honeypot, should stay empty
  formRenderedAt: z.number().optional(), // client timestamp (ms), for a too-fast heuristic
});

export type QuizSubmission = z.infer<typeof QuizSubmissionSchema>;

export const SubmissionIdSchema = z.string().uuid();

export const FinalChoiceUpdateSchema = z.object({
  finalChoice: z.enum(["yes", "waitlist", "no"]),
});

export type FinalChoiceUpdate = z.infer<typeof FinalChoiceUpdateSchema>;

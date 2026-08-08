import { z } from "zod";

const todayIso = () => new Date().toISOString().slice(0, 10);

export const ContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  dob: z
    .string()
    .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Invalid date")
    .refine((v) => v === "" || v >= "1900-01-01", "Date too early")
    .refine((v) => v === "" || v <= todayIso(), "Date cannot be in the future"),
  state: z.string().trim(),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-.\s]{7,20}$/, "Enter a valid phone number")
    .or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof ContactSchema>;

export const DOB_MIN = "1900-01-01";
export const DOB_MAX = todayIso();

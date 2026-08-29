"use client";

import { useEffect, useState, type Dispatch } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactSchema, type ContactFormValues } from "@/lib/schemas/contact";
import { TextField } from "../primitives/TextField";
import { SelectField } from "../primitives/SelectField";
import { DateField } from "../primitives/DateField";
import { ContinueButton } from "../primitives/ContinueButton";
import { US_STATES } from "@/lib/quiz/us-states";
import { contactContent } from "@/lib/quiz/content";
import type { QuizAction, QuizState } from "@/lib/quiz/types";

interface ContactScreenProps {
  state: QuizState;
  dispatch: Dispatch<QuizAction>;
  onSubmit: (
    contact: ContactFormValues,
    honeypot: string,
    turnstileToken: string
  ) => void;
}

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAEgd99jX8gK0sp_v";
const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";

export function ContactScreen({ state, dispatch, onSubmit }: ContactScreenProps) {
  const [honeypot, setHoneypot] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  // Load the Turnstile script once; it auto-renders any .cf-turnstile div.
  useEffect(() => {
    if (document.querySelector(`script[src="${TURNSTILE_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }, []);
  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    mode: "onChange",
    defaultValues: state.contact,
  });

  const name = watch("name");
  const email = watch("email");
  const isSubmitting = state.submitStatus === "submitting";
  const canSubmit =
    name.trim().length > 0 &&
    ContactSchema.shape.email.safeParse(email).success &&
    !isSubmitting;

  const submit = handleSubmit((values) => {
    const tokenEl = document.querySelector<HTMLInputElement>(
      'input[name="cf-turnstile-response"]'
    );
    const turnstileToken = tokenEl?.value ?? "";
    if (!turnstileToken) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);
    dispatch({ type: "SET_CONTACT_FIELD", field: "name", value: values.name });
    dispatch({ type: "SET_CONTACT_FIELD", field: "dob", value: values.dob });
    dispatch({ type: "SET_CONTACT_FIELD", field: "state", value: values.state });
    dispatch({ type: "SET_CONTACT_FIELD", field: "email", value: values.email });
    dispatch({ type: "SET_CONTACT_FIELD", field: "phone", value: values.phone });
    onSubmit(values, honeypot, turnstileToken);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-6 sm:p-10 md:p-12">
      <h2 className="font-heading text-[21px] font-bold text-ink sm:text-[26px]">
        {contactContent.heading}
      </h2>
      <p className="text-[14px] text-ink-muted">{contactContent.subcopy}</p>

      {/* Honeypot field — real users never see or fill this in.
          Named/positioned to avoid Chrome's autofill heuristics, which
          target common patterns like "company"/"website" even through
          autocomplete="off" and opacity-based hiding. */}
      <input
        type="text"
        name="hp_field_9f3a"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className="flex flex-col gap-1.5">
        <TextField
          value={watch("name")}
          onChange={(v) => setValue("name", v, { shouldValidate: true })}
          placeholder={contactContent.namePlaceholder}
        />
        {errors.name && <span className="text-[12px] text-red-600">{errors.name.message}</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <DateField
            value={watch("dob")}
            onChange={(v) => setValue("dob", v, { shouldValidate: true })}
          />
          {errors.dob && <span className="text-[12px] text-red-600">{errors.dob.message}</span>}
        </div>
        <SelectField
          value={watch("state")}
          onChange={(v) => setValue("state", v, { shouldValidate: true })}
          options={US_STATES}
          placeholder={contactContent.statePlaceholder}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <TextField
          type="email"
          value={watch("email")}
          onChange={(v) => setValue("email", v, { shouldValidate: true })}
          placeholder={contactContent.emailPlaceholder}
        />
        {errors.email && <span className="text-[12px] text-red-600">{errors.email.message}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <TextField
          type="tel"
          value={watch("phone")}
          onChange={(v) => setValue("phone", v, { shouldValidate: true })}
          placeholder={contactContent.phonePlaceholder}
        />
        {errors.phone && <span className="text-[12px] text-red-600">{errors.phone.message}</span>}
      </div>

      <div
        className="cf-turnstile"
        data-sitekey={TURNSTILE_SITE_KEY}
        data-theme="light"
      />
      {captchaError && (
        <span className="text-[12px] text-red-600">
          Please complete the verification challenge and try again.
        </span>
      )}

      {state.submitStatus === "error" && (
        <span className="text-[12px] text-red-600">
          Something went wrong saving your info — please try again.
        </span>
      )}

      <ContinueButton onClick={submit} disabled={!canSubmit}>
        {isSubmitting ? "Saving…" : contactContent.cta}
      </ContinueButton>
    </form>
  );
}

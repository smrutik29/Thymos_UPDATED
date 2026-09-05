import type { FinalChoice, Q5Choice } from "./types";

export const introContent = {
  heading: "Find out what's really driving your symptoms.",
  body: [
    "Most people spend years chasing symptoms instead of causes.",
    "In 2 minutes, tell us what's going on — we'll show you what a personalized, root-cause approach could look like for you.",
  ],
  cta: "Start My Quiz →",
};

export const q1Content = {
  meta: "Question 1 of 5",
  heading: "Do you have an autoimmune diagnosis?",
  yesLabel: "Yes, I have a diagnosis",
  noLabel: "No diagnosis yet",
  addRowLabel: "+ Add another diagnosis",
  rowMax: 3,
};

export const q1ResponseContent: Record<"diagnosed" | "none", string> = {
  diagnosed:
    "You're already ahead of the curve. Knowing what you're dealing with is the first step — the next is finally treating the why, not just the what.",
  none: "That's more common than you'd think — it takes the average person over 4 years to get an autoimmune diagnosis. Thymos physicians specialize in finding answers faster, and building a plan that helps you feel better while you get there.",
};

export const q2Content = {
  meta: "Question 2 of 5",
  heading: "What other diagnoses have you received?",
  subcopy: "Optional — add as many as apply.",
  addRowLabel: "+ Add another diagnosis",
  initialRows: 3,
};

export const q2ResponseContent =
  "Thanks for sharing! Conditions like these are often more connected than most doctors have time to explore — that's exactly the kind of pattern our physicians are trained to find.";

export const q3Content = {
  meta: "Question 3 of 5",
  heading: "What symptoms are you experiencing?",
  otherPlaceholder: "Other symptom…",
};

export const q3TransitionContent =
  "That's a lot to carry — and it's rarely just one thing causing it all.";

export const q4Content = {
  meta: "Question 4 of 5",
  heading: "Why are you looking for a solution?",
  options: [
    "I'm fed up with my symptoms hurting my quality of life.",
    "I'm losing hope — treatments aren't working.",
    "I want to understand why I am not getting better.",
    "All of the above",
    "Other",
  ],
  otherPlaceholder: "Tell us more…",
};

export const q4ResponseContent = {
  lines: [
    "You're not imagining it. And you're NOT ALONE!",
    "Autoimmune conditions are personal. No one else has your exact symptoms, body, or life. So a treatment plan made for “everyone” is really just a guess.",
  ],
  closing: "Care built around YOU gets real results.",
  closingUnderline: "real results",
};

export const q5Content = {
  meta: "Question 5 of 5",
  heading: "Are you interested in care built around the root cause of your symptoms?",
  options: [
    { value: "Yes" as Q5Choice, label: "Yes, I'm interested" },
    { value: "Maybe" as Q5Choice, label: "Maybe, I'm just exploring" },
    { value: "No" as Q5Choice, label: "No, I'm not interested" },
  ],
  cta: "See what patients experience →",
};

interface Q5ResponseBranch {
  heading: string;
  stats: string[];
}

const sharedMaybeNoStats = [
  "84% reduction in symptoms within 3 months",
  "62% decrease in inflammation within 6 months",
  "80% reduction in overall health issues within 1 year",
];

export const q5ResponseContent: Record<Q5Choice, Q5ResponseBranch> = {
  Yes: {
    heading:
      "That's exactly the mindset that gets results. Patients who worked closely with Thymos physicians saw:",
    stats: [
      "84% reduction in symptoms within 3 months",
      "67% decrease in premature cell damage within 6 months",
      "80% reduction in inflammation within 1 year",
    ],
  },
  Maybe: {
    heading:
      "Totally fair — this is a big decision, and it's worth doing your homework. Patients who worked closely with Thymos physicians saw:",
    stats: sharedMaybeNoStats,
  },
  No: {
    heading:
      "We get it — you've probably tried a lot already. But here's something worth knowing: fewer than 33% of patients respond to FDA-approved autoimmune medications. Patients with symptoms like yours who worked closely with Thymos physicians saw:",
    stats: sharedMaybeNoStats,
  },
};

export const q5ResponseFinePrint =
  "Individual results vary based on specific conditions and adherence to care plan.";

export const q5ResponseCta = "See My Results →";

export const contactContent = {
  heading: "Enter your info below and receive your personalized results.",
  subcopy: "No cost, no obligation — just clarity on your next step.",
  namePlaceholder: "Name",
  dobPlaceholder: "Date of Birth",
  statePlaceholder: "State",
  emailPlaceholder: "Email",
  phonePlaceholder: "Phone (optional)",
  cta: "Get My Results →",
};

export const thankyouContent: Record<"no" | "other", string> = {
  no: "Best of luck! Let us know how we can help anytime.",
  other: "Thank you!\nWe'll reach out to you soon.",
};

export function thankyouTextFor(choice: FinalChoice | null): string {
  return choice === "no" ? thankyouContent.no : thankyouContent.other;
}

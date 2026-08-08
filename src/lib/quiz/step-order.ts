import type { Step } from "./types";

export const STEP_ORDER: Step[] = [
  "intro",
  "q1",
  "q1resp",
  "q2",
  "q2resp",
  "q3",
  "q3trans",
  "q4",
  "q4resp",
  "q5",
  "q5resp",
  "contact",
  "final",
  "thankyou",
];

export const STEP_LABELS: Partial<Record<Step, string>> = {
  q1: "Diagnosis",
  q1resp: "Diagnosis",
  q2: "History",
  q2resp: "History",
  q3: "Symptoms",
  q3trans: "Symptoms",
  q4: "Goals",
  q4resp: "Goals",
  q5: "Care",
  q5resp: "Care",
  contact: "Your info",
  final: "Next step",
  thankyou: "Done",
};

const NO_CHROME_STEPS: Step[] = ["intro", "contact", "final", "thankyou"];

export interface StepChrome {
  showProgress: boolean;
  showBack: boolean;
}

export function stepChrome(step: Step): StepChrome {
  const hasChrome = !NO_CHROME_STEPS.includes(step);
  return { showProgress: hasChrome, showBack: hasChrome };
}

export function stepIndex(step: Step): number {
  return STEP_ORDER.indexOf(step);
}

export function progressRatio(step: Step): number {
  const idx = stepIndex(step);
  return idx / (STEP_ORDER.length - 1);
}

export type CardVariant = "white" | "green" | "yellow" | "tan";

const CARD_VARIANTS: Record<Step, CardVariant> = {
  intro: "white",
  q1: "white",
  q1resp: "green",
  q2: "white",
  q2resp: "yellow",
  q3: "white",
  q3trans: "green",
  q4: "white",
  q4resp: "yellow",
  q5: "white",
  q5resp: "green",
  contact: "white",
  final: "white",
  thankyou: "tan",
};

export function cardVariantForStep(step: Step): CardVariant {
  return CARD_VARIANTS[step];
}

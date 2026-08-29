export type Step =
  | "intro"
  | "q1"
  | "q1resp"
  | "q2"
  | "q2resp"
  | "q3"
  | "q3trans"
  | "q4"
  | "q4resp"
  | "q5"
  | "q5resp"
  | "contact"
  | "final"
  | "thankyou";

export interface DiagnosisRow {
  diagnosis: string;
  since: string;
}

export interface OtherDiagnosisRow {
  diagnosis: string;
  date: string;
}

export interface ContactInfo {
  name: string;
  dob: string;
  state: string;
  email: string;
  phone: string;
}

export type Q5Choice = "Yes" | "Maybe" | "No";
export type FinalChoice = "yes" | "waitlist" | "no";
export type SubmitStatus = "idle" | "submitting" | "success" | "error";

export interface QuizState {
  step: Step;
  q1status: "diagnosed" | "none" | null;
  q1rows: DiagnosisRow[];
  q2rows: OtherDiagnosisRow[];
  symptoms: Record<string, boolean>;
  otherSymptomText: string;
  q4choice: string | null;
  q4other: string;
  q5choice: Q5Choice | null;
  contact: ContactInfo;
  finalChoice: FinalChoice | null;
  submitStatus: SubmitStatus;
  submissionId: string | null;
  /** HMAC issued with the id; required to PATCH the submission later. */
  submissionToken: string | null;
}

export type QuizAction =
  | { type: "GO_NEXT" }
  | { type: "GO_BACK" }
  | { type: "SET_Q1_STATUS"; status: "diagnosed" | "none" }
  | { type: "ADD_Q1_ROW" }
  | { type: "UPDATE_Q1_ROW"; index: number; row: Partial<DiagnosisRow> }
  | { type: "ADD_Q2_ROW" }
  | { type: "UPDATE_Q2_ROW"; index: number; row: Partial<OtherDiagnosisRow> }
  | { type: "TOGGLE_SYMPTOM"; key: string }
  | { type: "SET_OTHER_SYMPTOM_TEXT"; text: string }
  | { type: "SET_Q4_CHOICE"; choice: string }
  | { type: "SET_Q4_OTHER"; text: string }
  | { type: "SET_Q5_CHOICE"; choice: Q5Choice }
  | { type: "SET_CONTACT_FIELD"; field: keyof ContactInfo; value: string }
  | { type: "SET_FINAL_CHOICE_AND_ADVANCE"; choice: FinalChoice }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "SUBMIT_ERROR" }
  | { type: "SET_SUBMISSION_ID"; id: string; token?: string | null };

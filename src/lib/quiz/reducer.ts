import type { QuizAction, QuizState } from "./types";
import { STEP_ORDER } from "./step-order";
import { q1Content, q2Content } from "./content";

export const initialState: QuizState = {
  step: "intro",
  q1status: null,
  q1rows: [{ diagnosis: "", since: "" }],
  q2rows: Array.from({ length: q2Content.initialRows }, () => ({
    diagnosis: "",
    date: "",
  })),
  symptoms: {},
  otherSymptomText: "",
  q4choice: null,
  q4other: "",
  q5choice: null,
  contact: { name: "", dob: "", state: "", email: "", phone: "" },
  finalChoice: null,
  submitStatus: "idle",
  submissionId: null,
};

function goToOffset(state: QuizState, offset: number): QuizState {
  const idx = STEP_ORDER.indexOf(state.step);
  const nextIdx = Math.min(Math.max(idx + offset, 0), STEP_ORDER.length - 1);
  return { ...state, step: STEP_ORDER[nextIdx] };
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "GO_NEXT":
      return goToOffset(state, 1);
    case "GO_BACK":
      return goToOffset(state, -1);
    case "SET_Q1_STATUS":
      return { ...state, q1status: action.status };
    case "ADD_Q1_ROW":
      if (state.q1rows.length >= q1Content.rowMax) return state;
      return { ...state, q1rows: [...state.q1rows, { diagnosis: "", since: "" }] };
    case "UPDATE_Q1_ROW":
      return {
        ...state,
        q1rows: state.q1rows.map((row, i) =>
          i === action.index ? { ...row, ...action.row } : row
        ),
      };
    case "ADD_Q2_ROW":
      return { ...state, q2rows: [...state.q2rows, { diagnosis: "", date: "" }] };
    case "UPDATE_Q2_ROW":
      return {
        ...state,
        q2rows: state.q2rows.map((row, i) =>
          i === action.index ? { ...row, ...action.row } : row
        ),
      };
    case "TOGGLE_SYMPTOM":
      return {
        ...state,
        symptoms: { ...state.symptoms, [action.key]: !state.symptoms[action.key] },
      };
    case "SET_OTHER_SYMPTOM_TEXT":
      return { ...state, otherSymptomText: action.text };
    case "SET_Q4_CHOICE":
      return { ...state, q4choice: action.choice };
    case "SET_Q4_OTHER":
      return { ...state, q4other: action.text };
    case "SET_Q5_CHOICE":
      return { ...state, q5choice: action.choice };
    case "SET_CONTACT_FIELD":
      return {
        ...state,
        contact: { ...state.contact, [action.field]: action.value },
      };
    case "SET_FINAL_CHOICE_AND_ADVANCE":
      return goToOffset({ ...state, finalChoice: action.choice }, 1);
    case "SUBMIT_START":
      return { ...state, submitStatus: "submitting" };
    case "SUBMIT_SUCCESS":
      return { ...state, submitStatus: "success" };
    case "SUBMIT_ERROR":
      return { ...state, submitStatus: "error" };
    case "SET_SUBMISSION_ID":
      return { ...state, submissionId: action.id };
    default:
      return state;
  }
}

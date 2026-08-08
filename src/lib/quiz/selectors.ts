import type { QuizState, Step } from "./types";

export function canAdvance(step: Step, state: QuizState): boolean {
  switch (step) {
    case "q1":
      return state.q1status !== null;
    case "q4":
      return state.q4choice !== null;
    case "q5":
      return state.q5choice !== null;
    default:
      return true;
  }
}

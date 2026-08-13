import { QuizHeader } from "thymos-quiz-app";

export function WithStepLabel() {
  return <QuizHeader stepLabel="Question 1 of 5" />;
}

export function WithoutStepLabel() {
  return <QuizHeader />;
}

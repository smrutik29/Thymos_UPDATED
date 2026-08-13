import { ContinueButton } from "thymos-quiz-app";

export function Enabled() {
  return <ContinueButton onClick={() => {}}>Continue →</ContinueButton>;
}

export function Disabled() {
  return <ContinueButton onClick={() => {}} disabled>Continue →</ContinueButton>;
}

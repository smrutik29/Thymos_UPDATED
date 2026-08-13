import { StepTransition, QuizCard } from "thymos-quiz-app";

export function Default() {
  return (
    <StepTransition stepKey="q1">
      <QuizCard variant="white">
        <div style={{ padding: 24 }}>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>
            Do you have an autoimmune diagnosis?
          </h2>
        </div>
      </QuizCard>
    </StepTransition>
  );
}

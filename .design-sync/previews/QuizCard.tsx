import { QuizCard } from "thymos-quiz-app";

function Body({ heading }: { heading: string }) {
  return (
    <div style={{ padding: 24 }}>
      <span style={{ fontSize: 13, color: "var(--ink-muted)" }}>Question 1 of 5</span>
      <h2 style={{ fontFamily: "var(--font-heading, inherit)", fontSize: 21, fontWeight: 700, margin: "8px 0 0" }}>
        {heading}
      </h2>
    </div>
  );
}

export function White() {
  return (
    <QuizCard variant="white">
      <Body heading="Do you have an autoimmune diagnosis?" />
    </QuizCard>
  );
}

export function Green() {
  return (
    <QuizCard variant="green">
      <Body heading="That's more common than you'd think." />
    </QuizCard>
  );
}

export function Yellow() {
  return (
    <QuizCard variant="yellow">
      <Body heading="That's a lot to carry." />
    </QuizCard>
  );
}

export function Tan() {
  return (
    <QuizCard variant="tan">
      <Body heading="Are you interested in root-cause care?" />
    </QuizCard>
  );
}

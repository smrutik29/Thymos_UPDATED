import { Logo } from "thymos-quiz-app";

export function Green() {
  return <Logo variant="green" />;
}

export function White() {
  return (
    <div style={{ background: "#2c2a22", padding: 16, display: "inline-block" }}>
      <Logo variant="white" />
    </div>
  );
}

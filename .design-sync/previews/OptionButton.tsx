import { OptionButton } from "thymos-quiz-app";

export function Unselected() {
  return <OptionButton selected={false} onClick={() => {}}>No diagnosis yet</OptionButton>;
}

export function Selected() {
  return <OptionButton selected={true} onClick={() => {}}>Yes, I have a diagnosis</OptionButton>;
}

export function ChoicePair() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420 }}>
      <OptionButton selected={true} onClick={() => {}}>Yes, I have a diagnosis</OptionButton>
      <OptionButton selected={false} onClick={() => {}}>No diagnosis yet</OptionButton>
    </div>
  );
}

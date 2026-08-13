import { Chip } from "thymos-quiz-app";

export function Unselected() {
  return <Chip selected={false} onClick={() => {}}>Bloating</Chip>;
}

export function Selected() {
  return <Chip selected={true} onClick={() => {}}>Fatigue</Chip>;
}

export function SymptomGroup() {
  const symptoms = ["Nausea or Vomiting", "Diarrhea", "Constipation", "Bloating", "Heartburn"];
  const selected = new Set(["Bloating", "Heartburn"]);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {symptoms.map((s) => (
        <Chip key={s} selected={selected.has(s)} onClick={() => {}}>
          {s}
        </Chip>
      ))}
    </div>
  );
}

import { useState } from "react";
import { SelectField } from "thymos-quiz-app";

const STATES = ["California", "New York", "Texas", "Florida", "Washington"];

export function Placeholder() {
  const [value, setValue] = useState("");
  return (
    <div style={{ maxWidth: 360 }}>
      <SelectField value={value} onChange={setValue} options={STATES} placeholder="State" />
    </div>
  );
}

export function Selected() {
  const [value, setValue] = useState("New York");
  return (
    <div style={{ maxWidth: 360 }}>
      <SelectField value={value} onChange={setValue} options={STATES} placeholder="State" />
    </div>
  );
}

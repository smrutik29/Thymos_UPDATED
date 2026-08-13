import { useState } from "react";
import { TextField } from "thymos-quiz-app";

export function Empty() {
  const [value, setValue] = useState("");
  return <div style={{ maxWidth: 360 }}><TextField value={value} onChange={setValue} placeholder="Other symptom…" /></div>;
}

export function Filled() {
  const [value, setValue] = useState("Joint pain");
  return <div style={{ maxWidth: 360 }}><TextField value={value} onChange={setValue} placeholder="Other symptom…" /></div>;
}

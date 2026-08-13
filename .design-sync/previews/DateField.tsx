import { useState } from "react";
import { DateField } from "thymos-quiz-app";

export function Empty() {
  const [value, setValue] = useState("");
  return <div style={{ maxWidth: 360 }}><DateField value={value} onChange={setValue} /></div>;
}

export function Filled() {
  const [value, setValue] = useState("1990-06-15");
  return <div style={{ maxWidth: 360 }}><DateField value={value} onChange={setValue} /></div>;
}

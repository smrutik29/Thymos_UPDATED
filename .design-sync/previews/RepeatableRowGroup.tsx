import { useState } from "react";
import { RepeatableRowGroup } from "thymos-quiz-app";

interface DiagnosisRow {
  diagnosis: string;
  since: string;
}

const FIELDS = [
  { key: "diagnosis" as const, placeholder: "Diagnosis" },
  { key: "since" as const, placeholder: "Since when" },
];

export function WithRows() {
  const [rows, setRows] = useState<DiagnosisRow[]>([
    { diagnosis: "Hashimoto's", since: "2019" },
    { diagnosis: "", since: "" },
  ]);
  return (
    <div style={{ maxWidth: 480 }}>
      <RepeatableRowGroup
        rows={rows}
        fields={FIELDS}
        onUpdateRow={(i, patch) =>
          setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
        }
        onAddRow={() => setRows((r) => [...r, { diagnosis: "", since: "" }])}
        addLabel="+ Add another diagnosis"
      />
    </div>
  );
}

export function SingleRow() {
  const [rows, setRows] = useState<DiagnosisRow[]>([{ diagnosis: "", since: "" }]);
  return (
    <div style={{ maxWidth: 480 }}>
      <RepeatableRowGroup
        rows={rows}
        fields={FIELDS}
        onUpdateRow={(i, patch) =>
          setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
        }
        onAddRow={() => setRows((r) => [...r, { diagnosis: "", since: "" }])}
        addLabel="+ Add another diagnosis"
      />
    </div>
  );
}

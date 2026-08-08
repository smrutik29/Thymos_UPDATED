import { TextField } from "./TextField";
import { DOB_MIN, DOB_MAX } from "@/lib/schemas/contact";

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function DateField({ value, onChange }: DateFieldProps) {
  return <TextField type="date" value={value} onChange={onChange} min={DOB_MIN} max={DOB_MAX} />;
}

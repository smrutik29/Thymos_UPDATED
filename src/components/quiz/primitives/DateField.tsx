import { TextField } from "./TextField";
import { DOB_MIN, DOB_MAX } from "@/lib/schemas/contact";

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DateField({ value, onChange, placeholder }: DateFieldProps) {
  return (
    <div className="relative">
      <TextField type="date" value={value} onChange={onChange} min={DOB_MIN} max={DOB_MAX} />
      {!value && placeholder && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-ink-muted">
          {placeholder}
        </span>
      )}
    </div>
  );
}

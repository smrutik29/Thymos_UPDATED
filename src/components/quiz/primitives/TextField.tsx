interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "date" | "email" | "tel";
  min?: string;
  max?: string;
  name?: string;
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
  name,
}: TextFieldProps) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full rounded-input border border-input-border bg-card-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-muted focus:border-gold focus:outline-none sm:py-3.5"
    />
  );
}

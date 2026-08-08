import clsx from "clsx";

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}

export function SelectField({ value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx(
        "w-full rounded-input border border-input-border bg-card-white px-4 py-3 text-[15px] focus:border-gold focus:outline-none sm:py-3.5",
        value ? "text-ink" : "text-ink-muted"
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

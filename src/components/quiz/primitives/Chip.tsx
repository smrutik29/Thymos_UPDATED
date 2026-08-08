import type { ReactNode } from "react";
import clsx from "clsx";

interface ChipProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function Chip({ selected, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "rounded-pill border px-4 py-2.5 font-body text-[14px] transition-colors duration-150",
        selected
          ? "border-chip-selected-border bg-chip-selected-bg"
          : "border-chip-border bg-chip-bg hover:border-ink-muted"
      )}
    >
      {children}
    </button>
  );
}

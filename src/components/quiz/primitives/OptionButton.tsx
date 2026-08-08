import type { ReactNode } from "react";
import clsx from "clsx";

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function OptionButton({ selected, onClick, children, className }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "w-full rounded-option border-[1.5px] px-5 py-4 text-left font-body text-[16px] transition-colors duration-150",
        selected
          ? "border-option-selected-border bg-option-selected-bg"
          : "border-option-border bg-option-bg hover:border-ink-muted",
        className
      )}
    >
      {children}
    </button>
  );
}

import type { ReactNode } from "react";
import clsx from "clsx";

interface DarkButtonProps {
  onClick: () => void;
  children: ReactNode;
  visible?: boolean;
  className?: string;
}

export function DarkButton({ onClick, children, visible = true, className }: DarkButtonProps) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-pill bg-dark-cta-bg px-9 py-4 font-heading text-[17px] font-semibold text-dark-cta-text transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(44,42,34,0.25)] sm:w-auto",
        className
      )}
    >
      {children}
    </button>
  );
}

import type { ReactNode } from "react";
import clsx from "clsx";

interface ContinueButtonProps {
  onClick: () => void;
  children: ReactNode;
  visible?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ContinueButton({
  onClick,
  children,
  visible = true,
  disabled = false,
  className,
}: ContinueButtonProps) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "w-full rounded-pill px-9 py-4 font-heading text-[17px] font-semibold transition-[transform,box-shadow] duration-150 sm:w-auto",
        disabled
          ? "cursor-not-allowed bg-disabled-bg text-disabled-text"
          : "bg-gold text-ink hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(231,183,64,0.4)]",
        className
      )}
    >
      {children}
    </button>
  );
}

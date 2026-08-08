import type { ReactNode } from "react";
import clsx from "clsx";

type CardVariant = "white" | "green" | "yellow" | "tan";

const VARIANT_BG: Record<CardVariant, string> = {
  white: "bg-card-white",
  green: "bg-card-green",
  yellow: "bg-card-yellow",
  tan: "bg-card-tan",
};

interface QuizCardProps {
  variant?: CardVariant;
  className?: string;
  children: ReactNode;
}

export function QuizCard({ variant = "white", className, children }: QuizCardProps) {
  return (
    <div
      className={clsx(
        "rounded-card shadow-card overflow-hidden",
        VARIANT_BG[variant],
        className
      )}
    >
      {children}
    </div>
  );
}

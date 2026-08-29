interface QuizHeaderProps {
  stepLabel?: string;
}

export function QuizHeader({ stepLabel }: QuizHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3.5">
      <a
        href="/"
        className="font-heading text-[20px] font-bold text-ink"
      >
        Thymos Health
      </a>
      {stepLabel && <span className="text-[13px] text-ink-muted">{stepLabel}</span>}
    </div>
  );
}

interface ProgressBarProps {
  ratio: number;
}

export function ProgressBar({ ratio }: ProgressBarProps) {
  return (
    <div className="h-[5px] w-full overflow-hidden rounded-pill bg-option-border">
      <div
        className="h-full rounded-pill bg-gold transition-[width] duration-400 ease-out"
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

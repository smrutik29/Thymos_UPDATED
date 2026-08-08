interface BackLinkProps {
  onClick: () => void;
}

export function BackLink({ onClick }: BackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-[14px] text-ink-muted transition-colors hover:text-ink"
    >
      ← Back
    </button>
  );
}

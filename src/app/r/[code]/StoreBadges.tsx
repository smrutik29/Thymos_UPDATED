import clsx from "clsx";
import type { StoreBadge } from "@/lib/referral-landing/content";

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
      <path d="M16.365 12.79c.03 3.24 2.84 4.32 2.87 4.33-.02.08-.45 1.54-1.48 3.05-.9 1.3-1.83 2.6-3.29 2.63-1.44.03-1.9-.85-3.55-.85-1.64 0-2.15.82-3.51.88-1.41.05-2.49-1.41-3.39-2.71-1.85-2.67-3.26-7.55-1.36-10.84.94-1.64 2.63-2.67 4.46-2.7 1.39-.03 2.7.94 3.55.94.85 0 2.45-1.16 4.13-.99.7.03 2.67.28 3.94 2.14-.1.06-2.35 1.37-2.37 4.12M13.72 4.4c.75-.91 1.26-2.17 1.12-3.43-1.08.04-2.39.72-3.17 1.63-.7.8-1.3 2.09-1.14 3.32 1.21.09 2.44-.61 3.19-1.52" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-current">
      <path d="M3.6 1.8a1.5 1.5 0 0 0-.6 1.2v18a1.5 1.5 0 0 0 .6 1.2L13.2 12 3.6 1.8Zm11.1 8.7L5.9 1.7l10.8 6.2-2 2.6Zm0 3 2 2.6L5.9 22.3l8.8-8.8Zm1.3-1.5 2.9-1.7c.9-.5.9-1.4 0-1.9l-2.9-1.7L13.8 12l2.2 2Z" />
    </svg>
  );
}

interface StoreBadgesProps {
  badges: StoreBadge[];
}

/**
 * Text badges styled with the site tokens rather than the stores' licensed
 * artwork. While `href` is null (apps not yet listed, ADR-0006 §6) each badge
 * is a non-interactive "Coming soon" tile.
 */
export function StoreBadges({ badges }: StoreBadgesProps) {
  return (
    <ul className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      {badges.map((badge) => {
        const inner = (
          <>
            {badge.store === "apple" ? <AppleMark /> : <PlayMark />}
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">
                {badge.href ? "Get it on" : "Coming soon to"}
              </span>
              <span className="font-heading text-[16px] font-semibold">{badge.label}</span>
            </span>
          </>
        );
        const baseClass =
          "flex w-full items-center justify-center gap-3 rounded-option border px-5 py-3 sm:w-auto sm:min-w-[190px]";
        return (
          <li key={badge.store} className="w-full sm:w-auto">
            {badge.href ? (
              <a
                href={badge.href}
                className={clsx(
                  baseClass,
                  "border-dark-cta-bg bg-dark-cta-bg text-dark-cta-text transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(44,42,34,0.25)]"
                )}
              >
                {inner}
              </a>
            ) : (
              <div
                aria-disabled="true"
                className={clsx(baseClass, "border-option-border bg-disabled-bg text-disabled-text")}
              >
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

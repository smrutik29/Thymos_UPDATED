"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface CopyCodeButtonProps {
  code: string;
}

type CopyState = "idle" | "copied" | "failed";

export function CopyCodeButton({ code }: CopyCodeButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const showThenReset = (next: CopyState) => {
    setState(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setState("idle"), 2200);
  };

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        showThenReset("copied");
        return;
      }
    } catch {
      // fall through to the selection fallback
    }
    // Older WebViews / non-secure contexts: select + execCommand.
    try {
      const el = document.createElement("textarea");
      el.value = code;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      showThenReset(ok ? "copied" : "failed");
    } catch {
      showThenReset("failed");
    }
  };

  const label =
    state === "copied" ? "Copied!" : state === "failed" ? "Select & copy" : "Copy code";

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className={clsx(
          "rounded-pill px-6 py-3 font-heading text-[15px] font-semibold transition-[transform,box-shadow,background-color] duration-150",
          state === "copied"
            ? "bg-card-green text-ink"
            : "bg-gold text-ink hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(231,183,64,0.4)]"
        )}
      >
        {label}
      </button>
      <span className="sr-only" role="status">
        {state === "copied" ? `Referral code ${code} copied to clipboard` : ""}
      </span>
    </>
  );
}

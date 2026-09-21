"use client";

import { useSyncExternalStore } from "react";

interface OpenInAppButtonProps {
  /** `thymos://r/<CODE>` — the custom-scheme fallback from ADR-0006 §1. */
  href: string;
}

const MOBILE_UA = /iPhone|iPad|iPod|Android/i;
const noopSubscribe = () => () => {};
const isMobileClient = () => MOBILE_UA.test(navigator.userAgent || "");
// Server render (and the first client render, for hydration) says "not mobile".
const isMobileServer = () => false;

/**
 * Shown only on iOS/Android. On desktop a custom-scheme link has no handler and
 * some browsers surface an error dialog, so the button is not rendered there.
 * Universal Links / App Links open the app directly when it is installed; this
 * button is for the case where the browser showed the page instead.
 */
export function OpenInAppButton({ href }: OpenInAppButtonProps) {
  const isMobile = useSyncExternalStore(noopSubscribe, isMobileClient, isMobileServer);

  if (!isMobile) return null;

  return (
    <a
      href={href}
      className="inline-block w-full rounded-pill bg-dark-cta-bg px-9 py-4 text-center font-heading text-[17px] font-semibold text-dark-cta-text transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(44,42,34,0.25)] sm:w-auto"
    >
      Open in the Thymos app
    </a>
  );
}

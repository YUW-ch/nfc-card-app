"use client";

// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

import type { ButtonHTMLAttributes, ReactNode } from "react";

// Minimal pill button for the designer, visually identical to the marketing
// site's solid Button. The shadow follows the host's --color-accent.
export function Button({
  children,
  className = "",
  ...props
}: { children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_color-mix(in_srgb,var(--color-accent)_70%,transparent)] transition-all duration-300 will-change-transform hover:-translate-y-0.5 hover:bg-accent-ink disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="transition-transform duration-300 group-hover:translate-x-1"
      aria-hidden
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

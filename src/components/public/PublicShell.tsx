"use client";

import type { ReactNode } from "react";
import type { Locale, PageTheme } from "@/lib/types";
import { LOCALE_LABELS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const DEFAULT_BRAND = "#f0431f";

/** Best-effort contrast pick for text on top of a brand-colored surface. */
export function readableOn(hex?: string): string {
  const c = (hex ?? DEFAULT_BRAND).replace("#", "");
  if (c.length !== 6 && c.length !== 3) return "#ffffff";
  const full =
    c.length === 3
      ? c
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#14120f" : "#ffffff";
}

export function PublicShell({
  theme,
  children,
  locales,
  locale,
  onLocale,
}: {
  theme?: PageTheme;
  children: ReactNode;
  locales?: Locale[];
  locale?: Locale;
  onLocale?: (l: Locale) => void;
}) {
  const brand = theme?.brandColor || DEFAULT_BRAND;
  const showSwitcher = locales && locales.length > 1 && onLocale && locale;

  const background = theme?.background;
  const isImageBg = !!background && /url\(|gradient|http/i.test(background);

  return (
    <div
      className="tap-safe flex min-h-[100dvh] w-full flex-col items-center"
      style={{
        background: background
          ? isImageBg
            ? background
            : background
          : "var(--color-paper)",
        backgroundSize: isImageBg ? "cover" : undefined,
        backgroundPosition: isImageBg ? "center" : undefined,
        color: theme?.textColor || "var(--color-ink)",
      }}
    >
      <div className="flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
        {showSwitcher && (
          <div className="no-scrollbar -mx-5 mb-2 flex justify-center gap-2 overflow-x-auto px-5 py-3">
            {locales!.map((l) => {
              const active = l === locale;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => onLocale!(l)}
                  aria-pressed={active}
                  className={cn(
                    "min-h-[36px] shrink-0 rounded-full px-4 text-sm font-semibold transition",
                  )}
                  style={
                    active
                      ? { background: brand, color: readableOn(brand) }
                      : {
                          background: "rgba(20,18,15,0.06)",
                          color: "inherit",
                        }
                  }
                >
                  {LOCALE_LABELS[l]}
                </button>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

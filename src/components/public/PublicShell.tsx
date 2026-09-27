"use client";

import type { ReactNode } from "react";
import { LOCALE_LABELS, pickLocalized } from "@/lib/i18n";
import type { Locale, PageTheme } from "@/lib/page-content";
import { LOGO_HEIGHT, fontStylesheetHref, resolveTheme, themeStyle } from "@/lib/page-theme";
import { cn } from "@/lib/utils";

// Re-exported for the views; the source of truth lives in page-theme.ts.
export { DEFAULT_BRAND, readableOn } from "@/lib/page-theme";

/**
 * The page frame: applies the theme (colours, fonts, corners as CSS variables),
 * loads the theme's web fonts and centres a phone-width column. `embedded`
 * sizes it to its container (the editor preview) instead of the viewport.
 */
export function PublicShell({
  theme,
  header,
  children,
  embedded = false,
}: {
  theme?: PageTheme;
  header?: ReactNode;
  children: ReactNode;
  embedded?: boolean;
}) {
  const fonts = fontStylesheetHref(theme);
  return (
    <div
      className={cn(
        "tap-safe flex w-full flex-col items-center",
        embedded ? "min-h-full" : "min-h-[100dvh]",
      )}
      style={themeStyle(theme)}
    >
      {fonts && <link rel="stylesheet" href={fonts} precedence="default" />}
      <div className="flex w-full max-w-md flex-1 flex-col">
        {header}
        <div className="flex flex-1 flex-col px-5 pb-10">{children}</div>
      </div>
    </div>
  );
}

/** Small language chips. Hidden when the page has a single language. */
export function LocaleSwitcher({
  locales,
  locale,
  onLocale,
  className,
}: {
  locales: Locale[];
  locale: Locale;
  onLocale: (l: Locale) => void;
  className?: string;
}) {
  if (locales.length < 2) return null;
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto", className)}>
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onLocale(l)}
          aria-pressed={l === locale}
          title={LOCALE_LABELS[l]}
          className="min-h-[32px] min-w-[36px] rounded-[var(--pt-radius)] px-2.5 text-xs font-semibold uppercase transition"
          style={
            l === locale
              ? { background: "var(--pt-brand)", color: "var(--pt-on-brand)" }
              : { background: "var(--pt-chip)", color: "inherit" }
          }
        >
          {l}
        </button>
      ))}
    </div>
  );
}

/**
 * The branded top of every page: optional cover photo, logo, title and
 * tagline, plus the language switch. `fallbackTitle` is shown when the theme
 * has no title of its own (null hides the title entirely).
 */
export function BrandHeader({
  theme,
  fallbackTitle,
  locales,
  locale,
  onLocale,
}: {
  theme?: PageTheme;
  fallbackTitle: string | null;
  locales: Locale[];
  locale: Locale;
  onLocale: (l: Locale) => void;
}) {
  const t = resolveTheme(theme);
  const title = t.showTitle ? pickLocalized(t.title, locale) || fallbackTitle : null;
  const tagline = pickLocalized(t.tagline, locale);
  const centered = t.headerAlign === "center";
  const hasBrand = !!(t.coverUrl || t.logoUrl || title || tagline);
  const switcher = (
    <LocaleSwitcher locales={locales} locale={locale} onLocale={onLocale} />
  );

  if (!hasBrand) {
    return locales.length > 1 ? (
      <div className="flex justify-end px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        {switcher}
      </div>
    ) : (
      <div className="pt-[max(1rem,env(safe-area-inset-top))]" />
    );
  }

  return (
    <header className="relative">
      {t.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.coverUrl} alt="" className="h-48 w-full object-cover" />
      ) : (
        <div className="pt-[max(1.25rem,env(safe-area-inset-top))]" />
      )}

      {locales.length > 1 && (
        <div
          className="absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] rounded-[var(--pt-radius)] p-1"
          style={
            t.coverUrl
              ? { background: "color-mix(in srgb, var(--pt-bg) 80%, transparent)" }
              : undefined
          }
        >
          {switcher}
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 px-5 pb-4",
          centered ? "items-center text-center" : "items-start text-left",
          t.coverUrl ? "pt-0" : locales.length > 1 ? "pt-10" : "pt-2",
        )}
      >
        {t.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={t.logoUrl}
            alt={title ?? ""}
            className={cn(
              "w-auto max-w-[70%] object-contain",
              t.coverUrl && "-mt-10 rounded-[var(--pt-card-radius)] p-2 shadow-lg",
            )}
            style={{
              height: LOGO_HEIGHT[t.logoSize],
              background: t.coverUrl ? "var(--pt-surface)" : undefined,
            }}
          />
        )}
        {title && <h1 className="display text-3xl leading-tight">{title}</h1>}
        {tagline && <p className="max-w-sm text-base opacity-70">{tagline}</p>}
      </div>
    </header>
  );
}

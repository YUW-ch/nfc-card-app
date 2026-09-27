import type { Locale, LocalizedText } from "./types";

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
  it: "Italiano",
};

export const DEFAULT_LOCALE: Locale = "de";

/**
 * Resolve a LocalizedText to a single string for `locale`, falling back to any
 * other available language (so a page never renders blank). Order: requested →
 * default → first non-empty.
 */
export function pickLocalized(
  text: LocalizedText | undefined,
  locale: Locale,
  fallback = "",
): string {
  if (!text) return fallback;
  if (text[locale]) return text[locale]!;
  if (text[DEFAULT_LOCALE]) return text[DEFAULT_LOCALE]!;
  const first = Object.values(text).find((v) => v && v.trim().length > 0);
  return first ?? fallback;
}

/** The locales a LocalizedText actually has content for. */
export function availableLocales(...texts: (LocalizedText | undefined)[]): Locale[] {
  const set = new Set<Locale>();
  for (const t of texts) {
    if (!t) continue;
    for (const [k, v] of Object.entries(t)) {
      if (v && v.trim()) set.add(k as Locale);
    }
  }
  return Array.from(set);
}

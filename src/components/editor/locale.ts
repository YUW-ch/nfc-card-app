// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

// Tiny locale mechanism for the card designer. The designer is a
// self-contained module (shared with nfc-card-app via `pnpm sync:editor`), so
// it carries its own strings instead of reading the host's i18n context.

export const EDITOR_LOCALES = ["EN", "DE", "FR", "IT"] as const;
export type EditorLocale = (typeof EDITOR_LOCALES)[number];

// A localized string: one value per supported language.
export type L = Record<EditorLocale, string>;

// Compact authoring helper: l("English", "Deutsch", "Français", "Italiano").
export function l(EN: string, DE: string, FR: string, IT: string): L {
  return { EN, DE, FR, IT };
}

export type Translate = (v: L | string) => string;

// Resolve a localized value to the given language. Plain strings pass through.
export function makeT(locale: EditorLocale): Translate {
  return (v) => (typeof v === "string" ? v : v[locale]);
}

// Page branding: fonts, built-in designs and the resolver that turns a stored
// PageTheme into CSS variables for the public views.
//
// Shared with the admin console (see `page-content.ts`). Edit here, then run
// `pnpm sync:builders` in nfc-card-admin.

import type { CSSProperties } from "react";
import type { CornerStyle, FontId, LogoSize, PageTheme } from "./page-content";

export const DEFAULT_BRAND = "#2f6df0";
const DEFAULT_BACKGROUND = "#f6f3ec"; // --color-paper

// ─── Fonts ────────────────────────────────────────────────────────────────────

export interface FontOption {
  label: string;
  /** CSS font-family value. */
  css: string;
  /** Bunny Fonts family spec (GDPR-friendly Google Fonts mirror). Absent for the app's own fonts. */
  bunny?: string;
  /** Script and display faces only work as headings. */
  bodyOk: boolean;
  category: "Sans" | "Serif" | "Display" | "Script";
}

export const FONTS: Record<FontId, FontOption> = {
  bricolage: {
    label: "Bricolage Grotesque",
    css: 'var(--font-bricolage), "Bricolage Grotesque", sans-serif',
    bodyOk: false,
    category: "Display",
  },
  hanken: {
    label: "Hanken Grotesk",
    css: 'var(--font-hanken), "Hanken Grotesk", sans-serif',
    bodyOk: true,
    category: "Sans",
  },
  inter: { label: "Inter", css: '"Inter", sans-serif', bunny: "inter:400,600,700", bodyOk: true, category: "Sans" },
  poppins: { label: "Poppins", css: '"Poppins", sans-serif', bunny: "poppins:400,600,700", bodyOk: true, category: "Sans" },
  montserrat: { label: "Montserrat", css: '"Montserrat", sans-serif', bunny: "montserrat:400,600,700", bodyOk: true, category: "Sans" },
  "space-grotesk": { label: "Space Grotesk", css: '"Space Grotesk", sans-serif', bunny: "space-grotesk:400,600,700", bodyOk: true, category: "Sans" },
  josefin: { label: "Josefin Sans", css: '"Josefin Sans", sans-serif', bunny: "josefin-sans:400,600,700", bodyOk: true, category: "Sans" },
  playfair: { label: "Playfair Display", css: '"Playfair Display", serif', bunny: "playfair-display:400,700", bodyOk: false, category: "Serif" },
  lora: { label: "Lora", css: '"Lora", serif', bunny: "lora:400,600,700", bodyOk: true, category: "Serif" },
  cormorant: { label: "Cormorant Garamond", css: '"Cormorant Garamond", serif', bunny: "cormorant-garamond:400,600,700", bodyOk: true, category: "Serif" },
  "dm-serif": { label: "DM Serif Display", css: '"DM Serif Display", serif', bunny: "dm-serif-display:400", bodyOk: false, category: "Serif" },
  oswald: { label: "Oswald", css: '"Oswald", sans-serif', bunny: "oswald:400,600,700", bodyOk: false, category: "Display" },
  pacifico: { label: "Pacifico", css: '"Pacifico", cursive', bunny: "pacifico:400", bodyOk: false, category: "Script" },
  caveat: { label: "Caveat", css: '"Caveat", cursive', bunny: "caveat:400,700", bodyOk: false, category: "Script" },
};

export const FONT_IDS = Object.keys(FONTS) as FontId[];

/** Stylesheet URL for the theme's web fonts, or null when it only uses built-in fonts. */
export function fontStylesheetHref(theme?: PageTheme): string | null {
  const t = resolveTheme(theme);
  const specs = [...new Set([t.headingFont, t.bodyFont])]
    .map((id) => FONTS[id].bunny)
    .filter(Boolean);
  if (specs.length === 0) return null;
  return `https://fonts.bunny.net/css?family=${specs.join("|")}&display=swap`;
}

/** Stylesheet URL that loads every catalogue font (for the font pickers). */
export function allFontsStylesheetHref(): string {
  const specs = FONT_IDS.map((id) => FONTS[id].bunny).filter(Boolean);
  return `https://fonts.bunny.net/css?family=${specs.join("|")}&display=swap`;
}

// ─── Colours ──────────────────────────────────────────────────────────────────

function parseHex(hex?: string): [number, number, number] | null {
  const c = (hex ?? "").trim().replace("#", "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) return null;
  const full = c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

export function isHexColor(value?: string): boolean {
  return parseHex(value) !== null;
}

/** Near-black or white, whichever reads better on `hex`. */
export function readableOn(hex?: string): string {
  const rgb = parseHex(hex ?? DEFAULT_BRAND);
  if (!rgb) return "#ffffff";
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.6 ? "#14120f" : "#ffffff";
}

// ─── Resolution ───────────────────────────────────────────────────────────────

const CORNER_RADIUS: Record<CornerStyle, { control: string; card: string }> = {
  pill: { control: "9999px", card: "1.5rem" },
  rounded: { control: "0.9rem", card: "1rem" },
  square: { control: "0.25rem", card: "0.25rem" },
};

export const LOGO_HEIGHT: Record<LogoSize, string> = { sm: "3rem", md: "4.5rem", lg: "6.5rem" };

export type ResolvedTheme = Required<
  Pick<
    PageTheme,
    | "brandColor"
    | "textColor"
    | "headingFont"
    | "bodyFont"
    | "corners"
    | "logoSize"
    | "headerAlign"
    | "showTitle"
  >
> &
  PageTheme & {
    /** Solid colour behind the page (for contrast), even when `background` is an image. */
    backgroundColor: string;
    onBrand: string;
  };

/** Fill a stored theme's gaps with defaults. Text colour follows the background unless set. */
export function resolveTheme(theme?: PageTheme): ResolvedTheme {
  const t = theme ?? {};
  const backgroundColor = isHexColor(t.background) ? t.background! : DEFAULT_BACKGROUND;
  const brandColor = t.brandColor || DEFAULT_BRAND;
  const headingFont = t.headingFont && FONTS[t.headingFont] ? t.headingFont : "bricolage";
  const bodyFont = t.bodyFont && FONTS[t.bodyFont]?.bodyOk ? t.bodyFont : "hanken";
  return {
    ...t,
    brandColor,
    onBrand: readableOn(brandColor),
    backgroundColor,
    textColor: t.textColor || readableOn(backgroundColor),
    headingFont,
    bodyFont,
    corners: t.corners ?? "pill",
    logoSize: t.logoSize ?? "md",
    headerAlign: t.headerAlign ?? "center",
    showTitle: t.showTitle ?? true,
  };
}

/**
 * CSS variables for a page. The public views only read these, so every theme
 * option applies to every page kind.
 */
export function themeStyle(theme?: PageTheme): CSSProperties {
  const t = resolveTheme(theme);
  const radius = CORNER_RADIUS[t.corners];
  const image = t.background && !isHexColor(t.background) ? t.background : undefined;
  return {
    "--pt-brand": t.brandColor,
    "--pt-on-brand": t.onBrand,
    "--pt-bg": t.backgroundColor,
    "--pt-text": t.textColor,
    "--pt-surface":
      t.surfaceColor || `color-mix(in srgb, ${t.textColor} 5%, ${t.backgroundColor})`,
    "--pt-line": `color-mix(in srgb, ${t.textColor} 12%, transparent)`,
    "--pt-chip": `color-mix(in srgb, ${t.textColor} 7%, transparent)`,
    "--pt-radius": radius.control,
    "--pt-card-radius": radius.card,
    // `.display` headings and body text resolve these.
    "--font-display": FONTS[t.headingFont].css,
    "--font-body": FONTS[t.bodyFont].css,
    fontFamily: FONTS[t.bodyFont].css,
    color: t.textColor,
    // Longhands only: React warns when the `background` shorthand and its parts
    // change between renders.
    backgroundColor: t.backgroundColor,
    backgroundImage: image ? (/^https?:/i.test(image) ? `url("${image}")` : image) : undefined,
    backgroundSize: image ? "cover" : undefined,
    backgroundPosition: image ? "center" : undefined,
  } as CSSProperties;
}

// ─── Designs ──────────────────────────────────────────────────────────────────

/** Theme keys that carry the business's identity rather than the look. */
const IDENTITY_KEYS = ["logoUrl", "coverUrl", "title", "tagline"] as const;

export interface BuiltinDesign {
  id: string;
  name: string;
  theme: PageTheme;
}

/** Starter looks. Applying one keeps the page's logo, cover, title and tagline. */
export const BUILTIN_DESIGNS: BuiltinDesign[] = [
  { id: "taplino", name: "Taplino", theme: {} },
  {
    id: "trattoria",
    name: "Trattoria",
    theme: {
      brandColor: "#b5452b",
      background: "#f7efe3",
      textColor: "#2b1d14",
      surfaceColor: "#fffaf2",
      headingFont: "playfair",
      bodyFont: "lora",
      corners: "rounded",
    },
  },
  {
    id: "bistro-noir",
    name: "Bistro noir",
    theme: {
      brandColor: "#c9a45c",
      background: "#141210",
      textColor: "#f3ede2",
      surfaceColor: "#1f1c19",
      headingFont: "dm-serif",
      bodyFont: "inter",
      corners: "square",
    },
  },
  {
    id: "garden",
    name: "Garden café",
    theme: {
      brandColor: "#4f7a4a",
      background: "#eef2e6",
      textColor: "#1f2a1c",
      surfaceColor: "#ffffff",
      headingFont: "cormorant",
      bodyFont: "josefin",
      corners: "pill",
    },
  },
  {
    id: "street-food",
    name: "Street food",
    theme: {
      brandColor: "#ffcc00",
      background: "#111111",
      textColor: "#ffffff",
      surfaceColor: "#1c1c1c",
      headingFont: "oswald",
      bodyFont: "poppins",
      corners: "square",
    },
  },
  {
    id: "sushi",
    name: "Minimal",
    theme: {
      brandColor: "#d7263d",
      background: "#ffffff",
      textColor: "#111111",
      surfaceColor: "#f5f5f5",
      headingFont: "josefin",
      bodyFont: "inter",
      corners: "rounded",
      headerAlign: "left",
    },
  },
  {
    id: "coffee",
    name: "Coffee house",
    theme: {
      brandColor: "#8a5a44",
      background: "#fbf6f0",
      textColor: "#3b2a20",
      surfaceColor: "#ffffff",
      headingFont: "pacifico",
      bodyFont: "poppins",
      corners: "pill",
    },
  },
];

/** Apply a built-in look: its style replaces the page's, the identity stays. */
export function applyBuiltinDesign(current: PageTheme, design: PageTheme): PageTheme {
  const identity: PageTheme = {};
  for (const key of IDENTITY_KEYS) {
    if (current[key] !== undefined) (identity as Record<string, unknown>)[key] = current[key];
  }
  const { showTitle, logoSize } = current;
  return { ...design, ...identity, showTitle, logoSize };
}

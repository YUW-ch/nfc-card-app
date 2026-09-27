// Page content shapes shared by the panel app and the admin console.
//
// This file, `i18n.ts`, `components/localized-input.tsx` and
// `components/builders/*` are kept identical in both repos. Edit them in
// nfc-card-app, then run `pnpm sync:builders` in nfc-card-admin.

export type Locale = "de" | "en" | "fr" | "it";
export const LOCALES: Locale[] = ["de", "en", "fr", "it"];

/** A localized string used inside page content (menus, link labels, ...). */
export type LocalizedText = Partial<Record<Locale, string>>;

export type PageKind = "REVIEW" | "MENU" | "LINKHUB" | "VCARD" | "WIFI";

export interface PageTheme {
  brandColor?: string;
  background?: string;
  textColor?: string;
  logoUrl?: string;
  cardStyle?: string;
}

// ─── Kind-specific content shapes (stored as JSON on Page.content) ────────────

export interface ReviewContent {
  provider: "google";
  placeId?: string;
  reviewUrl: string;
  threshold?: number; // 1..5; below this, capture feedback internally
  collectNegativeInternally?: boolean;
  feedbackEmail?: string;
}

export interface MenuItem {
  id: string;
  name: LocalizedText;
  description?: LocalizedText;
  priceCents: number;
  allergens?: string[];
  tags?: string[];
  imageUrl?: string;
  available?: boolean;
}

export interface MenuSection {
  id: string;
  name: LocalizedText;
  items: MenuItem[];
}

export interface MenuContent {
  currency: string;
  sections: MenuSection[];
}

export interface LinkHubLink {
  id: string;
  label: LocalizedText;
  url: string;
  icon?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface LinkHubContent {
  headline?: LocalizedText;
  avatarUrl?: string;
  links: LinkHubLink[];
  socials: SocialLink[];
}

export interface VCardContent {
  firstName: string;
  lastName: string;
  org?: string;
  title?: string;
  phones?: { label: string; number: string }[];
  emails?: { label: string; address: string }[];
  website?: string;
  address?: string;
  socials?: SocialLink[];
}

export interface WifiContent {
  ssid: string;
  password?: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export type PageContent =
  | ReviewContent
  | MenuContent
  | LinkHubContent
  | VCardContent
  | WifiContent
  | Record<string, unknown>;

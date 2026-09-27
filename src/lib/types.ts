// Shared types mirroring the backend API shapes.

export type Locale = "de" | "en" | "fr" | "it";
export const LOCALES: Locale[] = ["de", "en", "fr", "it"];

/** A localized string used inside page content (menus, link labels, ...). */
export type LocalizedText = Partial<Record<Locale, string>>;

export type CompanyRole = "OWNER" | "ADMIN" | "MEMBER";
export type CardType = "REVIEW" | "MENU" | "LINKHUB" | "VCARD" | "WIFI";
export type PageKind = CardType;
export type CardStatus = "UNASSIGNED" | "ACTIVE" | "DISABLED";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  brandColor: string;
  role?: CompanyRole;
}

export interface Location {
  id: string;
  name: string;
  companyId: string;
  isDefault: boolean;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country: string;
  timezone: string;
  googlePlaceId?: string | null;
  googleReviewUrl?: string | null;
}

export interface PageSummary {
  id: string;
  name: string;
  kind: PageKind;
  slug: string;
  published: boolean;
  locationId: string | null;
  updatedAt: string;
}

export interface Page extends PageSummary {
  companyId: string;
  theme: PageTheme;
  content: PageContent;
}

export interface Card {
  id: string;
  companyId: string;
  locationId: string | null;
  name: string;
  type: CardType;
  slug: string;
  uid: string | null;
  status: CardStatus;
  design: CardDesign;
  activePageId: string | null;
  activePage?: Pick<PageSummary, "id" | "name" | "kind" | "slug" | "published"> | null;
  location?: { id: string; name: string } | null;
  createdAt: string;
}

export interface CardDesign {
  template?: string;
  logoUrl?: string;
  primaryColor?: string;
  textColor?: string;
  finish?: "matte" | "gloss" | "metal";
}

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

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  totals: { taps: number; byKind: Record<string, number> };
  series: { date: string; taps: number }[];
  topCards: { cardId: string; name: string; taps: number }[];
  analyticsEnabled: boolean;
}

export interface AccessResponse {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    avatarUrl: string | null;
    platformRole: string;
  } | null;
  companies: Company[];
  requiresPasskey: boolean;
  hasPasskey: boolean;
}

export interface PlanFeatures {
  tier: string;
  analytics: boolean;
  multiLocation: boolean;
  maxLocations: number | null;
  unlimitedDestinationChanges: boolean;
  managed: boolean;
}

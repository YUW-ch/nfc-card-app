// Shared types mirroring the backend API shapes.

export * from "./page-content";
import type { PageContent, PageKind, PageTheme } from "./page-content";

export type CompanyRole = "OWNER" | "ADMIN" | "MEMBER";
export type CardType = PageKind;
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
  /** Zone inside the location ("Terrasse", "Saal"), for grouping many cards. */
  area: string | null;
  slug: string;
  uid: string | null;
  status: CardStatus;
  design: CardDesign;
  activePageId: string | null;
  /** Custom link instead of a page (web address, tel:, mailto:, sms:). */
  linkUrl: string | null;
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
  createPages: boolean;
}

export interface BillingResponse {
  subscription: { status?: string; tier?: string } | null;
  features: PlanFeatures;
}

/** An entry in the public plan catalogue (`GET /billing/plans`). */
export interface SubscriptionPlan {
  id: string;
  tier: string;
  name: string;
  priceCents: number;
  interval: string;
  features: Partial<Omit<PlanFeatures, "tier">>;
}

// ─── Shop orders ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "CANCELLED"
  | "EXPIRED";

export interface OrderItem {
  id: string;
  /** Product key, e.g. "business" | "review". */
  productKey: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
}

/** A card order (`GET /companies/:companyId/orders`). Money is in Rappen. */
export interface Order {
  id: string;
  number: string;
  status: OrderStatus;
  email: string;
  customerName: string;
  companyName: string | null;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  items: OrderItem[];
  /** Cards pre-created for this order in the company. */
  cardCount: number;
}

// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

// Shared types + industry presets for the card editor.
import { l, type L } from "./locale";

export type FontStyle = "sans" | "serif" | "rounded" | "display";

// The physical card the customer is ordering. "business" is the premium metal
// card (available in a silver or black finish); "review" is our classic printed
// card for reviews and menus.
export type CardType = "business" | "review";
export type CardFinish = "silver" | "black";

export type CardTypeDef = {
  key: CardType;
  name: L;
  tagline: L;
  material: L;
  price: number; // base CHF per card, before volume discount
  available: boolean; // false → shown for preview but not orderable yet
  aspect: string; // CSS aspect-ratio of the physical card
  previewScale: number; // relative preview size (1 = largest)
  sizeLabel: L; // printed dimensions
  finishes?: CardFinish[]; // metal cards only
};

export const CARD_TYPES: CardTypeDef[] = [
  {
    key: "business",
    name: l("Metal business card", "Metall-Visitenkarte", "Carte de visite métal", "Biglietto da visita in metallo"),
    tagline: l(
      "Premium anodised metal, brushed finish",
      "Hochwertiges eloxiertes Metall, gebürstet",
      "Métal anodisé premium, finition brossée",
      "Metallo anodizzato premium, finitura spazzolata",
    ),
    material: l("Anodised aluminium", "Eloxiertes Aluminium", "Aluminium anodisé", "Alluminio anodizzato"),
    price: 89,
    available: true,
    aspect: "85 / 54", // standard business-card landscape
    previewScale: 0.92,
    sizeLabel: l("85 × 54 mm", "85 × 54 mm", "85 × 54 mm", "85 × 54 mm"),
    finishes: ["silver", "black"],
  },
  {
    key: "review",
    name: l("Review & menu card", "Bewertungs- & Menükarte", "Carte avis & menu", "Carta recensioni & menu"),
    tagline: l(
      "Our classic for Google reviews, menus and more",
      "Unser Klassiker für Google-Bewertungen, Menüs und mehr",
      "Notre classique pour les avis Google, les menus et plus",
      "Il nostro classico per recensioni Google, menu e altro",
    ),
    material: l("PVC", "PVC", "PVC", "PVC"),
    price: 50,
    available: true,
    aspect: "5 / 6", // large portrait review/menu card
    previewScale: 1,
    sizeLabel: l("120 × 120 mm", "120 × 120 mm", "120 × 120 mm", "120 × 120 mm"),
  },
];

// Finish swatches for the metal card. The gradient approximates brushed metal
// and also themes the live preview frame.
export const FINISHES: { key: CardFinish; label: L; swatch: string; ring: string }[] = [
  {
    key: "silver",
    label: l("Silver", "Silber", "Argent", "Argento"),
    swatch: "linear-gradient(135deg,#f2f3f5 0%,#c3c6cd 38%,#e9eaee 55%,#a9adb6 78%,#dfe1e6 100%)",
    ring: "#b9bcc4",
  },
  {
    key: "black",
    label: l("Black", "Schwarz", "Noir", "Nero"),
    swatch: "linear-gradient(135deg,#43444a 0%,#161719 38%,#33343a 55%,#0d0e10 78%,#2a2b31 100%)",
    ring: "#2b2c31",
  },
];

// How the bottom edge of the header band is drawn. "wave" and "scallop" give
// the soft, flowy look of Google's review cards; "round" is a single arch.
export type HeaderShape = "straight" | "wave" | "round" | "scallop";

// What the middle of the card leads with. Not every business has a big logo —
// some are better served by a bold message ("text") or a short menu / service
// list ("list"). "logo" is the classic logo-drop-zone layout.
export type CardLayout = "logo" | "text" | "list";

// The full, serialisable description of a customer's card design.
export type CardConfig = {
  cardType: CardType;
  finish: CardFinish; // only meaningful for the metal business card
  category: string;
  layout: CardLayout;
  headline: string;
  logoText: string;
  logoHint: string;
  logoDataUrl: string | null;
  logoName: string | null;
  // Layout-specific content.
  bodyText: string; // "text" layout — the big message
  listTitle: string; // "list" layout — heading above the items
  listItems: string; // "list" layout — one item per line
  headerColor: string;
  headerTextColor: string;
  bodyColor: string;
  starColor: string;
  accentColor: string;
  font: FontStyle;
  headerShape: HeaderShape;
  showStars: boolean;
  showQr: boolean; // backup QR code for phones without NFC
  reviewUrl: string;
  // Business-card fields (metal card only)
  fullName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  website: string;
};

export type Preset = {
  key: "restaurant" | "electronics" | "fitness" | "beauty";
  name: L;
  category: L;
  layout: CardLayout;
  headerColor: string;
  headerTextColor: string;
  bodyColor: string;
  starColor: string;
  accentColor: string;
  font: FontStyle;
  headerShape: HeaderShape;
  showStars: boolean;
};

// A ready-made example design (restaurant preset, default text) — used both as
// the editor's starting point and as the marketing preview on the home page.
export function exampleCard(): CardConfig {
  const p = PRESETS[0];
  return {
    cardType: "review",
    finish: "silver",
    category: "",
    layout: p.layout,
    headline: "",
    logoText: "",
    logoHint: "",
    logoDataUrl: null,
    logoName: null,
    bodyText: "",
    listTitle: "",
    listItems: "",
    headerColor: p.headerColor,
    headerTextColor: p.headerTextColor,
    bodyColor: p.bodyColor,
    starColor: p.starColor,
    accentColor: p.accentColor,
    font: p.font,
    headerShape: p.headerShape,
    showStars: p.showStars,
    showQr: false,
    reviewUrl: "",
    fullName: "",
    jobTitle: "",
    company: "",
    phone: "",
    email: "",
    website: "",
  };
}

// Industry starting points — mirror the four reference designs. Everything
// stays editable after a preset is applied; picking one only seeds colours,
// font, layout, header edge and a suggested category label.
export const PRESETS: Preset[] = [
  {
    key: "restaurant",
    name: l("Restaurant", "Restaurant", "Restaurant", "Ristorante"),
    category: l("Fast food & restaurant", "Schnellrestaurant", "Restauration rapide", "Ristorazione veloce"),
    layout: "list",
    headerColor: "#2f6df0",
    headerTextColor: "#ffffff",
    bodyColor: "#eaf1fd",
    starColor: "#ffd23f",
    accentColor: "#2f6df0",
    font: "sans",
    headerShape: "wave",
    showStars: true,
  },
  {
    key: "electronics",
    name: l("Electronics", "Elektronik", "Électronique", "Elettronica"),
    category: l("Electronics store", "Elektronikmarkt", "Magasin d'électronique", "Negozio di elettronica"),
    layout: "logo",
    headerColor: "#143a5e",
    headerTextColor: "#ffffff",
    bodyColor: "#ffffff",
    starColor: "#f4c542",
    accentColor: "#143a5e",
    font: "sans",
    headerShape: "straight",
    showStars: true,
  },
  {
    key: "fitness",
    name: l("Fitness & Club", "Fitness & Club", "Fitness & Club", "Fitness & Club"),
    category: l("Fitness & nightlife", "Fitnessstudio & Nightlife", "Fitness & vie nocturne", "Fitness & nightlife"),
    layout: "text",
    headerColor: "#101010",
    headerTextColor: "#ffffff",
    bodyColor: "#fff0f6",
    starColor: "#ff2d78",
    accentColor: "#ff2d78",
    font: "display",
    headerShape: "round",
    showStars: true,
  },
  {
    key: "beauty",
    name: l("Beauty & Salon", "Beauty & Salon", "Beauté & Salon", "Bellezza & Salone"),
    category: l("Hair & beauty salon", "Friseur & Kosmetikstudio", "Coiffure & institut de beauté", "Parrucchiere & centro estetico"),
    layout: "logo",
    headerColor: "#c6a24b",
    headerTextColor: "#ffffff",
    bodyColor: "#fbf4e9",
    starColor: "#c6a24b",
    accentColor: "#b8933f",
    font: "serif",
    headerShape: "scallop",
    showStars: false,
  },
];

// Font stacks for the card. One family drives the whole card so the headline,
// logo label and body all share the same voice.
export const FONT_STACKS: Record<FontStyle, string> = {
  sans: "var(--font-body)",
  serif: '"Iowan Old Style", Georgia, "Times New Roman", serif',
  rounded:
    'ui-rounded, "SF Pro Rounded", "Hiragino Maru Gothic ProN", "Quicksand", var(--font-body)',
  display: "var(--font-display)",
};

// Live price and availability per product, keyed by product key (matches
// `CardType`). Prices in CHF. Missing entries fall back to CARD_TYPES.
export type ProductCatalog = Partial<
  Record<string, { price: number; available: boolean; stock: number | null }>
>;

// Volume pricing: the more cards ordered, the bigger the per-card discount.
// Tiers are checked high-to-low; the first one the quantity clears applies.
export type VolumeTier = { min: number; off: number };

export const DEFAULT_VOLUME_TIERS: VolumeTier[] = [
  { min: 200, off: 0.2 },
  { min: 100, off: 0.15 },
  { min: 50, off: 0.1 },
  { min: 20, off: 0.07 },
  { min: 10, off: 0.05 },
  { min: 5, off: 0.03 },
];

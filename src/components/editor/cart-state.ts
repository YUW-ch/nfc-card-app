// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

// The designer's cart: several card designs (any mix of products) in one
// order, plus saving the whole checkout progress in the browser so a reload or
// an abandoned payment picks up where the customer left off.
import { exampleCard, type CardConfig, type CardType, type VolumeTier } from "./types";

export type CartItem = {
  id: string;
  quantity: number;
  design: CardConfig; // design.cardType is the product key
};

// The API takes at most five lines per order.
export const MAX_CART_ITEMS = 5;

export const DEFAULT_CHECKOUT_KEY = "taplino.checkout";

/** Everything the designer restores after a reload. */
export type SavedCheckout = {
  cart: CartItem[];
  draft: {
    config: CardConfig;
    qty: number;
    /** The cart line the draft is linked to, if it was added already. */
    editingId: string | null;
    step: number;
    preset: string;
  };
  contact: Record<string, string>;
};

type Stored = SavedCheckout & { v: 1 };

export function newCartId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Older saves may predate newer design fields, so fill them from defaults. */
function withDefaults(config: Partial<CardConfig>): CardConfig {
  return { ...exampleCard(), ...config };
}

export function loadCheckout(key: string): SavedCheckout | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Stored>;
    if (data?.v !== 1 || !Array.isArray(data.cart) || !data.draft) return null;
    return {
      cart: data.cart
        .filter((i) => i && typeof i.id === "string" && i.design)
        .slice(0, MAX_CART_ITEMS)
        .map((i) => ({
          id: i.id,
          quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
          design: withDefaults(i.design),
        })),
      draft: {
        config: withDefaults(data.draft.config ?? {}),
        qty: Math.max(1, Math.floor(Number(data.draft.qty) || 1)),
        editingId: typeof data.draft.editingId === "string" ? data.draft.editingId : null,
        step: Math.max(0, Math.floor(Number(data.draft.step) || 0)),
        preset: typeof data.draft.preset === "string" ? data.draft.preset : "",
      },
      contact: data.contact && typeof data.contact === "object" ? data.contact : {},
    };
  } catch {
    return null;
  }
}

const dropLogo = (c: CardConfig): CardConfig => ({ ...c, logoDataUrl: null });

/**
 * Saves the checkout. Logos are the heavy part, so when the browser's storage
 * is full the save is retried without them; the cart then asks for the logo
 * again (the file name stays, see `itemIssues`).
 */
export function saveCheckout(key: string, state: SavedCheckout) {
  const write = (s: SavedCheckout) =>
    window.localStorage.setItem(key, JSON.stringify({ v: 1, ...s } satisfies Stored));
  try {
    write(state);
  } catch {
    try {
      write({
        ...state,
        cart: state.cart.map((i) => ({ ...i, design: dropLogo(i.design) })),
        draft: { ...state.draft, config: dropLogo(state.draft.config) },
      });
    } catch {
      // Storage unavailable (private mode, blocked): the designer still works.
    }
  }
}

/** Forget the saved checkout, e.g. once the order is paid. */
export function clearSavedCheckout(key: string = DEFAULT_CHECKOUT_KEY) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ── What is missing ──────────────────────────────────────────────────

export type ItemIssue =
  | { kind: "unavailable" }
  | { kind: "stock"; left: number }
  | { kind: "logo" } // the logo layout would print the placeholder
  | { kind: "logoLost" } // a logo was chosen but did not survive the save
  | { kind: "name" } // metal business card without a name
  | { kind: "qrLink" }; // backup QR without a link to encode

/** The wizard step where each issue is fixed. */
export const ISSUE_STEP: Record<ItemIssue["kind"], number> = {
  unavailable: 0,
  stock: 4,
  logo: 2,
  logoLost: 2,
  name: 3,
  qrLink: 3,
};

export function itemIssues(
  item: CartItem,
  opts: { available: boolean; stockLeft: number | null; productTotal: number },
): ItemIssue[] {
  const d = item.design;
  const issues: ItemIssue[] = [];
  const business = d.cardType === "business";
  if (!opts.available) issues.push({ kind: "unavailable" });
  if (opts.stockLeft != null && opts.productTotal > opts.stockLeft) {
    issues.push({ kind: "stock", left: opts.stockLeft });
  }
  if (!d.logoDataUrl && d.logoName) issues.push({ kind: "logoLost" });
  else if (!business && d.layout === "logo" && !d.logoDataUrl) issues.push({ kind: "logo" });
  if (business && !d.fullName.trim()) issues.push({ kind: "name" });
  if (!business && d.showQr && !d.reviewUrl.trim()) issues.push({ kind: "qrLink" });
  return issues;
}

/** Total quantity per product across the cart (stock is per product). */
export function productTotals(cart: CartItem[]): Partial<Record<CardType, number>> {
  const totals: Partial<Record<CardType, number>> = {};
  for (const i of cart) totals[i.design.cardType] = (totals[i.design.cardType] ?? 0) + i.quantity;
  return totals;
}

// ── Pricing ──────────────────────────────────────────────────────────

/**
 * Client-side estimate that mirrors the server: the volume discount follows
 * `tierQuantity`, the cart's total for the line's card type, and the unit
 * price is rounded to whole Rappen.
 */
export function priceLine(
  basePrice: number,
  quantity: number,
  tiers: VolumeTier[],
  tierQuantity: number = quantity,
) {
  const off = tiers.find((t) => tierQuantity >= t.min)?.off ?? 0;
  const baseCents = Math.round(basePrice * 100);
  const unitCents = Math.round(baseCents * (1 - off));
  return {
    off,
    unit: unitCents / 100,
    gross: (quantity * baseCents) / 100,
    total: (quantity * unitCents) / 100,
  };
}

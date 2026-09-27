// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

// Checkout contract between the designer and its host page. The designer
// collects design, quantity, contact and shipping details and hands a payload
// to the host's `onCheckout`, which creates the order and returns the payment
// (Stripe Checkout) URL. Hosts throw `CheckoutError` to signal known failures.
import type { CardConfig } from "./types";
import type { EditorLocale } from "./locale";

export type ShippingAddress = {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2, e.g. "CH". */
  country: string;
};

export type CheckoutItem = {
  productKey: string;
  quantity: number;
  design: CardConfig;
};

export type CheckoutPayload = {
  /** Omitted when the host does not ask for it (e.g. logged-in app users). */
  email?: string;
  customerName: string;
  phone?: string;
  companyName?: string;
  shippingAddress: ShippingAddress;
  locale: "de" | "en" | "fr" | "it";
  items: CheckoutItem[];
};

export type CheckoutResult = { checkoutUrl: string };

/** Prefill values for the checkout form. */
export type CheckoutPrefill = Partial<{
  email: string;
  customerName: string;
  phone: string;
  companyName: string;
  shippingAddress: Partial<ShippingAddress>;
}>;

/**
 * Thrown by a host's `onCheckout`. `stock` = not enough stock / product not
 * available (HTTP 409); `invalid` = validation failed (HTTP 400).
 */
export class CheckoutError extends Error {
  constructor(
    public kind: "stock" | "invalid" | "generic",
    message?: string,
  ) {
    super(message ?? kind);
    this.name = "CheckoutError";
  }
}

/** Raised by the logo helpers with a user-facing reason. */
export class LogoError extends Error {
  constructor(public kind: "tooLarge" | "rasterTooLarge" | "unreadable") {
    super(kind);
    this.name = "LogoError";
  }
}

export function toLocaleSlug(locale: EditorLocale): CheckoutPayload["locale"] {
  return locale.toLowerCase() as CheckoutPayload["locale"];
}

// ── Logo size limits ─────────────────────────────────────────────────
// The design (logo included, as a data URL) travels in the JSON body, which
// the API caps at roughly 600 KB. Raster logos are downscaled; SVGs are kept
// as vectors but must stay small.
export const SVG_MAX_BYTES = 300 * 1024;
const RASTER_MAX_SIDE = 800;
const RASTER_TARGET_BYTES = 380 * 1024;

/** Approximate decoded byte size of a base64 data URL. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const body = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return /;base64,/.test(dataUrl.slice(0, comma + 1)) ? Math.floor((body.length * 3) / 4) : body.length;
}

function mimeOf(dataUrl: string): string {
  return dataUrl.slice(5, dataUrl.indexOf(";")).toLowerCase();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new LogoError("unreadable"));
    img.src = src;
  });
}

/**
 * Makes a logo data URL fit the order body: SVG passes through (rejected when
 * larger than 300 KB), PNG/JPEG/WebP are scaled down to at most 800 px on the
 * long side and re-encoded until they are comfortably small.
 */
export async function prepareLogo(dataUrl: string | null): Promise<string | null> {
  if (!dataUrl) return null;
  const mime = mimeOf(dataUrl);
  if (mime === "image/svg+xml") {
    if (dataUrlBytes(dataUrl) > SVG_MAX_BYTES) throw new LogoError("tooLarge");
    return dataUrl;
  }

  const img = await loadImage(dataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) throw new LogoError("unreadable");
  if (Math.max(w, h) <= RASTER_MAX_SIDE && dataUrlBytes(dataUrl) <= RASTER_TARGET_BYTES) {
    return dataUrl;
  }

  // JPEGs have no transparency, so they stay JPEG. PNG and WebP may, so they
  // are encoded as PNG first and fall back to WebP when that is too heavy.
  const formats: [string, number | undefined][] =
    mime === "image/jpeg" ? [["image/jpeg", 0.88]] : [["image/png", undefined], ["image/webp", 0.9]];

  let side = RASTER_MAX_SIDE;
  let best: string | null = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const scale = Math.min(1, side / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new LogoError("unreadable");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const [type, quality] of formats) {
      const out = canvas.toDataURL(type, quality);
      // Browsers without WebP encoding silently return PNG; that is fine.
      if (!best || out.length < best.length) best = out;
      if (dataUrlBytes(out) <= RASTER_TARGET_BYTES) return out;
    }
    side = Math.round(side * 0.75);
  }
  if (best && dataUrlBytes(best) <= RASTER_TARGET_BYTES * 1.3) return best;
  throw new LogoError("rasterTooLarge");
}

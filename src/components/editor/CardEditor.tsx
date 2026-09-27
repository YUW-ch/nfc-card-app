"use client";

// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

// The Taplino card designer: a step-by-step editor with a live preview, volume
// pricing and a checkout step. Self-contained on purpose (only react,
// next/image and files in this folder), so nfc-card-app can reuse it verbatim
// via `pnpm sync:editor`. The host page supplies prices (`catalog`,
// `volumeTiers`) and creates the order in `onCheckout`.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CardPreview } from "./CardPreview";
import { CartLines, CartSummary, type CartLine } from "./CartView";
import {
  DEFAULT_CHECKOUT_KEY,
  MAX_CART_ITEMS,
  itemIssues,
  loadCheckout,
  newCartId,
  priceLine,
  productTotals,
  saveCheckout,
  type CartItem,
} from "./cart-state";
import { Button, Arrow } from "./Button";
import { s } from "./strings";
import { makeT, type EditorLocale } from "./locale";
import {
  CheckoutError,
  LogoError,
  SVG_MAX_BYTES,
  prepareLogo,
  toLocaleSlug,
  type CheckoutPayload,
  type CheckoutPrefill,
  type CheckoutResult,
} from "./checkout";
import {
  CARD_TYPES,
  DEFAULT_VOLUME_TIERS,
  FINISHES,
  LOGO_SCALE,
  PRESETS,
  exampleCard,
  type CardConfig,
  type CardLayout,
  type CardType,
  type FontStyle,
  type HeaderShape,
  type Preset,
  type ProductCatalog,
  type VolumeTier,
} from "./types";

// The API accepts 1..1000 cards per line item.
const MAX_QTY = 1000;

const chf = (n: number) =>
  n.toLocaleString("de-CH", { maximumFractionDigits: 2 });

function initialConfig(): CardConfig {
  return exampleCard();
}

// Wizard steps. Each step reveals a slice of the design controls; the live
// preview and order box stay pinned in the sidebar throughout. The last step
// is the cart with contact and shipping details before payment.
const STEPS = [s.stepCard, s.stepTemplate, s.stepDesign, s.stepContent, s.stepCheckout];
const LAST_STEP = STEPS.length - 1;
const CONTENT_STEP = LAST_STEP - 1;
const DEFAULT_QTY = 50;
const FRESH_CONFIG = JSON.stringify(exampleCard());

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-7 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-paper">
          {n}
        </span>
        <h2 className="display text-lg">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-accent">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink aria-[invalid=true]:border-accent";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-paper p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-8 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <input
          type="text"
          value={value.toUpperCase()}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm font-medium text-ink outline-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
}

const textareaCls =
  "w-full resize-y rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-ink";

// A segmented button group for a small set of mutually-exclusive options.
function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-line p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              value === o.value ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// A labelled on/off switch.
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-line bg-paper px-3.5 py-3 text-left transition-colors hover:border-ink/40"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted">{hint}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-ink" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// Tiny wireframe of each layout for the layout picker buttons.
function LayoutGlyph({ kind, active }: { kind: CardLayout; active: boolean }) {
  const stroke = active ? "#14120f" : "#9c968a";
  return (
    <svg width="100%" height="34" viewBox="0 0 60 34" fill="none" aria-hidden className="rounded-md bg-paper-2/60">
      <rect x="8" y="4" width="44" height="7" rx="2" fill={stroke} opacity="0.5" />
      {kind === "logo" && (
        <rect x="21" y="16" width="18" height="14" rx="3" stroke={stroke} strokeWidth="1.6" strokeDasharray="3 2" />
      )}
      {kind === "text" && (
        <>
          <rect x="14" y="18" width="32" height="3" rx="1.5" fill={stroke} />
          <rect x="18" y="24" width="24" height="3" rx="1.5" fill={stroke} />
        </>
      )}
      {kind === "list" && (
        <>
          {[16, 22, 28].map((y) => (
            <g key={y}>
              <circle cx="16" cy={y + 1.5} r="1.3" fill={stroke} />
              <rect x="21" y={y} width="26" height="3" rx="1.5" fill={stroke} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

type ContactDraft = {
  email: string;
  customerName: string;
  phone: string;
  companyName: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
  country: string;
};

// Countries we ship to. The API takes ISO 3166-1 alpha-2 codes.
const COUNTRIES = [
  { code: "CH", label: s.countryCH },
  { code: "LI", label: s.countryLI },
];

function draftFrom(prefill: CheckoutPrefill | undefined): ContactDraft {
  const a = prefill?.shippingAddress ?? {};
  return {
    email: prefill?.email ?? "",
    customerName: prefill?.customerName ?? "",
    phone: prefill?.phone ?? "",
    companyName: prefill?.companyName ?? "",
    line1: a.line1 ?? "",
    line2: a.line2 ?? "",
    postalCode: a.postalCode ?? "",
    city: a.city ?? "",
    country: a.country ?? "CH",
  };
}

type FieldError = "required" | "email";

function validateContact(d: ContactDraft, askEmail: boolean) {
  const errors: Partial<Record<keyof ContactDraft, FieldError>> = {};
  if (askEmail) {
    if (!d.email.trim()) errors.email = "required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email.trim())) errors.email = "email";
  }
  for (const key of ["customerName", "line1", "postalCode", "city", "country"] as const) {
    if (!d[key].trim()) errors[key] = "required";
  }
  return errors;
}

type OrderError =
  | "generic"
  | "stock"
  | "invalid"
  | "fields"
  | "cartIssues"
  | "cartFull"
  | "logoTooLarge"
  | "logoRasterTooLarge"
  | "logoUnreadable";

const ORDER_ERROR_TEXT: Record<OrderError, (typeof s)[keyof typeof s]> = {
  generic: s.orderError,
  stock: s.orderStockError,
  invalid: s.orderInvalidError,
  fields: s.coFixFields,
  cartIssues: s.cartIssuesError,
  cartFull: s.cartFull,
  logoTooLarge: s.logoTooLarge,
  logoRasterTooLarge: s.logoRasterTooLarge,
  logoUnreadable: s.logoUnreadable,
};

// Maps whatever the host's onCheckout threw to a message. Duck-typed as well,
// in case the host bundles its own copy of CheckoutError.
function errorKind(err: unknown): OrderError {
  const kind =
    err instanceof CheckoutError || err instanceof LogoError
      ? err.kind
      : (err as { kind?: unknown } | null)?.kind;
  switch (kind) {
    case "stock":
      return "stock";
    case "invalid":
      return "invalid";
    case "tooLarge":
      return "logoTooLarge";
    case "rasterTooLarge":
      return "logoRasterTooLarge";
    case "unreadable":
      return "logoUnreadable";
    default:
      return "generic";
  }
}

export type CardEditorProps = {
  /** Called with the finished order; returns the payment page URL. */
  onCheckout: (payload: CheckoutPayload) => Promise<CheckoutResult>;
  /** UI language. Also sent as the order locale. */
  locale?: EditorLocale;
  /** Live prices and stock; missing products fall back to CARD_TYPES. */
  catalog?: ProductCatalog;
  /** Volume discount tiers; defaults to DEFAULT_VOLUME_TIERS. */
  volumeTiers?: VolumeTier[];
  /** Prefill for the checkout form (applied to empty fields, also later). */
  prefill?: CheckoutPrefill;
  /** Ask for an email address (false when the host knows the user). */
  askEmail?: boolean;
  /** Show a notice above the steps, e.g. after an abandoned payment. */
  notice?: "cancelled" | null;
  /**
   * "page": full-width marketing page (two columns from lg, section padding).
   * "panel": inside an app shell with a sidebar (two columns from xl).
   */
  layout?: "page" | "panel";
  /** Extra classes for the outer grid; defaults to section padding on "page". */
  className?: string;
  /**
   * localStorage key for the saved cart and checkout progress. Hosts clear it
   * with `clearSavedCheckout` once the order is paid.
   */
  storageKey?: string;
};

// Tailwind needs literal class names, so both layouts are spelled out.
const LAYOUTS = {
  page: {
    outer: "section-pad",
    grid: "lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]",
    controls: "order-2 scroll-mt-28 lg:order-1",
    side: "order-1 lg:order-2",
    sticky: "lg:sticky lg:top-28",
  },
  panel: {
    outer: "",
    grid: "xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]",
    controls: "order-2 scroll-mt-24 xl:order-1",
    side: "order-1 xl:order-2",
    sticky: "xl:sticky xl:top-24",
  },
} as const;

export function CardEditor({
  onCheckout,
  locale = "DE",
  catalog = {},
  volumeTiers,
  prefill,
  askEmail = true,
  notice = null,
  layout = "page",
  className,
  storageKey = DEFAULT_CHECKOUT_KEY,
}: CardEditorProps) {
  const t = makeT(locale);
  const ui = LAYOUTS[layout];
  const [config, setConfig] = useState<CardConfig>(initialConfig);
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].key);
  const [rawQty, setQty] = useState(DEFAULT_QTY);
  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<OrderError | null>(null);
  const [logoError, setLogoError] = useState<OrderError | null>(null);
  const [showNotice, setShowNotice] = useState(true);
  const [edits, setEdits] = useState<Partial<ContactDraft>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  // The cart line the current design belongs to. Once a design is in the cart
  // every change to it updates that line; null means it is not added yet.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  // Prefill can arrive after mount (e.g. once the host's session loads), so the
  // form shows the prefill for every field the customer has not edited yet.
  const contact: ContactDraft = { ...draftFrom(prefill), ...edits };

  // Coming back from the payment page via the browser's back button restores
  // this page from the bfcache with the button still in its busy state.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) setPlacing(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  // Restore the saved cart and checkout progress once, after hydration (the
  // server render cannot see localStorage).
  useEffect(() => {
    const saved = loadCheckout(storageKey);
    /* eslint-disable react-hooks/set-state-in-effect -- one-off restore after hydration */
    if (saved) {
      const linked = saved.cart.some((i) => i.id === saved.draft.editingId);
      setCart(saved.cart);
      setConfig(saved.draft.config);
      setQty(saved.draft.qty);
      setEditingId(linked ? saved.draft.editingId : null);
      setStep(Math.min(saved.draft.step, LAST_STEP));
      if (PRESETS.some((p) => p.key === saved.draft.preset)) setActivePreset(saved.draft.preset);
      setEdits(saved.contact as Partial<ContactDraft>);
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey]);

  const tiers = [...(volumeTiers?.length ? volumeTiers : DEFAULT_VOLUME_TIERS)].sort(
    (a, b) => b.min - a.min,
  );

  // Live price and availability from the backend override the built-in defaults.
  const cardTypes = CARD_TYPES.map((c) => {
    const live = catalog[c.key];
    return live ? { ...c, price: live.price, available: c.available && live.available } : c;
  });
  const activeType = cardTypes.find((c) => c.key === config.cardType) ?? cardTypes[1];
  // Units left to order. null = unlimited or unknown.
  const maxQty = catalog[activeType.key]?.stock ?? null;
  const cap = maxQty != null && maxQty > 0 ? Math.min(maxQty, MAX_QTY) : MAX_QTY;
  const qty = Math.min(rawQty, cap);
  const isBusiness = config.cardType === "business";
  const basePrice = activeType.price;

  const lastStep = LAST_STEP;

  // The cart as it stands, with the design being edited folded into its line.
  const cartView: CartItem[] = editingId
    ? cart.map((i) => (i.id === editingId ? { ...i, quantity: qty, design: config } : i))
    : cart;
  const canAdd = cartView.length < MAX_CART_ITEMS;
  const draftInCart = editingId !== null;
  const draftIsFresh = !draftInCart && JSON.stringify(config) === FRESH_CONFIG;

  // Save progress (debounced, logos make the payload heavy).
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      const items = editingId
        ? cart.map((i) => (i.id === editingId ? { ...i, quantity: rawQty, design: config } : i))
        : cart;
      saveCheckout(storageKey, {
        cart: items,
        draft: { config, qty: rawQty, editingId, step, preset: activePreset },
        contact: edits as Record<string, string>,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [hydrated, storageKey, cart, editingId, config, rawQty, step, activePreset, edits]);

  const typeOf = (key: CardType) => cardTypes.find((c) => c.key === key) ?? cardTypes[1];
  const totals = productTotals(cartView);
  const lines: CartLine[] = cartView.map((item) => {
    const type = typeOf(item.design.cardType);
    const stock = catalog[type.key]?.stock ?? null;
    return {
      item,
      name: t(type.name),
      basePrice: type.price,
      price: priceLine(type.price, item.quantity, tiers, totals[type.key] ?? item.quantity),
      issues: itemIssues(item, {
        available: type.available,
        stockLeft: stock,
        productTotal: totals[type.key] ?? item.quantity,
      }),
      maxQty: stock != null && stock > 0 ? Math.min(stock, MAX_QTY) : MAX_QTY,
      editing: item.id === editingId && step < lastStep,
    };
  });
  const linesWithIssues = lines.filter((l) => l.issues.length > 0).length;

  const set = <K extends keyof CardConfig>(key: K, val: CardConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: val }));

  const setField = (key: keyof ContactDraft, val: string) =>
    setEdits((d) => ({ ...d, [key]: val }));

  const applyPreset = (p: Preset) => {
    setActivePreset(p.key);
    setConfig((c) => ({
      ...c,
      headerColor: p.headerColor,
      headerTextColor: p.headerTextColor,
      bodyColor: p.bodyColor,
      starColor: p.starColor,
      accentColor: p.accentColor,
      font: p.font,
      layout: p.layout,
      headerShape: p.headerShape,
      showStars: p.showStars,
      // Only seed the category if the customer hasn't typed their own.
      category: c.category || t(p.category),
    }));
  };

  const presetLabel: Record<Preset["key"], string> = {
    restaurant: t(s.presetRestaurant),
    electronics: t(s.presetElectronics),
    fitness: t(s.presetFitness),
    beauty: t(s.presetBeauty),
  };

  const onLogo = (file: File | undefined) => {
    if (!file) return;
    setLogoError(null);
    if (file.type === "image/svg+xml" && file.size > SVG_MAX_BYTES) {
      setLogoError("logoTooLarge");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const reader = new FileReader();
    // Shrink the logo right away: it is saved with the cart in the browser and
    // sent with the order, both of which have size limits.
    reader.onload = async () => {
      try {
        const logo = await prepareLogo(reader.result as string);
        set("logoDataUrl", logo);
        set("logoName", file.name);
      } catch (err) {
        setLogoError(errorKind(err));
        if (fileRef.current) fileRef.current.value = "";
      }
    };
    reader.onerror = () => setLogoError("logoUnreadable");
    reader.readAsDataURL(file);
  };

  const scrollToControls = () =>
    controlsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const loadDraft = (design: CardConfig, quantity: number, id: string | null) => {
    setConfig(design);
    setQty(quantity);
    setEditingId(id);
    setLogoError(null);
    setOrderError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  // Resets the current design. If it is already in the cart, that line follows.
  const reset = () => {
    loadDraft(initialConfig(), DEFAULT_QTY, editingId);
    setActivePreset(PRESETS[0].key);
    setStep(0);
  };

  const addToCart = () => {
    if (!draftInCart) {
      if (!canAdd) {
        setOrderError("cartFull");
        return;
      }
      const id = newCartId();
      setCart([...cart, { id, quantity: qty, design: config }]);
      setEditingId(id);
    }
    setOrderError(null);
    setStep(lastStep);
    scrollToControls();
  };

  const designAnother = () => {
    if (!canAdd) {
      setOrderError("cartFull");
      return;
    }
    setCart(cartView);
    loadDraft(initialConfig(), DEFAULT_QTY, null);
    setActivePreset(PRESETS[0].key);
    setStep(0);
    scrollToControls();
  };

  const editItem = (id: string, toStep = 0) => {
    const item = cartView.find((i) => i.id === id);
    if (!item) return;
    setCart(cartView);
    loadDraft(item.design, item.quantity, id);
    setStep(Math.min(toStep, CONTENT_STEP));
    scrollToControls();
  };

  const duplicateItem = (id: string) => {
    const item = cartView.find((i) => i.id === id);
    if (!item || !canAdd) return;
    const at = cartView.indexOf(item) + 1;
    setCart([...cartView.slice(0, at), { ...item, id: newCartId() }, ...cartView.slice(at)]);
  };

  const removeItem = (id: string) => {
    setCart(cartView.filter((i) => i.id !== id));
    if (id === editingId) {
      loadDraft(initialConfig(), DEFAULT_QTY, null);
      setActivePreset(PRESETS[0].key);
    }
  };

  const setItemQty = (id: string, quantity: number) => {
    if (id === editingId) setQty(quantity);
    else setCart(cart.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  // Estimate for the design being edited; the server's pricing is authoritative.
  // Discounts count every card of this type in the order, so the draft is
  // priced as if it were in the cart (it already is once added).
  const tierQty = draftInCart
    ? (totals[activeType.key] ?? qty)
    : qty + (totals[activeType.key] ?? 0);
  const tier = tiers.find((tt) => tierQty >= tt.min);
  const draftPrice = priceLine(basePrice, qty, tiers, tierQty);
  const off = draftPrice.off;
  const unit = draftPrice.unit;
  const subtotalNum = draftPrice.gross;
  const savingsNum = draftPrice.gross - draftPrice.total;
  const total = chf(draftPrice.total);
  const cartTotal = lines.reduce((sum, l) => sum + l.price.total, 0);

  const fieldErrors = showErrors ? validateContact(contact, askEmail) : {};
  const fieldErrorText = (key: keyof ContactDraft) => {
    const e = fieldErrors[key];
    return e ? t(e === "email" ? s.coInvalidEmail : s.coRequired) : undefined;
  };

  const goToCheckout = () => {
    setStep(lastStep);
    scrollToControls();
  };

  // Everything that still blocks the payment, for the summary checklist.
  const contactErrors = validateContact(contact, askEmail);
  const missing: string[] = [];
  if (linesWithIssues > 0) missing.push(t(s.missingItems).replace("{n}", String(linesWithIssues)));
  if (contactErrors.email || contactErrors.customerName) missing.push(t(s.missingContact));
  if (contactErrors.line1 || contactErrors.postalCode || contactErrors.city || contactErrors.country) {
    missing.push(t(s.missingShipping));
  }

  const checkout = async () => {
    if (placing || cartView.length === 0) return;
    if (linesWithIssues > 0 || Object.keys(contactErrors).length > 0) {
      setShowErrors(true);
      setOrderError(linesWithIssues > 0 ? "cartIssues" : "fields");
      if (step !== lastStep) goToCheckout();
      return;
    }

    setPlacing(true);
    setOrderError(null);
    try {
      const items = await Promise.all(
        cartView.map(async (i) => ({
          productKey: i.design.cardType,
          quantity: i.quantity,
          design: { ...i.design, logoDataUrl: await prepareLogo(i.design.logoDataUrl) },
        })),
      );
      const trim = (v: string) => v.trim() || undefined;
      const payload: CheckoutPayload = {
        ...(askEmail ? { email: contact.email.trim() } : {}),
        customerName: contact.customerName.trim(),
        phone: trim(contact.phone),
        companyName: trim(contact.companyName),
        shippingAddress: {
          line1: contact.line1.trim(),
          line2: trim(contact.line2),
          postalCode: contact.postalCode.trim(),
          city: contact.city.trim(),
          country: contact.country,
        },
        locale: toLocaleSlug(locale),
        items,
      };
      const { checkoutUrl } = await onCheckout(payload);
      // Stay in the busy state while the browser leaves for the payment page.
      window.location.assign(checkoutUrl);
    } catch (err) {
      setOrderError(errorKind(err));
      setPlacing(false);
    }
  };

  const orderErrorText = orderError ? t(ORDER_ERROR_TEXT[orderError]) : null;
  const busyLabel = t(s.redirecting);

  return (
    <div className={`${className ?? ui.outer} grid gap-12 ${ui.grid}`}>
      {/* ── Controls ─────────────────────────────────────────────── */}
      <div ref={controlsRef} className={ui.controls}>
        {notice === "cancelled" && showNotice && (
          <div
            role="status"
            className="mb-8 flex items-start justify-between gap-4 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink"
          >
            <span>{t(s.cancelledNotice)}</span>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              aria-label="×"
              className="shrink-0 text-lg leading-none text-muted transition-colors hover:text-ink"
            >
              ×
            </button>
          </div>
        )}

        {/* Wizard progress */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t(s.stepWord)} {step + 1}/{STEPS.length}
            </span>
            <span className="text-xs font-semibold text-ink">{t(STEPS[step])}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                aria-label={t(s)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-accent" : "bg-line"
                } ${i < step ? "cursor-pointer" : "cursor-default"}`}
              />
            ))}
          </div>
        </div>

        {/* Step 1 — card type */}
        {step === 0 && (
          <Section n={1} title={t(s.stepCard)}>
            <p className="mb-4 text-sm text-muted">{t(s.cardTypeHint)}</p>
            <div className="space-y-3">
              {cardTypes.map((c) => {
                const active = config.cardType === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => set("cardType", c.key as CardType)}
                    className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-all ${
                      active ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-ink/40"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                        {t(c.name)}
                        {!c.available && (
                          <span className="rounded-full border border-line bg-paper px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-muted">
                            {t(s.notAvailable)}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">{t(c.tagline)}</span>
                      <span className="mt-1 block text-xs font-medium text-muted">{t(c.material)}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[0.7rem] text-muted">{t(s.from)}</span>
                      <span className="display text-xl text-ink">CHF {c.price}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Finish picker — metal card only */}
            {activeType.finishes && (
              <div className="mt-5">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                  {t(s.finishLabel)}
                </span>
                <div className="flex gap-2">
                  {FINISHES.filter((f) => activeType.finishes!.includes(f.key)).map((f) => {
                    const active = config.finish === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => set("finish", f.key)}
                        className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-all ${
                          active ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-ink/40"
                        }`}
                      >
                        <span
                          className="h-6 w-6 rounded-full border border-black/10"
                          style={{ background: f.swatch }}
                        />
                        <span className="text-sm font-semibold text-ink">{t(f.label)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Step 2 — template */}
        {step === 1 && (
        <Section n={1} title={t(s.stepTemplate)}>
          <p className="mb-4 text-sm text-muted">{t(s.templateHint)}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {PRESETS.map((p) => {
              const active = activePreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`group rounded-2xl border p-2 text-left transition-all ${
                    active
                      ? "border-ink ring-2 ring-ink/10"
                      : "border-line hover:border-ink/40"
                  }`}
                >
                  <div
                    className="mb-2 flex aspect-[5/4] items-center justify-center rounded-xl"
                    style={{ backgroundColor: p.bodyColor }}
                  >
                    <div
                      className="flex h-full w-full flex-col items-center justify-center rounded-xl"
                      style={{ backgroundColor: p.headerColor }}
                    >
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: p.starColor }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="block truncate text-xs font-semibold text-ink">
                    {presetLabel[p.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>
        )}

        {/* Step 3 — design: layout, style, logo & colours */}
        {step === 2 && (
        <>
        <Section n={1} title={t(s.stepStyle)}>
          <p className="mb-4 text-sm text-muted">{t(s.styleHint)}</p>

          {/* Layout picker — review/menu cards only */}
          {!isBusiness && (
          <>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
            {t(s.layoutLabel)}
          </span>
          <div className="mb-6 grid grid-cols-3 gap-2">
            {(
              [
                { key: "logo", label: t(s.layoutLogo), hint: t(s.layoutLogoHint) },
                { key: "text", label: t(s.layoutText), hint: t(s.layoutTextHint) },
                { key: "list", label: t(s.layoutList), hint: t(s.layoutListHint) },
              ] as { key: CardLayout; label: string; hint: string }[]
            ).map((o) => {
              const active = config.layout === o.key;
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => set("layout", o.key)}
                  className={`rounded-2xl border p-3 text-left transition-all ${
                    active ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-ink/40"
                  }`}
                >
                  <LayoutGlyph kind={o.key} active={active} />
                  <span className="mt-2 block text-sm font-semibold text-ink">{o.label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted">{o.hint}</span>
                </button>
              );
            })}
          </div>
          </>
          )}

          <div className="flex flex-wrap gap-x-8 gap-y-5">
            <Segmented<FontStyle>
              label={t(s.fontStyle)}
              value={config.font}
              onChange={(v) => set("font", v)}
              options={[
                { value: "sans", label: t(s.fontSans) },
                { value: "serif", label: t(s.fontSerif) },
                { value: "rounded", label: t(s.fontRounded) },
                { value: "display", label: t(s.fontDisplay) },
              ]}
            />
            {!isBusiness && (
            <Segmented<HeaderShape>
              label={t(s.headerEdge)}
              value={config.headerShape}
              onChange={(v) => set("headerShape", v)}
              options={[
                { value: "straight", label: t(s.edgeStraight) },
                { value: "wave", label: t(s.edgeWave) },
                { value: "round", label: t(s.edgeRound) },
                { value: "scallop", label: t(s.edgeScallop) },
              ]}
            />
            )}
          </div>

          {!isBusiness && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Toggle
              label={t(s.showStars)}
              hint={t(s.showStarsHint)}
              checked={config.showStars}
              onChange={(v) => set("showStars", v)}
            />
            <Toggle
              label={t(s.showQr)}
              hint={t(s.showQrHint)}
              checked={config.showQr}
              onChange={(v) => set("showQr", v)}
            />
            <Toggle
              label={t(s.showGoogle)}
              hint={t(s.showGoogleHint)}
              checked={config.showGoogle}
              onChange={(v) => set("showGoogle", v)}
            />
            <Toggle
              label={t(s.showTapZone)}
              hint={t(s.showTapZoneHint)}
              checked={config.showTapZone}
              onChange={(v) => set("showTapZone", v)}
            />
          </div>
          )}
        </Section>

        {/* 3. Logo */}
        <Section n={2} title={t(s.stepLogo)}>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => onLogo(e.target.files?.[0])}
          />
          {config.logoDataUrl ? (
            <div className="flex items-center gap-4 rounded-2xl border border-line bg-paper-2/50 p-3">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.logoDataUrl} alt="logo" className="max-h-12 max-w-12 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{config.logoName}</p>
                <div className="mt-1.5 flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="font-semibold text-ink link-underline"
                  >
                    {t(s.replaceLogo)}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      set("logoDataUrl", null);
                      set("logoName", null);
                      setLogoError(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    className="font-semibold text-muted hover:text-accent"
                  >
                    {t(s.removeLogo)}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper-2/40 px-6 py-8 text-center transition-colors hover:border-ink/40"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 16V4m0 0L7 9m5-5l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-ink" />
                <path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-muted" />
              </svg>
              <span className="text-sm font-semibold text-ink">{t(s.uploadLogo)}</span>
              <span className="text-xs text-muted">{t(s.uploadHint)}</span>
            </button>
          )}
          {config.logoDataUrl && (
            <label className="mt-4 block">
              <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">
                {t(s.logoSize)}
                <span className="tabular-nums text-ink">{Math.round(config.logoScale * 100)}%</span>
              </span>
              <input
                type="range"
                min={LOGO_SCALE.min}
                max={LOGO_SCALE.max}
                step={LOGO_SCALE.step}
                value={config.logoScale}
                onChange={(e) => set("logoScale", Number(e.target.value))}
                className="mt-2 w-full accent-ink"
              />
            </label>
          )}
          {logoError && (
            <p className="mt-3 text-sm font-medium text-accent">{t(ORDER_ERROR_TEXT[logoError])}</p>
          )}
        </Section>

        {/* 4. Colours */}
        <Section n={3} title={t(s.stepColors)}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {!isBusiness && (
              <>
                <ColorField label={t(s.colorHeader)} value={config.headerColor} onChange={(v) => set("headerColor", v)} />
                <ColorField label={t(s.colorHeaderText)} value={config.headerTextColor} onChange={(v) => set("headerTextColor", v)} />
                <ColorField label={t(s.colorBody)} value={config.bodyColor} onChange={(v) => set("bodyColor", v)} />
                <ColorField label={t(s.colorStars)} value={config.starColor} onChange={(v) => set("starColor", v)} />
              </>
            )}
            <ColorField label={t(s.colorAccent)} value={config.accentColor} onChange={(v) => set("accentColor", v)} />
          </div>
        </Section>

        </>
        )}

        {/* Step 4 — content & destination */}
        {step === 3 && (
        <>
        <Section n={1} title={isBusiness ? t(s.stepDetails) : t(s.stepContent)}>
          {isBusiness ? (
          <>
            <p className="mb-4 text-sm text-muted">{t(s.detailsHint)}</p>
            <div className="space-y-4">
              <Field label={t(s.fieldName)}>
                <input
                  type="text"
                  className={inputCls}
                  value={config.fullName}
                  placeholder={t(s.fieldNamePh)}
                  onChange={(e) => set("fullName", e.target.value)}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t(s.fieldRole)}>
                  <input
                    type="text"
                    className={inputCls}
                    value={config.jobTitle}
                    placeholder={t(s.fieldRolePh)}
                    onChange={(e) => set("jobTitle", e.target.value)}
                  />
                </Field>
                <Field label={t(s.fieldCompany)}>
                  <input
                    type="text"
                    className={inputCls}
                    value={config.company}
                    placeholder={t(s.fieldCompanyPh)}
                    onChange={(e) => set("company", e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t(s.fieldPhone)}>
                  <input
                    type="tel"
                    inputMode="tel"
                    className={inputCls}
                    value={config.phone}
                    placeholder={t(s.fieldPhonePh)}
                    onChange={(e) => set("phone", e.target.value)}
                  />
                </Field>
                <Field label={t(s.fieldEmail)}>
                  <input
                    type="email"
                    inputMode="email"
                    className={inputCls}
                    value={config.email}
                    placeholder={t(s.fieldEmailPh)}
                    onChange={(e) => set("email", e.target.value)}
                  />
                </Field>
              </div>
              <Field label={t(s.fieldWebsite)}>
                <input
                  type="text"
                  className={inputCls}
                  value={config.website}
                  placeholder={t(s.fieldWebsitePh)}
                  onChange={(e) => set("website", e.target.value)}
                />
              </Field>
            </div>
          </>
          ) : (
          <div className="space-y-4">
            <Field label={t(s.fieldHeadline)}>
              <input
                type="text"
                className={inputCls}
                value={config.headline}
                placeholder={t(s.defaultHeadline)}
                onChange={(e) => set("headline", e.target.value)}
              />
            </Field>

            {/* Fields that depend on the chosen layout */}
            {config.layout === "logo" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t(s.fieldLogoText)}>
                  <input
                    type="text"
                    className={inputCls}
                    value={config.logoText}
                    placeholder={t(s.defaultLogoText)}
                    onChange={(e) => set("logoText", e.target.value)}
                  />
                </Field>
                <Field label={t(s.fieldLogoHint)}>
                  <input
                    type="text"
                    className={inputCls}
                    value={config.logoHint}
                    placeholder={t(s.defaultLogoHint)}
                    onChange={(e) => set("logoHint", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {config.layout === "text" && (
              <Field label={t(s.fieldBodyText)}>
                <textarea
                  rows={3}
                  className={textareaCls}
                  value={config.bodyText}
                  placeholder={t(s.fieldBodyTextPh)}
                  onChange={(e) => set("bodyText", e.target.value)}
                />
              </Field>
            )}

            {config.layout === "list" && (
              <div className="space-y-4">
                <Field label={t(s.fieldListTitle)}>
                  <input
                    type="text"
                    className={inputCls}
                    value={config.listTitle}
                    placeholder={t(s.fieldListTitlePh)}
                    onChange={(e) => set("listTitle", e.target.value)}
                  />
                </Field>
                <Field label={t(s.fieldListItems)}>
                  <textarea
                    rows={4}
                    className={textareaCls}
                    value={config.listItems}
                    placeholder={t(s.fieldListItemsPh)}
                    onChange={(e) => set("listItems", e.target.value)}
                  />
                </Field>
              </div>
            )}

            <Field label={t(s.fieldCategory)}>
              <input
                type="text"
                className={inputCls}
                value={config.category}
                placeholder={t(s.fieldCategoryPh)}
                onChange={(e) => set("category", e.target.value)}
              />
            </Field>
          </div>
          )}
        </Section>

        {/* 6. Destination — review/menu cards only */}
        {!isBusiness && (
        <Section n={2} title={t(s.stepLink)}>
          <Field label={t(s.reviewUrl)}>
            <input
              type="url"
              inputMode="url"
              className={inputCls}
              value={config.reviewUrl}
              placeholder={t(s.reviewUrlPh)}
              onChange={(e) => set("reviewUrl", e.target.value)}
            />
          </Field>
          <p className="mt-2 text-xs leading-relaxed text-muted">{t(s.reviewUrlHint)}</p>
        </Section>
        )}
        </>
        )}

        {/* Step 5: checkout, contact and shipping details */}
        {step === lastStep && (
        <>
        <Section n={1} title={t(s.cartTitle)}>
          {!draftInCart && !draftIsFresh && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink">
              <span>{t(s.draftNotInCart)}</span>
              <span className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(CONTENT_STEP)}
                  className="font-semibold text-muted transition-colors hover:text-ink"
                >
                  {t(s.keepDesigning)}
                </button>
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!canAdd}
                  className="font-semibold text-accent transition-colors hover:text-ink disabled:opacity-40"
                >
                  {t(s.addToCart)}
                </button>
              </span>
            </div>
          )}

          {lines.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line px-6 py-10 text-center">
              <p className="text-sm text-muted">{t(s.cartEmpty)}</p>
              <Button onClick={designAnother} className="mt-4">
                {t(s.cartDesignFirst)} <Arrow />
              </Button>
            </div>
          ) : (
            <>
              <CartLines
                lines={lines}
                locale={locale}
                t={t}
                canAdd={canAdd}
                onQty={setItemQty}
                onEdit={editItem}
                onDuplicate={duplicateItem}
                onRemove={removeItem}
              />
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={designAnother}
                  disabled={!canAdd}
                  className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + {t(s.designAnother)}
                </button>
                {!canAdd && <span className="text-xs text-muted">{t(s.cartFull)}</span>}
              </div>
            </>
          )}
          <p className="mt-4 text-xs text-muted">{t(s.cartSaved)}</p>
        </Section>

        <Section n={2} title={t(s.contactHeading)}>
          <p className="mb-5 text-sm text-muted">{t(s.checkoutHint)}</p>
          <div className="space-y-4">
            {askEmail && (
              <Field label={t(s.coEmail)} error={fieldErrorText("email")}>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={inputCls}
                  value={contact.email}
                  aria-invalid={Boolean(fieldErrors.email)}
                  onChange={(e) => setField("email", e.target.value)}
                />
                <span className="mt-1.5 block text-xs leading-snug text-muted">{t(s.coEmailHint)}</span>
              </Field>
            )}
            <Field label={t(s.coName)} error={fieldErrorText("customerName")}>
              <input
                type="text"
                autoComplete="name"
                className={inputCls}
                value={contact.customerName}
                aria-invalid={Boolean(fieldErrors.customerName)}
                onChange={(e) => setField("customerName", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t(s.coCompany)}>
                <input
                  type="text"
                  autoComplete="organization"
                  className={inputCls}
                  value={contact.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                />
              </Field>
              <Field label={t(s.coPhone)}>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={inputCls}
                  value={contact.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </Field>
            </div>

            <h3 className="pt-3 text-sm font-semibold text-ink">{t(s.shippingHeading)}</h3>
            <Field label={t(s.coLine1)} error={fieldErrorText("line1")}>
              <input
                type="text"
                autoComplete="address-line1"
                className={inputCls}
                value={contact.line1}
                aria-invalid={Boolean(fieldErrors.line1)}
                onChange={(e) => setField("line1", e.target.value)}
              />
            </Field>
            <Field label={t(s.coLine2)}>
              <input
                type="text"
                autoComplete="address-line2"
                className={inputCls}
                value={contact.line2}
                onChange={(e) => setField("line2", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
              <Field label={t(s.coPostalCode)} error={fieldErrorText("postalCode")}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className={inputCls}
                  value={contact.postalCode}
                  aria-invalid={Boolean(fieldErrors.postalCode)}
                  onChange={(e) => setField("postalCode", e.target.value)}
                />
              </Field>
              <Field label={t(s.coCity)} error={fieldErrorText("city")}>
                <input
                  type="text"
                  autoComplete="address-level2"
                  className={inputCls}
                  value={contact.city}
                  aria-invalid={Boolean(fieldErrors.city)}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </Field>
            </div>
            <Field label={t(s.coCountry)} error={fieldErrorText("country")}>
              <select
                autoComplete="country"
                className={inputCls}
                value={contact.country}
                onChange={(e) => setField("country", e.target.value)}
              >
                {COUNTRIES.map((co) => (
                  <option key={co.code} value={co.code}>
                    {t(co.label)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Section>
        </>
        )}

        {/* Step navigation */}
        <div className="mt-8 border-t border-line pt-6">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm font-semibold text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← {t(s.back)}
            </button>
            {step === lastStep ? (
              <Button onClick={checkout} disabled={placing || cartView.length === 0}>
                {placing ? busyLabel : t(s.payNow)} <Arrow />
              </Button>
            ) : !activeType.available ? (
              <span className="inline-flex items-center rounded-full border border-line px-6 py-3 text-sm font-semibold text-muted">
                {t(s.notAvailable)}
              </span>
            ) : step === CONTENT_STEP ? (
              <Button onClick={addToCart}>
                {t(draftInCart ? s.updateCart : s.addToCart)} <Arrow />
              </Button>
            ) : (
              <Button onClick={() => setStep((s) => Math.min(lastStep, s + 1))}>
                {t(s.continue)} <Arrow />
              </Button>
            )}
          </div>
          {orderErrorText && (
            <p role="alert" className="mt-4 text-center text-sm font-medium text-accent">
              {orderErrorText}
            </p>
          )}
          {step < lastStep && (
            <button
              type="button"
              onClick={reset}
              className="mx-auto mt-4 block text-sm font-semibold text-muted transition-colors hover:text-accent"
            >
              ↺ {t(s.resetDesign)}
            </button>
          )}
        </div>
      </div>

      {/* ── Preview + order (sticky) ─────────────────────────────── */}
      <div className={ui.side}>
        <div className={ui.sticky}>
          {step === lastStep ? (
            <CartSummary
              lines={lines}
              t={t}
              missing={missing}
              placing={placing}
              busyLabel={busyLabel}
              errorText={orderErrorText}
              footnote={`${t(s.orderNote)} ${t(s.estimateNote)}`}
              onPay={checkout}
            />
          ) : (
          <>
          {/* The dashed logo guide only shows while designing, so what the
              customer sees from the next step on matches the print. */}
          <CardPreview config={config} locale={locale} guides={step === 2} />
          {step === 2 && !isBusiness && config.layout === "logo" && (
            <p className="mt-2 text-center text-xs text-muted">{t(s.guideHint)}</p>
          )}

          {/* Order box */}
          <div className="mt-6 rounded-card border border-line bg-paper-2/40 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">{t(s.quantity)}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid h-8 w-8 place-items-center rounded-full border border-line text-lg leading-none text-ink hover:border-ink"
                  aria-label="−"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={cap}
                  value={qty}
                  onChange={(e) => setQty(Math.min(cap, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-14 rounded-lg border border-line bg-paper py-1 text-center text-sm font-semibold text-ink outline-none focus:border-ink"
                />
                <button
                  type="button"
                  onClick={() => setQty(Math.min(cap, qty + 1))}
                  className="grid h-8 w-8 place-items-center rounded-full border border-line text-lg leading-none text-ink hover:border-ink"
                  aria-label="+"
                >
                  +
                </button>
              </div>
            </div>

            {/* Volume discount tiers */}
            <div className="mt-4 rounded-xl border border-line bg-paper/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t(s.volumeDiscount)}
                </span>
                {off > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[0.7rem] font-bold text-white">
                    −{Math.round(off * 100)}%
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...tiers].reverse().map((tt) => {
                  const reached = tierQty >= tt.min;
                  const current = tier?.min === tt.min;
                  return (
                    <span
                      key={tt.min}
                      className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold transition-colors ${
                        current
                          ? "border-accent bg-accent/10 text-accent"
                          : reached
                            ? "border-ink/30 text-ink-soft"
                            : "border-line text-muted"
                      }`}
                    >
                      {tt.min}+ · −{Math.round(tt.off * 100)}%
                    </span>
                  );
                })}
              </div>
              <p className="mt-2 text-[0.7rem] leading-snug text-muted">{t(s.volumeHint)}</p>
            </div>

            <div className="mt-4 flex items-end justify-between border-t border-line pt-4">
              <div>
                <span className="text-xs text-muted">
                  {t(s.total)} · CHF {chf(unit)} {t(s.unitPrice)}
                </span>
                <p className="display text-3xl text-ink">CHF {total}</p>
                {off > 0 && (
                  <p className="mt-0.5 text-xs font-medium text-accent">
                    {t(s.youSave)} CHF {chf(savingsNum)}{" "}
                    <span className="text-muted line-through">CHF {chf(subtotalNum)}</span>
                  </p>
                )}
              </div>
              {activeType.available ? (
                <Button onClick={addToCart}>
                  {t(draftInCart ? s.updateCart : s.addToCart)} <Arrow />
                </Button>
              ) : (
                <span className="inline-flex items-center rounded-full border border-line px-6 py-3 text-sm font-semibold text-muted">
                  {t(s.notAvailable)}
                </span>
              )}
            </div>

            {orderErrorText && (
              <p className="mt-3 text-sm font-medium text-accent">{orderErrorText}</p>
            )}
            {cartView.length > 0 && (
              <button
                type="button"
                onClick={goToCheckout}
                className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-paper/60 px-3 py-2.5 text-left text-sm transition-colors hover:border-ink/40"
              >
                <span className="font-semibold text-ink">
                  {t(s.cartLabel)} · {t(s.cartCards).replace("{n}", String(cartView.reduce((n, i) => n + i.quantity, 0)))}
                </span>
                <span className="flex items-center gap-2 font-semibold text-ink">
                  CHF {chf(cartTotal)}
                  <span className="text-xs text-accent">{t(s.viewCart)} →</span>
                </span>
              </button>
            )}
            <p className="mt-3 text-xs leading-relaxed text-muted">
              {t(s.orderNote)} {t(s.estimateNote)}
            </p>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

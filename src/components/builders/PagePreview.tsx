"use client";

import { useState } from "react";
import { Star, Wifi, Phone, Mail, Globe, MapPin, User } from "lucide-react";
import { pickLocalized } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/lib/page-content";
import type {
  LinkHubContent,
  MenuContent,
  PageContent,
  PageKind,
  PageTheme,
  ReviewContent,
  VCardContent,
  WifiContent,
} from "@/lib/page-content";
import { formatChf } from "@/lib/utils";

const DEFAULT_BRAND = "#f0431f";

function priceLabel(currency: string, cents: number): string {
  if ((currency ?? "CHF") === "CHF") return formatChf(cents);
  return `${currency} ${(cents / 100).toFixed(2)}`;
}

// ─── Per-kind renderers ─────────────────────────────────────────────────────

function ReviewPreview({ content, brand }: { content: ReviewContent; brand: string }) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-12 text-center">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} className="size-7 fill-current" style={{ color: brand }} />
        ))}
      </div>
      <div>
        <p className="text-lg font-semibold text-ink">How was your visit?</p>
        <p className="mt-1 text-sm text-muted">Your feedback means the world to us.</p>
      </div>
      <button
        className="w-full rounded-full py-3 text-sm font-semibold text-white shadow"
        style={{ backgroundColor: brand }}
      >
        Leave a review
      </button>
      {content.collectNegativeInternally && (
        <p className="text-[11px] text-muted">
          Ratings under {content.threshold ?? 4} stars stay private.
        </p>
      )}
    </div>
  );
}

function MenuPreview({
  content,
  brand,
  locale,
}: {
  content: MenuContent;
  brand: string;
  locale: Locale;
}) {
  const sections = content.sections ?? [];
  const currency = content.currency ?? "CHF";
  return (
    <div className="flex flex-col gap-6 px-5 py-8">
      <h2 className="display text-2xl text-ink" style={{ color: brand }}>
        Menu
      </h2>
      {sections.length === 0 && <p className="text-sm text-muted">Your menu will appear here.</p>}
      {sections.map((s) => (
        <div key={s.id} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            {pickLocalized(s.name, locale, "Section")}
          </p>
          <div className="flex flex-col gap-3">
            {s.items.map((it) => {
              const off = it.available === false;
              return (
                <div key={it.id} className={`flex gap-3 ${off ? "opacity-40" : ""}`}>
                  {it.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={it.imageUrl}
                      alt=""
                      className="size-12 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-ink">
                        {pickLocalized(it.name, locale, "Item")}
                      </p>
                      <span className="shrink-0 text-sm font-semibold" style={{ color: brand }}>
                        {priceLabel(currency, it.priceCents)}
                      </span>
                    </div>
                    {pickLocalized(it.description, locale) && (
                      <p className="text-xs leading-snug text-muted">
                        {pickLocalized(it.description, locale)}
                      </p>
                    )}
                    {it.allergens && it.allergens.length > 0 && (
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted/70">
                        {it.allergens.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LinkHubPreview({
  content,
  brand,
  locale,
}: {
  content: LinkHubContent;
  brand: string;
  locale: Locale;
}) {
  const links = content.links ?? [];
  const socials = content.socials ?? [];
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-10">
      <div
        className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-paper-2"
        style={{ boxShadow: `0 0 0 3px ${brand}` }}
      >
        {content.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={content.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <User className="size-8 text-muted" />
        )}
      </div>
      {pickLocalized(content.headline, locale) && (
        <p className="text-center text-base font-semibold text-ink">
          {pickLocalized(content.headline, locale)}
        </p>
      )}
      <div className="flex w-full flex-col gap-3">
        {links.length === 0 && (
          <p className="text-center text-sm text-muted">Your links will appear here.</p>
        )}
        {links.map((l) => (
          <div
            key={l.id}
            className="rounded-full border py-3 text-center text-sm font-semibold text-ink"
            style={{ borderColor: brand }}
          >
            {pickLocalized(l.label, locale, "Link")}
          </div>
        ))}
      </div>
      {socials.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {socials.map((s, i) => (
            <span
              key={i}
              className="rounded-full px-3 py-1 text-[11px] font-semibold capitalize text-white"
              style={{ backgroundColor: brand }}
            >
              {s.platform}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function VCardPreview({ content, brand }: { content: VCardContent; brand: string }) {
  const name = [content.firstName, content.lastName].filter(Boolean).join(" ") || "Your name";
  return (
    <div className="flex flex-col gap-5 px-6 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className="flex size-16 items-center justify-center rounded-full text-xl font-bold text-white"
          style={{ backgroundColor: brand }}
        >
          {(content.firstName?.[0] ?? "") + (content.lastName?.[0] ?? "") || "?"}
        </div>
        <p className="text-lg font-semibold text-ink">{name}</p>
        {(content.title || content.org) && (
          <p className="text-sm text-muted">
            {[content.title, content.org].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {(content.phones ?? []).map((p, i) => (
          <div key={`p${i}`} className="flex items-center gap-3 rounded-xl bg-paper-2/60 px-3 py-2">
            <Phone className="size-4" style={{ color: brand }} />
            <span className="text-ink">{p.number || p.label}</span>
          </div>
        ))}
        {(content.emails ?? []).map((m, i) => (
          <div key={`e${i}`} className="flex items-center gap-3 rounded-xl bg-paper-2/60 px-3 py-2">
            <Mail className="size-4" style={{ color: brand }} />
            <span className="truncate text-ink">{m.address || m.label}</span>
          </div>
        ))}
        {content.website && (
          <div className="flex items-center gap-3 rounded-xl bg-paper-2/60 px-3 py-2">
            <Globe className="size-4" style={{ color: brand }} />
            <span className="truncate text-ink">{content.website}</span>
          </div>
        )}
        {content.address && (
          <div className="flex items-center gap-3 rounded-xl bg-paper-2/60 px-3 py-2">
            <MapPin className="size-4" style={{ color: brand }} />
            <span className="text-ink">{content.address}</span>
          </div>
        )}
      </div>

      <button
        className="w-full rounded-full py-3 text-sm font-semibold text-white shadow"
        style={{ backgroundColor: brand }}
      >
        Save contact
      </button>
    </div>
  );
}

function WifiPreview({ content, brand }: { content: WifiContent; brand: string }) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-12 text-center">
      <span
        className="flex size-16 items-center justify-center rounded-full"
        style={{ backgroundColor: `${brand}1a`, color: brand }}
      >
        <Wifi className="size-8" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted">Network</p>
        <p className="mt-1 text-lg font-semibold text-ink">{content.ssid || "Network name"}</p>
        <p className="mt-1 text-xs text-muted">
          {content.encryption === "nopass" ? "Open network" : content.encryption}
        </p>
      </div>
      <button
        className="w-full rounded-full py-3 text-sm font-semibold text-white shadow"
        style={{ backgroundColor: brand }}
      >
        Join network
      </button>
      <p className="text-[11px] text-muted">Tap to connect, no password typing needed.</p>
    </div>
  );
}

// ─── Phone frame wrapper ────────────────────────────────────────────────────

export function PagePreview({
  kind,
  content,
  theme,
}: {
  kind: PageKind;
  content: PageContent;
  theme: PageTheme;
}) {
  const [locale, setLocale] = useState<Locale>("de");
  const brand = theme?.brandColor || DEFAULT_BRAND;

  let body: React.ReactNode = null;
  switch (kind) {
    case "REVIEW":
      body = <ReviewPreview content={content as ReviewContent} brand={brand} />;
      break;
    case "MENU":
      body = <MenuPreview content={content as MenuContent} brand={brand} locale={locale} />;
      break;
    case "LINKHUB":
      body = <LinkHubPreview content={content as LinkHubContent} brand={brand} locale={locale} />;
      break;
    case "VCARD":
      body = <VCardPreview content={content as VCardContent} brand={brand} />;
      break;
    case "WIFI":
      body = <WifiPreview content={content as WifiContent} brand={brand} />;
      break;
  }

  const showLocaleToggle = kind === "MENU" || kind === "LINKHUB";

  return (
    <div className="flex flex-col items-center gap-4">
      {showLocaleToggle && (
        <div className="flex gap-1">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase transition ${
                locale === loc ? "bg-ink text-paper" : "bg-ink/5 text-muted hover:bg-ink/10"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      )}

      <div className="w-[320px] rounded-[2.5rem] border-[10px] border-ink bg-ink p-0 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
        <div className="relative overflow-hidden rounded-[1.8rem] bg-paper">
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
          <div className="no-scrollbar max-h-[560px] overflow-y-auto pt-6">{body}</div>
        </div>
      </div>
    </div>
  );
}

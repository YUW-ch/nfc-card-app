"use client";

import { useMemo, useRef, useState } from "react";
import type { Locale, MenuContent, MenuSection, PageTheme } from "@/lib/types";
import { availableLocales, pickLocalized, DEFAULT_LOCALE, LOCALE_LABELS } from "@/lib/i18n";
import { formatChf } from "@/lib/utils";
import { DEFAULT_BRAND, readableOn } from "./PublicShell";

function formatPrice(cents: number, currency: string): string {
  if (currency === "CHF") return formatChf(cents);
  const amount = (cents / 100).toFixed(2);
  return `${currency} ${amount}`;
}

export function MenuView({
  content,
  name,
  theme,
}: {
  content: MenuContent;
  name: string;
  theme?: PageTheme;
}) {
  const brand = theme?.brandColor || DEFAULT_BRAND;
  const onBrand = readableOn(brand);
  const currency = content?.currency || "CHF";
  const sections: MenuSection[] = Array.isArray(content?.sections) ? content.sections : [];

  const locales = useMemo(() => {
    const texts = sections.flatMap((s) => [
      s.name,
      ...(s.items ?? []).flatMap((i) => [i.name, i.description]),
    ]);
    const found = availableLocales(...texts);
    return found.length ? found : [DEFAULT_LOCALE];
  }, [sections]);

  const [locale, setLocale] = useState<Locale>(locales[0] ?? DEFAULT_LOCALE);
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  function scrollTo(id: string) {
    setActive(id);
    const el = sectionRefs.current[id];
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="display text-2xl">{name}</p>
        <p className="mt-2 opacity-60">The menu is being prepared.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="pb-2 pt-4">
        {theme?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logoUrl} alt={name} className="mb-3 max-h-14 w-auto object-contain" />
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <p className="display text-3xl">{name}</p>
          {locales.length > 1 && (
            <div className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto">
              {locales.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className="min-h-[32px] rounded-full px-2.5 text-xs font-semibold transition"
                  style={
                    l === locale
                      ? { background: brand, color: onBrand }
                      : { background: "rgba(20,18,15,0.06)", color: "inherit" }
                  }
                >
                  {LOCALE_LABELS[l].slice(0, 2)}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Sticky category tabs */}
      <div className="no-scrollbar sticky top-0 z-10 -mx-5 flex gap-2 overflow-x-auto px-5 py-3 backdrop-blur-md">
        {sections.map((s) => {
          const label = pickLocalized(s.name, locale, "Section");
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="min-h-[38px] shrink-0 rounded-full px-4 text-sm font-semibold transition"
              style={
                isActive
                  ? { background: brand, color: onBrand }
                  : { background: "rgba(20,18,15,0.06)", color: "inherit" }
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-8 py-4">
        {sections.map((s) => (
          <section
            key={s.id}
            ref={(el) => {
              sectionRefs.current[s.id] = el;
            }}
          >
            <h2 className="display mb-3 text-xl">{pickLocalized(s.name, locale, "Section")}</h2>
            <ul className="flex flex-col divide-y divide-black/5">
              {(s.items ?? []).map((item) => {
                const unavailable = item.available === false;
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 py-3"
                    style={{ opacity: unavailable ? 0.4 : 1 }}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-16 shrink-0 rounded-xl object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">
                          {pickLocalized(item.name, locale, "Item")}
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold" style={{ color: brand }}>
                          {formatPrice(item.priceCents ?? 0, currency)}
                        </span>
                      </div>
                      {pickLocalized(item.description, locale) && (
                        <p className="mt-0.5 text-sm opacity-60">
                          {pickLocalized(item.description, locale)}
                        </p>
                      )}
                      {(item.allergens?.length || unavailable) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {unavailable && (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold opacity-70">
                              Unavailable
                            </span>
                          )}
                          {item.allergens?.map((a) => (
                            <span
                              key={a}
                              className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium opacity-70"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

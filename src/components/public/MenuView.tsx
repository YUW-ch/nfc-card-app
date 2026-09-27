"use client";

import { useRef, useState } from "react";
import { Flame, Leaf, Vegan } from "lucide-react";
import type { Locale, MenuContent, MenuItem, MenuSection } from "@/lib/page-content";
import { pickLocalized } from "@/lib/i18n";
import { formatChf } from "@/lib/utils";

function formatPrice(cents: number, currency: string): string {
  if (currency === "CHF") return formatChf(cents);
  const amount = (cents / 100).toFixed(2);
  return `${currency} ${amount}`;
}

const SPICE_LABEL = ["", "Mild", "Spicy", "Very spicy"] as const;

/** Vegan, vegetarian and chili markers for one dish. */
export function DietBadges({ item, size = "md" }: { item: MenuItem; size?: "sm" | "md" }) {
  const spicy = item.spicy ?? 0;
  if (!item.vegan && !item.vegetarian && !spicy) return null;
  const icon = size === "sm" ? "size-3" : "size-3.5";
  const pill =
    "inline-flex items-center gap-1 rounded-[var(--pt-radius)] px-2 py-0.5 text-[11px] font-semibold";
  return (
    <>
      {item.vegan ? (
        <span className={pill} style={{ background: "#2f8f4e1f", color: "#2f8f4e" }} title="Vegan">
          <Vegan className={icon} /> Vegan
        </span>
      ) : item.vegetarian ? (
        <span
          className={pill}
          style={{ background: "#2f8f4e1f", color: "#2f8f4e" }}
          title="Vegetarian"
        >
          <Leaf className={icon} /> Vegetarian
        </span>
      ) : null}
      {spicy > 0 && (
        <span
          className={pill}
          style={{ background: "#e0482d1f", color: "#e0482d" }}
          title={SPICE_LABEL[spicy]}
          aria-label={SPICE_LABEL[spicy]}
        >
          {Array.from({ length: spicy }, (_, i) => (
            <Flame key={i} className={`${icon} fill-current`} />
          ))}
        </span>
      )}
    </>
  );
}

export function MenuView({
  content,
  name,
  locale,
}: {
  content: MenuContent;
  name: string;
  locale: Locale;
}) {
  const currency = content?.currency || "CHF";
  const sections: MenuSection[] = Array.isArray(content?.sections) ? content.sections : [];

  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  function scrollTo(id: string) {
    setActive(id);
    // scrollIntoView also works inside the editor's phone preview, where the
    // page scrolls in a container rather than the window.
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="display text-2xl">{name}</p>
        <p className="mt-2 opacity-60">The menu is being prepared.</p>
      </div>
    );
  }

  const allItems = sections.flatMap((s) => s.items ?? []);
  const hasVeg = allItems.some((i) => i.vegan || i.vegetarian);
  const hasSpicy = allItems.some((i) => (i.spicy ?? 0) > 0);

  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky category tabs */}
      {sections.length > 1 && (
        <div
          className="no-scrollbar sticky top-0 z-10 -mx-5 flex gap-2 overflow-x-auto px-5 py-3 backdrop-blur-md"
          style={{ background: "color-mix(in srgb, var(--pt-bg) 85%, transparent)" }}
        >
          {sections.map((s) => {
            const isActive = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="min-h-[38px] shrink-0 rounded-[var(--pt-radius)] px-4 text-sm font-semibold transition"
                style={
                  isActive
                    ? { background: "var(--pt-brand)", color: "var(--pt-on-brand)" }
                    : { background: "var(--pt-chip)", color: "inherit" }
                }
              >
                {pickLocalized(s.name, locale, "Section")}
              </button>
            );
          })}
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-8 py-4">
        {sections.map((s) => (
          <section
            key={s.id}
            className="scroll-mt-20"
            ref={(el) => {
              sectionRefs.current[s.id] = el;
            }}
          >
            <h2 className="display mb-3 text-2xl">{pickLocalized(s.name, locale, "Section")}</h2>
            <ul
              className="flex flex-col overflow-hidden rounded-[var(--pt-card-radius)]"
              style={{ background: "var(--pt-surface)" }}
            >
              {(s.items ?? []).map((item, index) => {
                const unavailable = item.available === false;
                return (
                  <li
                    key={item.id}
                    className="flex gap-3 p-4"
                    style={{
                      opacity: unavailable ? 0.45 : 1,
                      borderTop: index > 0 ? "1px solid var(--pt-line)" : undefined,
                    }}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="size-20 shrink-0 rounded-[var(--pt-card-radius)] object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-semibold">
                          {pickLocalized(item.name, locale, "Item")}
                        </span>
                        <span
                          className="shrink-0 font-semibold tabular-nums"
                          style={{ color: "var(--pt-brand)" }}
                        >
                          {formatPrice(item.priceCents ?? 0, currency)}
                        </span>
                      </div>
                      {pickLocalized(item.description, locale) && (
                        <p className="mt-0.5 text-sm opacity-65">
                          {pickLocalized(item.description, locale)}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-1.5 empty:hidden">
                        <DietBadges item={item} />
                        {unavailable && (
                          <span
                            className="rounded-[var(--pt-radius)] px-2 py-0.5 text-[11px] font-semibold opacity-80"
                            style={{ background: "var(--pt-chip)" }}
                          >
                            Unavailable
                          </span>
                        )}
                        {item.allergens?.map((a) => (
                          <span
                            key={a}
                            className="rounded-[var(--pt-radius)] px-2 py-0.5 text-[11px] font-medium opacity-70"
                            style={{ background: "var(--pt-chip)" }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {(hasVeg || hasSpicy) && (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs opacity-60">
          {hasVeg && (
            <span className="inline-flex items-center gap-1">
              <Leaf className="size-3.5" /> Vegetarian · <Vegan className="size-3.5" /> Vegan
            </span>
          )}
          {hasSpicy && (
            <span className="inline-flex items-center gap-1">
              <Flame className="size-3.5 fill-current" /> Mild to very spicy
            </span>
          )}
        </p>
      )}
    </div>
  );
}

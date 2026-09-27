"use client";

import { useMemo, useState } from "react";
import { availableLocales, DEFAULT_LOCALE } from "@/lib/i18n";
import type {
  LinkHubContent,
  Locale,
  LocalizedText,
  MenuContent,
  PageContent,
  PageKind,
  PageTheme,
  ReviewContent,
  VCardContent,
  WifiContent,
} from "@/lib/page-content";
import { BrandHeader, PublicShell } from "./PublicShell";
import { ReviewView } from "./ReviewView";
import { MenuView } from "./MenuView";
import { LinkHubView } from "./LinkHubView";
import { VCardView } from "./VCardView";
import { WifiView } from "./WifiView";

export interface PublicPage {
  id?: string;
  kind: PageKind;
  name: string;
  theme?: PageTheme;
  content?: PageContent;
}

function PoweredBy() {
  return (
    <div className="mt-auto pt-8 text-center">
      <a
        href="https://taplino.ch"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium opacity-40 transition hover:opacity-70"
      >
        Powered by <span className="font-semibold">taplino</span>
      </a>
    </div>
  );
}

/** Every translatable text on the page, to decide which languages to offer. */
function localizedTexts(kind: PageKind, content: PageContent, theme?: PageTheme) {
  const texts: (LocalizedText | undefined)[] = [theme?.title, theme?.tagline];
  if (kind === "MENU") {
    for (const s of (content as MenuContent).sections ?? []) {
      texts.push(s.name);
      for (const i of s.items ?? []) texts.push(i.name, i.description);
    }
  }
  if (kind === "LINKHUB") {
    const c = content as LinkHubContent;
    texts.push(c.headline, ...(c.links ?? []).map((l) => l.label));
  }
  return texts;
}

/**
 * Renders a page exactly as guests see it. Used by the public routes and, with
 * `embedded`, by the editor preview.
 */
export function PublicRenderer({ page, embedded = false }: { page: PublicPage; embedded?: boolean }) {
  const { kind, name, theme } = page;
  const content = (page.content ?? {}) as PageContent;

  const locales = useMemo(() => {
    const found = availableLocales(...localizedTexts(kind, content, theme));
    return found.length ? found : [DEFAULT_LOCALE];
  }, [kind, content, theme]);
  const [picked, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  // Fall back when the picked language disappears (e.g. while editing).
  const locale = locales.includes(picked) ? picked : locales[0];

  // Menus, review and link pages are titled by the business; contact and
  // Wi-Fi pages carry their own big heading.
  const fallbackTitle =
    kind === "MENU" || kind === "REVIEW" || kind === "LINKHUB" ? name : null;

  let view;
  switch (kind) {
    case "REVIEW":
      view = <ReviewView content={content as ReviewContent} name={name} />;
      break;
    case "MENU":
      view = <MenuView content={content as MenuContent} name={name} locale={locale} />;
      break;
    case "LINKHUB":
      view = <LinkHubView content={content as LinkHubContent} locale={locale} />;
      break;
    case "VCARD":
      view = <VCardView content={content as VCardContent} name={name} />;
      break;
    case "WIFI":
      view = <WifiView content={content as WifiContent} name={name} />;
      break;
    default:
      view = (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="display text-2xl">{name}</p>
          <p className="mt-2 opacity-60">This page is not available.</p>
        </div>
      );
  }

  return (
    <PublicShell
      theme={theme}
      embedded={embedded}
      header={
        <BrandHeader
          theme={theme}
          fallbackTitle={fallbackTitle}
          locales={locales}
          locale={locale}
          onLocale={setLocale}
        />
      }
    >
      {view}
      <PoweredBy />
    </PublicShell>
  );
}

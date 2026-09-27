"use client";

import type {
  PageKind,
  PageTheme,
  PageContent,
  ReviewContent,
  MenuContent,
  LinkHubContent,
  VCardContent,
  WifiContent,
} from "@/lib/types";
import { PublicShell } from "./PublicShell";
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

export function PublicRenderer({ page }: { page: PublicPage }) {
  const { kind, name, theme } = page;
  const content = (page.content ?? {}) as PageContent;

  let view;
  switch (kind) {
    case "REVIEW":
      view = <ReviewView content={content as ReviewContent} name={name} theme={theme} />;
      break;
    case "MENU":
      view = <MenuView content={content as MenuContent} name={name} theme={theme} />;
      break;
    case "LINKHUB":
      view = <LinkHubView content={content as LinkHubContent} name={name} theme={theme} />;
      break;
    case "VCARD":
      view = <VCardView content={content as VCardContent} name={name} theme={theme} />;
      break;
    case "WIFI":
      view = <WifiView content={content as WifiContent} name={name} theme={theme} />;
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
    <PublicShell theme={theme}>
      {view}
      <PoweredBy />
    </PublicShell>
  );
}

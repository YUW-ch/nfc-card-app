"use client";

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
import { DesignPanel } from "./DesignPanel";
import { ReviewBuilder, emptyReviewContent } from "./ReviewBuilder";
import { MenuBuilder, emptyMenuContent } from "./MenuBuilder";
import { LinkHubBuilder } from "./LinkHubBuilder";
import { VCardBuilder, emptyVCardContent } from "./VCardBuilder";
import { WifiBuilder, emptyWifiContent } from "./WifiBuilder";

/** Seed a builder's content from a stored page, filling missing fields. */
export function seedContent(kind: PageKind, stored: unknown): PageContent {
  const raw = (stored ?? {}) as Record<string, unknown>;
  const isEmpty = Object.keys(raw).length === 0;
  switch (kind) {
    case "REVIEW":
      return isEmpty
        ? emptyReviewContent()
        : { ...emptyReviewContent(), ...(raw as unknown as ReviewContent) };
    case "MENU": {
      const c = raw as Partial<MenuContent>;
      return { currency: c.currency ?? "CHF", sections: c.sections ?? emptyMenuContent().sections };
    }
    case "LINKHUB": {
      const c = raw as Partial<LinkHubContent>;
      return { headline: c.headline, avatarUrl: c.avatarUrl, links: c.links ?? [], socials: c.socials ?? [] };
    }
    case "VCARD":
      return { ...emptyVCardContent(), ...(raw as unknown as VCardContent) };
    case "WIFI":
      return { ...emptyWifiContent(), ...(raw as unknown as WifiContent) };
    default:
      return raw;
  }
}

/** The kind-specific builder plus the design panels, as used by the page editors. */
export function PageContentEditor({
  kind,
  content,
  onContentChange,
  theme,
  onThemeChange,
  pageName,
}: {
  kind: PageKind;
  content: PageContent;
  onContentChange: (content: PageContent) => void;
  theme: PageTheme;
  onThemeChange: (theme: PageTheme) => void;
  /** Fallback title shown on the page when the design sets none. */
  pageName: string;
}) {
  return (
    <>
      {kind === "REVIEW" && (
        <ReviewBuilder value={content as ReviewContent} onChange={onContentChange} />
      )}
      {kind === "MENU" && <MenuBuilder value={content as MenuContent} onChange={onContentChange} />}
      {kind === "LINKHUB" && (
        <LinkHubBuilder value={content as LinkHubContent} onChange={onContentChange} />
      )}
      {kind === "VCARD" && (
        <VCardBuilder value={content as VCardContent} onChange={onContentChange} />
      )}
      {kind === "WIFI" && <WifiBuilder value={content as WifiContent} onChange={onContentChange} />}

      <DesignPanel theme={theme} onChange={onThemeChange} pageName={pageName} />
    </>
  );
}

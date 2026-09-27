"use client";

import { Palette } from "lucide-react";
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
import { Card, Field, Input } from "@/components/ui";
import { ReviewBuilder, emptyReviewContent } from "./ReviewBuilder";
import { MenuBuilder, emptyMenuContent } from "./MenuBuilder";
import { LinkHubBuilder } from "./LinkHubBuilder";
import { VCardBuilder, emptyVCardContent } from "./VCardBuilder";
import { WifiBuilder, emptyWifiContent } from "./WifiBuilder";

const DEFAULT_BRAND = "#f0431f";

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

/** The kind-specific builder plus the Design card, as used by the page editors. */
export function PageContentEditor({
  kind,
  content,
  onContentChange,
  theme,
  onThemeChange,
}: {
  kind: PageKind;
  content: PageContent;
  onContentChange: (content: PageContent) => void;
  theme: PageTheme;
  onThemeChange: (theme: PageTheme) => void;
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

      <Card className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Palette className="size-4" />
          </span>
          <div>
            <p className="display text-lg text-ink">Design</p>
            <p className="text-xs text-muted">The accent colour used across your page.</p>
          </div>
        </div>
        <Field label="Brand colour">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.brandColor || DEFAULT_BRAND}
              onChange={(e) => onThemeChange({ ...theme, brandColor: e.target.value })}
              className="size-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1"
              aria-label="Brand colour"
            />
            <Input
              value={theme.brandColor ?? ""}
              placeholder={DEFAULT_BRAND}
              onChange={(e) => onThemeChange({ ...theme, brandColor: e.target.value })}
            />
          </div>
        </Field>
      </Card>
    </>
  );
}

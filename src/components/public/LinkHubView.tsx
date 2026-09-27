"use client";

import { useMemo, useState } from "react";
import {
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Music2,
  MessageCircle,
  Send as TelegramIcon,
  type LucideIcon,
} from "lucide-react";
import type { Locale, LinkHubContent, PageTheme } from "@/lib/types";
import { availableLocales, pickLocalized, DEFAULT_LOCALE, LOCALE_LABELS } from "@/lib/i18n";
import { DEFAULT_BRAND, readableOn } from "./PublicShell";

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
  github: Github,
  tiktok: Music2,
  spotify: Music2,
  whatsapp: MessageCircle,
  telegram: TelegramIcon,
};

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function LinkHubView({
  content,
  name,
  theme,
}: {
  content: LinkHubContent;
  name: string;
  theme?: PageTheme;
}) {
  const brand = theme?.brandColor || DEFAULT_BRAND;
  const onBrand = readableOn(brand);
  const links = Array.isArray(content?.links) ? content.links : [];
  const socials = Array.isArray(content?.socials) ? content.socials : [];
  const avatarUrl = content?.avatarUrl || theme?.logoUrl;

  const locales = useMemo(() => {
    const found = availableLocales(content?.headline, ...links.map((l) => l.label));
    return found.length ? found : [DEFAULT_LOCALE];
  }, [content?.headline, links]);

  const [locale, setLocale] = useState<Locale>(locales[0] ?? DEFAULT_LOCALE);

  const headline = pickLocalized(content?.headline, locale, name);

  return (
    <div className="flex flex-1 flex-col items-center pt-6 text-center">
      {locales.length > 1 && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLocale(l)}
              className="min-h-[32px] rounded-full px-3 text-xs font-semibold transition"
              style={
                l === locale
                  ? { background: brand, color: onBrand }
                  : { background: "rgba(20,18,15,0.06)", color: "inherit" }
              }
            >
              {LOCALE_LABELS[l]}
            </button>
          ))}
        </div>
      )}

      {/* Avatar */}
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          className="size-24 rounded-full object-cover shadow-md"
        />
      ) : (
        <div
          className="flex size-24 items-center justify-center rounded-full text-3xl font-bold shadow-md"
          style={{ background: brand, color: onBrand }}
        >
          {initials(name)}
        </div>
      )}

      <p className="display mt-4 text-2xl">{headline}</p>

      {/* Links */}
      <div className="mt-8 flex w-full flex-col gap-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[56px] w-full items-center justify-center rounded-full border-2 px-6 text-base font-semibold transition active:scale-[0.98]"
            style={{ borderColor: brand, background: "rgba(255,255,255,0.6)" }}
          >
            {pickLocalized(link.label, locale, "Link")}
          </a>
        ))}
      </div>

      {/* Socials */}
      {socials.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {socials.map((s, i) => {
            const Icon = SOCIAL_ICONS[s.platform?.toLowerCase()] ?? Globe;
            return (
              <a
                key={`${s.platform}-${i}`}
                href={s.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.platform}
                className="flex size-12 items-center justify-center rounded-full transition active:scale-90"
                style={{ background: "rgba(20,18,15,0.06)" }}
              >
                <Icon className="size-6" style={{ color: brand }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

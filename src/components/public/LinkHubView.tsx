"use client";

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
import type { Locale, LinkHubContent } from "@/lib/page-content";
import { pickLocalized } from "@/lib/i18n";

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

export function LinkHubView({ content, locale }: { content: LinkHubContent; locale: Locale }) {
  const links = Array.isArray(content?.links) ? content.links : [];
  const socials = Array.isArray(content?.socials) ? content.socials : [];
  const headline = pickLocalized(content?.headline, locale);

  return (
    <div className="flex flex-1 flex-col items-center text-center">
      {content?.avatarUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={content.avatarUrl}
          alt=""
          className="mt-2 size-24 rounded-full object-cover shadow-md"
        />
      )}
      {headline && <p className="mt-4 text-lg font-semibold">{headline}</p>}

      {/* Links */}
      <div className="mt-6 flex w-full flex-col gap-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[56px] w-full items-center justify-center rounded-[var(--pt-radius)] border-2 px-6 text-base font-semibold transition active:scale-[0.98]"
            style={{ borderColor: "var(--pt-brand)", background: "var(--pt-surface)" }}
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
                className="flex size-12 items-center justify-center rounded-[var(--pt-radius)] transition active:scale-90"
                style={{ background: "var(--pt-chip)" }}
              >
                <Icon className="size-6" style={{ color: "var(--pt-brand)" }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

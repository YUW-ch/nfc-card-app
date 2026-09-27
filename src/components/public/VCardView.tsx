"use client";

import {
  UserPlus,
  Phone,
  Mail,
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
import type { VCardContent, SocialLink } from "@/lib/page-content";

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

function initials(first?: string, last?: string): string {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

function escapeVCard(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildVCard(c: VCardContent): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  const first = c.firstName ?? "";
  const last = c.lastName ?? "";
  lines.push(`N:${escapeVCard(last)};${escapeVCard(first)};;;`);
  lines.push(`FN:${escapeVCard(`${first} ${last}`.trim())}`);
  if (c.org) lines.push(`ORG:${escapeVCard(c.org)}`);
  if (c.title) lines.push(`TITLE:${escapeVCard(c.title)}`);
  for (const p of c.phones ?? []) {
    const label = (p.label || "CELL").toUpperCase();
    lines.push(`TEL;TYPE=${escapeVCard(label)}:${p.number}`);
  }
  for (const e of c.emails ?? []) {
    const label = (e.label || "INTERNET").toUpperCase();
    lines.push(`EMAIL;TYPE=${escapeVCard(label)}:${e.address}`);
  }
  if (c.website) lines.push(`URL:${c.website}`);
  if (c.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(c.address)};;;;`);
  for (const s of c.socials ?? []) {
    if (s.url) lines.push(`URL:${s.url}`);
  }
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function VCardView({
  content,
  name,
}: {
  content: VCardContent;
  name: string;
}) {

  const first = content?.firstName ?? "";
  const last = content?.lastName ?? "";
  const fullName = `${first} ${last}`.trim() || name;
  const phones = content?.phones ?? [];
  const emails = content?.emails ?? [];
  const socials: SocialLink[] = content?.socials ?? [];

  function download() {
    const vcard = buildVCard(content);
    const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${first || "contact"}_${last || "card"}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const primaryPhone = phones[0]?.number;
  const primaryEmail = emails[0]?.address;

  return (
    <div className="flex flex-1 flex-col items-center pt-4 text-center">
      {/* Avatar */}
      <div
        className="flex size-24 items-center justify-center rounded-full text-3xl font-bold shadow-md"
        style={{ background: "var(--pt-brand)", color: "var(--pt-on-brand)" }}
      >
        {initials(first, last)}
      </div>

      <p className="display mt-5 text-3xl">{fullName}</p>
      {content?.title && <p className="mt-1 text-base opacity-70">{content.title}</p>}
      {content?.org && <p className="text-sm opacity-50">{content.org}</p>}

      {/* Add to contacts */}
      <button
        type="button"
        onClick={download}
        className="mt-8 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[var(--pt-radius)] text-lg font-semibold shadow-lg transition active:scale-[0.98]"
        style={{ background: "var(--pt-brand)", color: "var(--pt-on-brand)" }}
      >
        <UserPlus className="size-6" />
        Add to contacts
      </button>

      {/* Quick actions */}
      <div className="mt-4 grid w-full grid-cols-1 gap-3">
        {primaryPhone && (
          <a
            href={`tel:${primaryPhone}`}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--pt-radius)] border-2 px-6 text-base font-semibold transition active:scale-[0.98]"
            style={{ borderColor: "var(--pt-brand)", background: "var(--pt-surface)" }}
          >
            <Phone className="size-5" style={{ color: "var(--pt-brand)" }} />
            Call
          </a>
        )}
        {primaryEmail && (
          <a
            href={`mailto:${primaryEmail}`}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--pt-radius)] border-2 px-6 text-base font-semibold transition active:scale-[0.98]"
            style={{ borderColor: "var(--pt-brand)", background: "var(--pt-surface)" }}
          >
            <Mail className="size-5" style={{ color: "var(--pt-brand)" }} />
            Email
          </a>
        )}
        {content?.website && (
          <a
            href={content.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-[var(--pt-radius)] border-2 px-6 text-base font-semibold transition active:scale-[0.98]"
            style={{ borderColor: "var(--pt-brand)", background: "var(--pt-surface)" }}
          >
            <Globe className="size-5" style={{ color: "var(--pt-brand)" }} />
            Website
          </a>
        )}
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

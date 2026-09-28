"use client";

// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

import Image from "next/image";
import { s } from "./strings";
import { makeT, type EditorLocale, type Translate } from "./locale";
import markLogo from "./assets/taplino-mark.svg";
import markLogoLight from "./assets/taplino-mark-cream-on-ink.svg";
import lockupLogo from "./assets/taplino-lockup.svg";
import { CARD_TYPES, FINISHES, FONT_STACKS, exampleText, type CardConfig, type HeaderShape } from "./types";

const STAR =
  "M12 2l3 6.5 7 .8-5.2 4.7 1.4 6.9L12 17.6 5.4 20.9l1.4-6.9L1.6 9.3l7-.8L12 2z";

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function TapGlyph({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 11.5a4 4 0 0 1 0-.01M12 14a7 7 0 0 0 0-4M15 16a10 10 0 0 0 0-8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect x="3.5" y="4" width="8" height="16" rx="2" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

// The shaped bottom edge of the header band. Rendered as an SVG that continues
// the header colour downwards, so the header appears to "melt" into the card —
// the flowy Google-review-card look. `straight` keeps a plain rounded band.
function HeaderEdge({ shape, color }: { shape: HeaderShape; color: string }) {
  if (shape === "straight") return null;
  const paths: Record<Exclude<HeaderShape, "straight">, string> = {
    // one dip + one rise → a soft double wave
    wave: "M0 0 H100 V8 Q75 22 50 10 T0 10 Z",
    // a single wide arch bulging down in the middle
    round: "M0 0 H100 V5 Q50 30 0 5 Z",
    // a row of rounded scallops
    scallop:
      "M0 6 a10 8 0 0 1 20 0 a10 8 0 0 1 20 0 a10 8 0 0 1 20 0 a10 8 0 0 1 20 0 a10 8 0 0 1 20 0 V0 H0 Z",
  };
  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      className="-mt-px block h-5 w-full"
      aria-hidden
    >
      <path d={paths[shape]} fill={color} />
    </svg>
  );
}

// An illustrative QR code for the live preview. It is deterministic from the
// review link (real finder patterns + separators + seeded modules) so it looks
// convincing; the print team generates the real, scannable code from the link.
function QrCode({ value, fg, size = 46 }: { value: string; fg: string; size?: number }) {
  const N = 25;
  const s = value || "taplino.ch";
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const isOn = (x: number, y: number): boolean => {
    for (const [fx, fy] of [
      [0, 0],
      [N - 7, 0],
      [0, N - 7],
    ] as const) {
      const dx = x - fx;
      const dy = y - fy;
      if (dx >= 0 && dy >= 0 && dx <= 6 && dy <= 6) {
        const ring = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const core = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        return ring || core;
      }
    }
    // Quiet separator around each finder pattern.
    if ((x <= 7 && y <= 7) || (x >= N - 8 && y <= 7) || (x <= 7 && y >= N - 8)) {
      return false;
    }
    let v = (h ^ (x * 73856093) ^ (y * 19349663)) >>> 0;
    v = (v ^ (v >>> 13)) >>> 0;
    return (v & 7) > 3;
  };
  const cells: { x: number; y: number }[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) if (isOn(x, y)) cells.push({ x, y });
  const pad = 1;
  const vb = N + pad * 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${vb} ${vb}`}
      className="shrink-0 rounded-[3px]"
      aria-hidden
    >
      <rect width={vb} height={vb} fill="#ffffff" rx={1.5} />
      {cells.map((c, i) => (
        <rect key={i} x={c.x + pad} y={c.y + pad} width={1} height={1} fill={fg} />
      ))}
    </svg>
  );
}

// A tiny contact line (icon + value) for the metal business card.
function ContactLine({
  icon,
  value,
  accent,
  text,
}: {
  icon: "phone" | "mail" | "web";
  value: string;
  accent: string;
  text: string;
}) {
  const paths: Record<typeof icon, string> = {
    phone: "M6.5 3h2l1 3-1.5 1a8 8 0 0 0 4 4l1-1.5 3 1v2a1.5 1.5 0 0 1-1.6 1.5A11 11 0 0 1 5 4.6 1.5 1.5 0 0 1 6.5 3z",
    mail: "M3 5.5h12v7H3v-7zm0 .5l6 4 6-4",
    web: "M9 2.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM2.5 9h13M9 2.5c2 2 2 11 0 13M9 2.5c-2 2-2 11 0 13",
  };
  return (
    <span className="flex items-center gap-1.5 text-[0.66rem] leading-none" style={{ color: text }}>
      <svg width="11" height="11" viewBox="0 0 18 18" fill="none" aria-hidden className="shrink-0">
        <path d={paths[icon]} stroke={accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="truncate">{value}</span>
    </span>
  );
}

// The premium metal business card face — brushed metal (silver or black). A real
// business card: name, role, company and contact details, with an NFC glyph and
// a very subtle Taplino imprint. Rendered when the "business" card type is chosen.
function MetalCardFace({
  config,
  dark,
  t,
}: {
  config: CardConfig;
  dark: boolean; // black finish → light text; silver finish → dark text
  t: Translate;
}) {
  const cardFont = FONT_STACKS[config.font];
  const serif = config.font === "serif";
  const display = config.font === "display";
  const ink = dark ? "#f4f1ea" : "#18171c";
  const sub = dark ? "rgba(244,241,234,0.66)" : "rgba(24,23,28,0.6)";
  const accent = config.accentColor;

  const nameStyle = {
    fontFamily: cardFont,
    fontWeight: serif ? 500 : display ? 800 : 700,
    fontStyle: serif ? ("italic" as const) : ("normal" as const),
    letterSpacing: display ? "-0.02em" : "-0.01em",
  };

  const name = config.fullName || t(s.bizNameDefault);
  const role = config.jobTitle;
  const company = config.company;
  const phone = config.phone || t(s.fieldPhonePh);
  const email = config.email || t(s.fieldEmailPh);
  const website = config.website || t(s.fieldWebsitePh);

  return (
    <div className="relative h-full">
      {/* brushed-metal sheen */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 34%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.20) 100%)",
        }}
      />
      <div
        className="relative flex h-full flex-col justify-between p-[7%]"
        style={{ color: ink, fontFamily: cardFont }}
      >
        {/* Top — logo / company + contactless glyph */}
        <div className="flex items-start justify-between gap-3">
          {config.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.logoDataUrl}
              alt="logo"
              className="object-contain"
              style={{
                maxHeight: `${1.75 * (config.logoScale ?? 1)}rem`,
                maxWidth: `${120 * (config.logoScale ?? 1)}px`,
                ...(dark ? { filter: "brightness(0) invert(1)" } : {}),
              }}
            />
          ) : company ? (
            <span className="truncate text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: sub }}>
              {company}
            </span>
          ) : (
            <span />
          )}
          <Image
            src={dark ? markLogoLight : markLogo}
            alt="Taplino"
            width={64}
            height={64}
            unoptimized
            className="h-6 w-6 shrink-0 opacity-90"
          />
        </div>

        {/* Middle — name, role, company */}
        <div className="min-w-0">
          <p className="truncate text-[1.35rem] leading-tight" style={nameStyle}>
            {name}
          </p>
          {(role || (company && config.logoDataUrl)) && (
            <p className="mt-0.5 truncate text-[0.75rem]" style={{ color: sub }}>
              {[role, config.logoDataUrl ? company : ""].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        {/* Bottom — contact details */}
        <div className="flex min-w-0 flex-col gap-1">
          <ContactLine icon="phone" value={phone} accent={accent} text={sub} />
          <ContactLine icon="mail" value={email} accent={accent} text={sub} />
          <ContactLine icon="web" value={website} accent={accent} text={sub} />
        </div>
      </div>
    </div>
  );
}

// The printed target over the NFC chip, so guests know where to hold the phone.
function TapZone({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1.5 pb-3">
      {/* Sized relative to the card, about the footprint of the chip antenna */}
      <span
        className="grid aspect-square w-[22%] min-w-14 place-items-center rounded-full"
        style={{ border: `2px solid ${color}`, backgroundColor: `${color}14` }}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-1/2 w-1/2">
          <path
            d="M7 8.5a5 5 0 0 1 0 7M10.5 6a9 9 0 0 1 0 12M14 3.5a13 13 0 0 1 0 17"
            stroke={color}
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {label && (
        <span
          className="max-w-full truncate px-2 text-[0.7rem] font-bold uppercase tracking-wide"
          style={{ color }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// A faithful, live-updating recreation of the printed Google-review card.
// `guides` draws the dashed logo area, an on-screen aid that is never printed.
export function CardPreview({
  config,
  locale = "DE",
  guides = false,
}: {
  config: CardConfig;
  locale?: EditorLocale;
  guides?: boolean;
}) {
  const t = makeT(locale);
  const serif = config.font === "serif";
  const display = config.font === "display";
  const cardFont = FONT_STACKS[config.font];
  const shaped = config.headerShape !== "straight";
  const logoScale = config.logoScale ?? 1;
  const tapLabel =
    config.showTapZoneText === false ? "" : config.tapZoneText?.trim() || t(s.cardTapZone);

  // Headline weight/emphasis follows the chosen voice.
  const headlineStyle = {
    fontFamily: cardFont,
    fontWeight: serif ? 500 : display ? 800 : 700,
    fontStyle: serif ? "italic" : "normal",
    letterSpacing: display ? "-0.03em" : serif ? "0" : "-0.01em",
  } as const;

  const items = config.listItems
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const example = exampleText(config, t);
  const listItems = items.length ? items : example.listItems.split("\n");

  // Each card type has its own physical format (aspect ratio + relative size).
  const typeDef = CARD_TYPES.find((c) => c.key === config.cardType);
  const metal = config.cardType === "business";
  const finish = FINISHES.find((f) => f.key === config.finish) ?? FINISHES[0];
  const scale = typeDef?.previewScale ?? 1;
  const aspect = typeDef?.aspect ?? "5 / 6";

  return (
    <div className="w-full">
      <div
        className={`mx-auto w-full ${metal ? "rounded-[1.65rem] p-[3px] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]" : ""}`}
        style={{ maxWidth: 380 * scale, ...(metal ? { background: finish.ring } : {}) }}
      >
      <div
        className={`w-full overflow-hidden ${metal ? "rounded-[1.5rem]" : "rounded-[1.75rem]"} ${
          metal ? "border" : "border border-black/5 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.55)]"
        }`}
        style={{
          aspectRatio: aspect,
          ...(metal
            ? { background: finish.swatch, borderColor: finish.ring }
            : { backgroundColor: config.bodyColor }),
        }}
      >
        {metal ? (
          <MetalCardFace config={config} dark={config.finish === "black"} t={t} />
        ) : config.logoOnly ? (
          <div className="flex h-full flex-col p-4">
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl px-4 text-center"
                style={{ border: `2px dashed ${guides ? `${config.accentColor}66` : "transparent"}` }}
              >
                {config.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.logoDataUrl}
                    alt="logo"
                    className="min-h-0 object-contain"
                    style={{
                      maxHeight: `${Math.min(100, 70 * logoScale)}%`,
                      maxWidth: `${Math.min(100, 80 * logoScale)}%`,
                    }}
                  />
                ) : (
                  <>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="3" stroke={config.accentColor} strokeWidth="1.6" />
                      <circle cx="8.5" cy="8.5" r="1.8" stroke={config.accentColor} strokeWidth="1.4" />
                      <path d="M4 16l4.5-4 4 3.2L16 11l4 4.5" stroke={config.accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-xs" style={{ color: `${config.accentColor}cc` }}>
                      {t(s.defaultLogoHint)}
                    </p>
                  </>
                )}
              </div>
            </div>
            <TapZone color={config.accentColor} label={tapLabel} />
          </div>
        ) : (
        <div className="flex h-full flex-col p-4">
          {/* Header band */}
          <div className="shrink-0">
            <div
              className={`px-5 pt-4 text-center ${shaped ? "rounded-t-[1.25rem] pb-3" : "rounded-[1.25rem] pb-6"}`}
              style={{ backgroundColor: config.headerColor, color: config.headerTextColor }}
            >
              {config.showStars && (
                <div className="flex justify-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <svg key={i} width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                      <path d={STAR} fill={config.starColor} />
                    </svg>
                  ))}
                </div>
              )}
              <p
                className={`text-[1.05rem] leading-tight ${config.showStars ? "mt-2.5" : "mt-0"}`}
                style={headlineStyle}
              >
                {config.headline || example.headline}
              </p>
            </div>
            <HeaderEdge shape={config.headerShape} color={config.headerColor} />
          </div>

          {/* Body — one of three layouts */}
          {config.layout === "logo" && (
            <div className="flex min-h-0 flex-1 items-center justify-center py-4">
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl px-4 text-center"
                style={{ border: `2px dashed ${guides ? `${config.accentColor}66` : "transparent"}` }}
              >
                {config.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.logoDataUrl}
                    alt="logo"
                    className="min-h-0 object-contain"
                    style={{
                      maxHeight: `${Math.min(100, 62 * logoScale)}%`,
                      maxWidth: `${Math.min(100, 78 * logoScale)}%`,
                    }}
                  />
                ) : (
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke={config.accentColor} strokeWidth="1.6" />
                    <circle cx="8.5" cy="8.5" r="1.8" stroke={config.accentColor} strokeWidth="1.4" />
                    <path d="M4 16l4.5-4 4 3.2L16 11l4 4.5" stroke={config.accentColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {/* Without a logo these fill the placeholder; with one, only
                    what the customer typed is printed under it. */}
                {(!config.logoDataUrl || config.logoText) && (
                  <p
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: config.accentColor, fontFamily: cardFont, fontStyle: serif ? "italic" : "normal" }}
                  >
                    {config.logoText || t(s.defaultLogoText)}
                  </p>
                )}
                {(!config.logoDataUrl || config.logoHint) && (
                  <p className="text-xs" style={{ color: `${config.accentColor}cc` }}>
                    {config.logoHint || t(s.defaultLogoHint)}
                  </p>
                )}
              </div>
            </div>
          )}

          {config.layout === "text" && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-hidden px-3 py-4 text-center">
              {(config.logoDataUrl || config.logoText) &&
                (config.logoDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.logoDataUrl}
                    alt="logo"
                    className="mb-1 object-contain"
                    style={{
                      maxHeight: `${3.5 * logoScale}rem`,
                      maxWidth: `${Math.min(100, 60 * logoScale)}%`,
                    }}
                  />
                ) : (
                  <p
                    className="text-xs font-bold uppercase tracking-[0.16em]"
                    style={{ color: config.accentColor }}
                  >
                    {config.logoText}
                  </p>
                ))}
              <span
                className="-mb-2 text-3xl leading-none"
                style={{ color: config.accentColor, fontFamily: cardFont }}
                aria-hidden
              >
                &ldquo;
              </span>
              <p
                className="text-ink text-[1.35rem] leading-snug"
                style={{ ...headlineStyle, color: undefined }}
              >
                {config.bodyText || example.bodyText}
              </p>
            </div>
          )}

          {config.layout === "list" && (
            <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden px-2 py-3">
              <p
                className="text-center text-xs font-bold uppercase tracking-[0.16em]"
                style={{ color: config.accentColor, fontFamily: cardFont, fontStyle: serif ? "italic" : "normal" }}
              >
                {config.listTitle || example.listTitle}
              </p>
              <ul className="mx-auto flex w-full max-w-[15rem] flex-col gap-1.5">
                {listItems.slice(0, 6).map((row, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: config.accentColor }}
                    />
                    <span className="text-ink/85 flex-1 text-sm leading-tight" style={{ fontFamily: cardFont }}>
                      {row}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {config.showTapZone !== false && (
            <TapZone color={config.accentColor} label={tapLabel} />
          )}

          {/* Backup QR for phones without NFC */}
          {config.showQr && (
            <div
              className="mb-2 flex shrink-0 items-center justify-center gap-2.5 rounded-xl px-3 py-2"
              style={{ backgroundColor: `${config.accentColor}12` }}
            >
              <QrCode value={config.reviewUrl} fg={config.headerColor} />
              <div className="text-left">
                <p
                  className="text-[0.62rem] font-bold uppercase tracking-wide"
                  style={{ color: config.accentColor }}
                >
                  {t(s.cardQrTitle)}
                </p>
                <p className="text-ink/60 text-[0.62rem] leading-tight">
                  {t(s.cardQrHint)}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-2 pt-1 text-ink">
            {config.showGoogle && (
              <>
                <div className="flex items-center gap-1.5">
                  <GoogleG />
                  <span className="text-[0.62rem] font-semibold leading-tight text-ink/80">
                    {t(s.cardGoogleReview)}
                  </span>
                </div>
                <div className="h-6 w-px bg-black/10" />
              </>
            )}
            <div className="flex items-center gap-1.5">
              <TapGlyph color={config.accentColor} />
              <span className="text-[0.62rem] font-semibold leading-tight text-ink/80">
                {t(s.cardTap)}
              </span>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <span className="text-[0.5rem] uppercase tracking-wide text-ink/45">
                {t(s.cardPoweredBy)}
              </span>
              <Image
                src={lockupLogo}
                alt="Taplino"
                width={330}
                height={80}
                unoptimized
                className="h-3.5 w-auto"
              />
            </div>
          </div>
        </div>
        )}
      </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        {config.category ? `${config.category} · ` : ""}
        {typeDef
          ? `${t(typeDef.material)}${metal ? ` · ${t(finish.label)}` : ""} · ${t(typeDef.sizeLabel)}`
          : ""}
      </p>
    </div>
  );
}

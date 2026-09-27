"use client";

// GENERATED FILE, DO NOT EDIT. Copied from nfc-card-website/src/components/editor.
// Change it there, then run `pnpm sync:editor` in nfc-card-app.

// Cart views for the designer: the line list (checkout step) and the order
// summary with a "before you pay" checklist (sidebar).

import type { ReactNode } from "react";
import { CardPreview } from "./CardPreview";
import { Button, Arrow } from "./Button";
import { s } from "./strings";
import type { EditorLocale, Translate } from "./locale";
import { ISSUE_STEP, type CartItem, type ItemIssue } from "./cart-state";
import { FINISHES, type CardConfig } from "./types";

const chf = (n: number) => n.toLocaleString("de-CH", { maximumFractionDigits: 2 });

/** One priced, checked cart line, as computed by the editor. */
export type CartLine = {
  item: CartItem;
  name: string;
  basePrice: number;
  price: { off: number; unit: number; gross: number; total: number };
  issues: ItemIssue[];
  maxQty: number;
  editing: boolean;
};

export function issueText(t: Translate, issue: ItemIssue): string {
  switch (issue.kind) {
    case "unavailable":
      return t(s.issueUnavailable);
    case "stock":
      return t(s.issueStock).replace("{n}", String(issue.left));
    case "logo":
      return t(s.issueLogo);
    case "logoLost":
      return t(s.issueLogoLost);
    case "name":
      return t(s.issueName);
    case "qrLink":
      return t(s.issueQrLink);
  }
}

/** A short line that tells two designs apart in the cart. */
function describe(config: CardConfig, t: Translate): string {
  const finish =
    config.cardType === "business"
      ? t(FINISHES.find((f) => f.key === config.finish)?.label ?? FINISHES[0].label)
      : "";
  const title =
    config.cardType === "business"
      ? config.fullName || config.company
      : config.headline || config.logoText || config.category;
  return [finish, title].filter(Boolean).join(" · ");
}

// A miniature of the live preview. The preview is laid out at full width and
// scaled down, so it matches the big one exactly.
function Thumb({ config, locale }: { config: CardConfig; locale: EditorLocale }) {
  return (
    <div className="relative h-[92px] w-[76px] shrink-0 overflow-hidden rounded-xl bg-paper-2/60" aria-hidden>
      <div className="pointer-events-none absolute left-1/2 top-1.5 w-[380px] origin-top -translate-x-1/2 scale-[0.19]">
        <CardPreview config={config} locale={locale} />
      </div>
    </div>
  );
}

function QtyStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const btn =
    "grid h-7 w-7 place-items-center rounded-full border border-line text-base leading-none text-ink hover:border-ink";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} aria-label="−" onClick={() => onChange(Math.max(1, value - 1))}>
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
        className="w-14 rounded-lg border border-line bg-paper py-0.5 text-center text-sm font-semibold text-ink outline-none focus:border-ink"
      />
      <button type="button" className={btn} aria-label="+" onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

function LinkButton({
  onClick,
  children,
  tone = "ink",
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: "ink" | "muted";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-semibold transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 ${
        tone === "ink" ? "text-ink" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

export function CartLines({
  lines,
  locale,
  t,
  canAdd,
  onQty,
  onEdit,
  onDuplicate,
  onRemove,
}: {
  lines: CartLine[];
  locale: EditorLocale;
  t: Translate;
  canAdd: boolean;
  onQty: (id: string, qty: number) => void;
  onEdit: (id: string, step?: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {lines.map((line) => {
        const { item, issues } = line;
        const detail = describe(item.design, t);
        return (
          <li
            key={item.id}
            className={`flex gap-4 rounded-2xl border bg-paper p-3 ${
              issues.length ? "border-accent/50" : "border-line"
            }`}
          >
            <Thumb config={item.design} locale={locale} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {line.name}
                    {line.editing && (
                      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-accent">
                        {t(s.cartEditing)}
                      </span>
                    )}
                  </p>
                  {detail && <p className="mt-0.5 truncate text-xs text-muted">{detail}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-ink">CHF {chf(line.price.total)}</p>
                  <p className="text-[0.7rem] text-muted">
                    CHF {chf(line.price.unit)} {t(s.unitPrice)}
                    {line.price.off > 0 && ` · −${Math.round(line.price.off * 100)}%`}
                  </p>
                </div>
              </div>

              <div className="mt-2.5">
                <QtyStepper value={item.quantity} max={line.maxQty} onChange={(v) => onQty(item.id, v)} />
              </div>

              {issues.length > 0 && (
                <ul className="mt-2.5 space-y-1">
                  {issues.map((issue) => (
                    <li key={issue.kind} className="flex items-start gap-2 text-xs font-medium text-accent">
                      <span aria-hidden>●</span>
                      <span className="flex-1">{issueText(t, issue)}</span>
                      {issue.kind !== "stock" && (
                        <button
                          type="button"
                          onClick={() => onEdit(item.id, ISSUE_STEP[issue.kind])}
                          className="shrink-0 underline underline-offset-2 hover:text-ink"
                        >
                          {t(s.cartFix)}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-2.5 flex flex-wrap gap-4">
                <LinkButton onClick={() => onEdit(item.id)}>{t(s.cartEdit)}</LinkButton>
                <LinkButton onClick={() => onDuplicate(item.id)} disabled={!canAdd}>
                  {t(s.cartDuplicate)}
                </LinkButton>
                <LinkButton onClick={() => onRemove(item.id)} tone="muted">
                  {t(s.cartRemove)}
                </LinkButton>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function CartSummary({
  lines,
  t,
  missing,
  placing,
  busyLabel,
  errorText,
  footnote,
  onPay,
}: {
  lines: CartLine[];
  t: Translate;
  /** Human-readable list of what still blocks the payment. */
  missing: string[];
  placing: boolean;
  busyLabel: string;
  errorText: string | null;
  footnote: string;
  onPay: () => void;
}) {
  const gross = lines.reduce((sum, l) => sum + l.price.gross, 0);
  const total = lines.reduce((sum, l) => sum + l.price.total, 0);
  const cards = lines.reduce((sum, l) => sum + l.item.quantity, 0);

  return (
    <div className="rounded-card border border-line bg-paper-2/40 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{t(s.cartTitle)}</span>
        <span className="text-xs text-muted">{t(s.cartCards).replace("{n}", String(cards))}</span>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        {lines.map((l) => (
          <li key={l.item.id} className="flex justify-between gap-3">
            <span className="min-w-0 truncate text-ink-soft">
              {l.item.quantity} × {l.name}
            </span>
            <span className="shrink-0 font-medium text-ink">CHF {chf(l.price.total)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-line pt-4">
        <span className="text-xs text-muted">{t(s.total)}</span>
        <p className="display text-3xl text-ink">CHF {chf(total)}</p>
        {gross > total && (
          <p className="mt-0.5 text-xs font-medium text-accent">
            {t(s.youSave)} CHF {chf(gross - total)}{" "}
            <span className="text-muted line-through">CHF {chf(gross)}</span>
          </p>
        )}
      </div>

      {lines.length > 0 && (
        <div className="mt-4 rounded-xl border border-line bg-paper/60 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">{t(s.missingTitle)}</span>
          {missing.length === 0 ? (
            <p className="mt-1.5 text-xs font-medium text-ink">✓ {t(s.readyToPay)}</p>
          ) : (
            <ul className="mt-1.5 space-y-1">
              {missing.map((m) => (
                <li key={m} className="flex gap-2 text-xs font-medium text-accent">
                  <span aria-hidden>●</span>
                  {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Button onClick={onPay} disabled={placing || lines.length === 0} className="mt-4 w-full justify-center">
        {placing ? busyLabel : t(s.payNow)} <Arrow />
      </Button>

      {errorText && <p className="mt-3 text-sm font-medium text-accent">{errorText}</p>}
      <p className="mt-3 text-xs leading-relaxed text-muted">{footnote}</p>
    </div>
  );
}

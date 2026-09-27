"use client";

import { useState } from "react";
import { Languages } from "lucide-react";
import { Input, Textarea } from "./ui";
import { useBuilderServices } from "./builders/host";
import { LOCALE_LABELS } from "@/lib/i18n";
import { LOCALES, type Locale, type LocalizedText } from "@/lib/page-content";
import { cn } from "@/lib/utils";

/**
 * An input for a LocalizedText value: small language tabs (DE/EN/FR/IT) above a
 * single field that edits the active language. Used across the menu, link hub
 * and other builders so all public content stays multilingual.
 *
 * When the host provides a translator (see `builders/host.tsx`), a Translate
 * button fills the other languages from the active one in a single request.
 */
export function LocalizedInput({
  value,
  onChange,
  placeholder,
  multiline = false,
  className,
}: {
  value: LocalizedText;
  onChange: (next: LocalizedText) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const { translate } = useBuilderServices();
  const [active, setActive] = useState<Locale>("de");
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Field = multiline ? Textarea : Input;

  const source = value[active]?.trim() ?? "";
  const others = LOCALES.filter((loc) => loc !== active);
  const missing = others.filter((loc) => !value[loc]?.trim());
  // Fill the gaps first. Once every language has text, the button re-translates
  // all of them (e.g. after the source text changed).
  const targets = missing.length > 0 ? missing : others;

  async function runTranslate() {
    if (!translate || !source) return;
    setTranslating(true);
    setError(null);
    try {
      const result = await translate(source, active, targets);
      const next = { ...value };
      for (const loc of targets) {
        if (result[loc]?.trim()) next[loc] = result[loc];
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed, please try again");
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center gap-1">
        {LOCALES.map((loc) => {
          const filled = !!value[loc]?.trim();
          return (
            <button
              key={loc}
              type="button"
              onClick={() => setActive(loc)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase transition",
                active === loc ? "bg-ink text-paper" : "bg-ink/5 text-muted hover:bg-ink/10",
                filled && active !== loc && "text-ink",
              )}
              title={LOCALE_LABELS[loc]}
            >
              {loc}
              {filled && <span className="ml-1 text-accent">·</span>}
            </button>
          );
        })}
        {translate && source && (
          <button
            type="button"
            onClick={runTranslate}
            disabled={translating}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold text-accent transition hover:bg-accent/10 disabled:opacity-60"
            title={`Translate from ${LOCALE_LABELS[active]} into ${targets
              .map((loc) => LOCALE_LABELS[loc])
              .join(", ")}`}
          >
            <Languages className="size-3.5" />
            {translating ? "Translating…" : missing.length > 0 ? "Translate" : "Retranslate"}
          </button>
        )}
      </div>
      <Field
        value={value[active] ?? ""}
        placeholder={placeholder}
        disabled={translating}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange({ ...value, [active]: e.target.value })
        }
      />
      {error && <span className="mt-1 block text-xs text-negative">{error}</span>}
    </div>
  );
}

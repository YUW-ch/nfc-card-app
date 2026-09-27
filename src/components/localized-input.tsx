"use client";

import { useState } from "react";
import { Input, Textarea } from "./ui";
import { LOCALE_LABELS } from "@/lib/i18n";
import { LOCALES, type Locale, type LocalizedText } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * An input for a LocalizedText value: small language tabs (DE/EN/FR/IT) above a
 * single field that edits the active language. Used across the menu, link hub
 * and other builders so all public content stays multilingual.
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
  const [active, setActive] = useState<Locale>("de");
  const Field = multiline ? Textarea : Input;

  return (
    <div className={className}>
      <div className="mb-1.5 flex gap-1">
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
      </div>
      <Field
        value={value[active] ?? ""}
        placeholder={placeholder}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange({ ...value, [active]: e.target.value })
        }
      />
    </div>
  );
}

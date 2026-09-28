"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Check, Palette, Shapes, Trash2, Type, Image as ImageIcon } from "lucide-react";
import { Button, Card, Field, Input } from "@/components/ui";
import { LocalizedInput } from "@/components/localized-input";
import type {
  CornerStyle,
  FontId,
  HeaderAlign,
  LogoSize,
  PageTheme,
} from "@/lib/page-content";
import {
  BUILTIN_DESIGNS,
  DEFAULT_BRAND,
  FONTS,
  FONT_IDS,
  allFontsStylesheetHref,
  applyBuiltinDesign,
  isHexColor,
  resolveTheme,
} from "@/lib/page-theme";
import { cn } from "@/lib/utils";
import { useBuilderServices, type DesignTemplate } from "./host";
import { ImageField } from "./ImageField";

// ─── Small controls ───────────────────────────────────────────────────────────

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
        {icon}
      </span>
      <div>
        <p className="display text-lg text-ink">{title}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-ink/5 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
            value === o.value ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
          checked ? "bg-accent" : "bg-ink/15"
        }`}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

/** Colour swatch plus hex input. `auto` shows what an empty value resolves to. */
function ColorField({
  label,
  value,
  auto,
  onChange,
  hint,
}: {
  label: string;
  value?: string;
  auto: string;
  onChange: (v: string | undefined) => void;
  hint?: string;
}) {
  const shown = value && isHexColor(value) ? value : auto;
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHexColor(shown) ? shown : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1"
          aria-label={label}
        />
        <Input
          value={value ?? ""}
          placeholder={value ? undefined : `Auto (${auto})`}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-muted hover:bg-ink/5 hover:text-ink"
          >
            Auto
          </button>
        )}
      </div>
    </Field>
  );
}

function FontGrid({
  value,
  fonts,
  onChange,
}: {
  value: FontId;
  fonts: FontId[];
  onChange: (id: FontId) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {fonts.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={value === id}
          className={cn(
            "flex flex-col items-start rounded-xl border px-3 py-2 text-left transition",
            value === id ? "border-accent bg-accent-soft" : "border-line hover:border-ink/30",
          )}
        >
          <span className="text-xl leading-tight text-ink" style={{ fontFamily: FONTS[id].css }}>
            Aa Bistro
          </span>
          <span className="text-[11px] text-muted">{FONTS[id].label}</span>
        </button>
      ))}
    </div>
  );
}

/** A thumbnail of a design: its background, accent and heading font. */
function DesignSwatch({ theme, name, onClick, active }: { theme: PageTheme; name: string; onClick: () => void; active?: boolean }) {
  const t = resolveTheme(theme);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border text-left transition hover:-translate-y-0.5",
        active ? "border-accent ring-2 ring-accent/30" : "border-line",
      )}
    >
      <span
        className="flex h-16 items-end justify-between px-3 pb-2"
        style={{ background: t.backgroundColor, color: t.textColor }}
      >
        <span className="text-lg leading-none" style={{ fontFamily: FONTS[t.headingFont].css }}>
          Aa
        </span>
        <span className="h-3 w-8 rounded-full" style={{ background: t.brandColor }} />
      </span>
      <span className="truncate bg-white px-3 py-1.5 text-xs font-semibold text-ink">{name}</span>
    </button>
  );
}

// ─── Templates ────────────────────────────────────────────────────────────────

function Templates({
  theme,
  onChange,
  showSaved,
}: {
  theme: PageTheme;
  onChange: (t: PageTheme) => void;
  showSaved: boolean;
}) {
  const { templates: services } = useBuilderServices();
  const templates = showSaved ? services : undefined;
  const qc = useQueryClient();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const saved = useQuery({
    queryKey: templates?.queryKey ?? ["design-templates", "none"],
    queryFn: () => templates!.list(),
    enabled: !!templates,
  });
  const invalidate = () => templates && qc.invalidateQueries({ queryKey: templates.queryKey });

  const create = useMutation({
    mutationFn: () => templates!.create(name.trim(), theme),
    onSuccess: () => {
      setNaming(false);
      setName("");
      invalidate();
    },
  });
  const overwrite = useMutation({
    mutationFn: (t: DesignTemplate) => templates!.update(t.id, { theme }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => templates!.remove(id),
    onSuccess: invalidate,
  });
  const error = create.error ?? overwrite.error ?? remove.error;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Start from a look</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {BUILTIN_DESIGNS.map((d) => (
            <DesignSwatch
              key={d.id}
              theme={d.theme}
              name={d.name}
              onClick={() => onChange(applyBuiltinDesign(theme, d.theme))}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">Keeps your logo, cover, title and tagline.</p>
      </div>

      {templates && (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Your designs</p>
          {saved.data && saved.data.length > 0 ? (
            <div className="flex flex-col gap-2">
              {saved.data.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-white px-3 py-2"
                >
                  <span
                    className="size-8 shrink-0 rounded-lg border border-line"
                    style={{
                      background: `linear-gradient(135deg, ${resolveTheme(t.theme).backgroundColor} 55%, ${resolveTheme(t.theme).brandColor} 55%)`,
                    }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {t.name}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => onChange(t.theme)}>
                    Apply
                  </Button>
                  <button
                    type="button"
                    title="Replace this design with the current page design"
                    onClick={() => overwrite.mutate(t)}
                    className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink"
                  >
                    {overwrite.isSuccess && overwrite.variables?.id === t.id ? (
                      <Check className="size-4 text-positive" />
                    ) : (
                      <Bookmark className="size-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${t.name}`}
                    onClick={() => remove.mutate(t.id)}
                    className="rounded-full p-1.5 text-muted transition hover:bg-negative/10 hover:text-negative"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">
              Save this page&apos;s design to reuse it on your other pages.
            </p>
          )}

          {naming ? (
            <div className="mt-3 flex items-center gap-2">
              <Input
                autoFocus
                value={name}
                maxLength={60}
                placeholder="e.g. Summer menu"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && create.mutate()}
              />
              <Button size="sm" loading={create.isPending} disabled={!name.trim()} onClick={() => create.mutate()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setNaming(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setNaming(true)}>
              <Bookmark className="size-4" /> Save current design
            </Button>
          )}
          {error && <p className="mt-2 text-xs text-negative">{(error as Error).message}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

/**
 * Everything about how a page looks: templates, branding (logo, cover, title),
 * colours, typography and shape. Applies to every page kind.
 */
export function DesignPanel({
  theme,
  onChange,
  pageName,
  showSavedDesigns = true,
}: {
  theme: PageTheme;
  onChange: (theme: PageTheme) => void;
  pageName: string;
  /** Off when the panel edits a saved design itself rather than a page. */
  showSavedDesigns?: boolean;
}) {
  const t = resolveTheme(theme);
  const set = (patch: Partial<PageTheme>) => onChange({ ...theme, ...patch });

  return (
    <>
      {/* Loads every catalogue font so the pickers can show them. */}
      <link rel="stylesheet" href={allFontsStylesheetHref()} precedence="default" />

      <Card className="flex flex-col gap-5">
        <SectionTitle
          icon={<Palette className="size-4" />}
          title="Design"
          hint={
            showSavedDesigns
              ? "Pick a look, or reuse one of your saved designs."
              : "Start from a look, then make it your own."
          }
        />
        <Templates theme={theme} onChange={onChange} showSaved={showSavedDesigns} />
      </Card>

      <Card className="flex flex-col gap-5">
        <SectionTitle
          icon={<ImageIcon className="size-4" />}
          title="Branding"
          hint="Your logo, a cover photo and the title guests see first."
        />
        <Field label="Logo">
          <ImageField
            value={theme.logoUrl}
            onChange={(logoUrl) => set({ logoUrl })}
            maxSide={800}
            shape="logo"
            label="Upload logo"
          />
        </Field>
        {theme.logoUrl && (
          <Field label="Logo size">
            <Segmented<LogoSize>
              value={t.logoSize}
              onChange={(logoSize) => set({ logoSize })}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Medium" },
                { value: "lg", label: "Large" },
              ]}
            />
          </Field>
        )}
        <Field label="Cover photo" hint="A wide photo across the top, like your dining room or a signature dish.">
          <ImageField
            value={theme.coverUrl}
            onChange={(coverUrl) => set({ coverUrl })}
            maxSide={1800}
            label="Upload cover photo"
          />
        </Field>
        <Field label="Title" hint={`Leave empty to use "${pageName}".`}>
          <LocalizedInput
            value={theme.title ?? {}}
            onChange={(title) => set({ title })}
            placeholder={pageName}
          />
        </Field>
        <Field label="Tagline">
          <LocalizedInput
            value={theme.tagline ?? {}}
            onChange={(tagline) => set({ tagline })}
            placeholder="Fresh pasta since 1987"
          />
        </Field>
        <Switch
          label="Show title"
          checked={t.showTitle}
          onChange={(showTitle) => set({ showTitle })}
        />
        <Field label="Header alignment">
          <Segmented<HeaderAlign>
            value={t.headerAlign}
            onChange={(headerAlign) => set({ headerAlign })}
            options={[
              { value: "center", label: "Centered" },
              { value: "left", label: "Left" },
            ]}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-5">
        <SectionTitle
          icon={<Palette className="size-4" />}
          title="Colours"
          hint="Text and panels follow the background unless you set them."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label="Accent"
            hint="Buttons, prices and active tabs"
            value={theme.brandColor}
            auto={DEFAULT_BRAND}
            onChange={(brandColor) => set({ brandColor })}
          />
          <ColorField
            label="Background"
            value={isHexColor(theme.background) ? theme.background : undefined}
            auto={t.backgroundColor}
            onChange={(background) => set({ background })}
          />
          <ColorField
            label="Text"
            value={theme.textColor}
            auto={t.textColor}
            onChange={(textColor) => set({ textColor })}
          />
          <ColorField
            label="Panels"
            hint="Menu cards and link buttons"
            value={theme.surfaceColor}
            auto={t.backgroundColor}
            onChange={(surfaceColor) => set({ surfaceColor })}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-5">
        <SectionTitle
          icon={<Type className="size-4" />}
          title="Typography"
          hint="One font for headings, one for everything else."
        />
        <Field label="Headings">
          <FontGrid
            value={t.headingFont}
            fonts={FONT_IDS}
            onChange={(headingFont) => set({ headingFont })}
          />
        </Field>
        <Field label="Text">
          <FontGrid
            value={t.bodyFont}
            fonts={FONT_IDS.filter((id) => FONTS[id].bodyOk)}
            onChange={(bodyFont) => set({ bodyFont })}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-5">
        <SectionTitle
          icon={<Shapes className="size-4" />}
          title="Shape"
          hint="The corners of buttons, tabs and cards."
        />
        <Segmented<CornerStyle>
          value={t.corners}
          onChange={(corners) => set({ corners })}
          options={[
            { value: "pill", label: "Round" },
            { value: "rounded", label: "Soft" },
            { value: "square", label: "Sharp" },
          ]}
        />
      </Card>
    </>
  );
}

"use client";

import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  UtensilsCrossed,
  GripVertical,
  Flame,
  Leaf,
  Vegan,
} from "lucide-react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { LocalizedInput } from "@/components/localized-input";
import type { MenuContent, MenuItem, MenuSection, SpiceLevel } from "@/lib/page-content";
import { cn } from "@/lib/utils";
import { ImageField } from "./ImageField";

const CURRENCIES = ["CHF", "EUR", "USD"] as const;

export function emptyMenuContent(): MenuContent {
  return {
    currency: "CHF",
    sections: [{ id: crypto.randomUUID(), name: {}, items: [] }],
  };
}

function emptyItem(): MenuItem {
  return { id: crypto.randomUUID(), name: {}, description: {}, priceCents: 0, available: true };
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

/** Rappen → CHF string for the price input (empty when zero-with-no-edit). */
function centsToInput(cents: number): string {
  if (!cents) return "";
  return (cents / 100).toString();
}

export function MenuBuilder({
  value,
  onChange,
}: {
  value: MenuContent;
  onChange: (next: MenuContent) => void;
}) {
  const sections = value.sections ?? [];

  const setSections = (next: MenuSection[]) => onChange({ ...value, sections: next });

  const updateSection = (id: string, patch: Partial<MenuSection>) =>
    setSections(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const updateItem = (sectionId: string, itemId: string, patch: Partial<MenuItem>) =>
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
          : s,
      ),
    );

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <UtensilsCrossed className="size-4" />
          </span>
          <div>
            <p className="display text-lg text-ink">Menu</p>
            <p className="text-xs text-muted">Prices in {value.currency ?? "CHF"}.</p>
          </div>
        </div>
        <Field label="Currency" className="w-32">
          <Select
            value={value.currency ?? "CHF"}
            onChange={(e) => onChange({ ...value, currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      {sections.map((section, si) => (
        <Card key={section.id} className="flex flex-col gap-4 p-5">
          <div className="flex items-start gap-3">
            <GripVertical className="mt-3 size-4 shrink-0 text-muted/50" />
            <div className="flex-1">
              <Field label={`Section ${si + 1}`}>
                <LocalizedInput
                  value={section.name}
                  onChange={(v) => updateSection(section.id, { name: v })}
                  placeholder="Starters"
                />
              </Field>
            </div>
            <div className="mt-7 flex items-center gap-1">
              <button
                type="button"
                aria-label="Move section up"
                disabled={si === 0}
                onClick={() => setSections(move(sections, si, si - 1))}
                className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Move section down"
                disabled={si === sections.length - 1}
                onClick={() => setSections(move(sections, si, si + 1))}
                className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Remove section"
                onClick={() => setSections(sections.filter((s) => s.id !== section.id))}
                className="rounded-full p-1.5 text-muted transition hover:bg-negative/10 hover:text-negative"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-4">
            {section.items.length === 0 && (
              <p className="text-sm text-muted">No items yet in this section.</p>
            )}

            {section.items.map((item, ii) => {
              const available = item.available ?? true;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-line bg-paper/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Item {ii + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Move item up"
                        disabled={ii === 0}
                        onClick={() =>
                          updateSection(section.id, { items: move(section.items, ii, ii - 1) })
                        }
                        className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move item down"
                        disabled={ii === section.items.length - 1}
                        onClick={() =>
                          updateSection(section.id, { items: move(section.items, ii, ii + 1) })
                        }
                        className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Remove item"
                        onClick={() =>
                          updateSection(section.id, {
                            items: section.items.filter((x) => x.id !== item.id),
                          })
                        }
                        className="rounded-full p-1.5 text-muted transition hover:bg-negative/10 hover:text-negative"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Field label="Name">
                      <LocalizedInput
                        value={item.name}
                        onChange={(v) => updateItem(section.id, item.id, { name: v })}
                        placeholder="Bruschetta"
                      />
                    </Field>

                    <Field label="Description">
                      <LocalizedInput
                        value={item.description ?? {}}
                        onChange={(v) => updateItem(section.id, item.id, { description: v })}
                        placeholder="Grilled bread, tomato, basil"
                        multiline
                      />
                    </Field>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={`Price (${value.currency ?? "CHF"})`}>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.05"
                          placeholder="0.00"
                          value={centsToInput(item.priceCents)}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            updateItem(section.id, item.id, {
                              priceCents: Number.isFinite(n) ? Math.round(n * 100) : 0,
                            });
                          }}
                        />
                      </Field>
                      <Field label="Allergens" hint="Comma separated, e.g. gluten, nuts">
                        <Input
                          placeholder="gluten, nuts"
                          value={(item.allergens ?? []).join(", ")}
                          onChange={(e) =>
                            updateItem(section.id, item.id, {
                              allergens: e.target.value
                                .split(",")
                                .map((a) => a.trim())
                                .filter(Boolean),
                            })
                          }
                        />
                      </Field>
                    </div>

                    <Field label="Photo" hint="Optional">
                      <ImageField
                        value={item.imageUrl}
                        onChange={(imageUrl) => updateItem(section.id, item.id, { imageUrl })}
                        maxSide={1000}
                        shape="square"
                        label="Upload dish photo"
                      />
                    </Field>

                    <DietFields
                      item={item}
                      onChange={(patch) => updateItem(section.id, item.id, patch)}
                    />

                    <label className="flex items-center justify-between gap-4 pt-1">
                      <span className="text-sm font-semibold text-ink">Available</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={available}
                        onClick={() =>
                          updateItem(section.id, item.id, { available: !available })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                          available ? "bg-accent" : "bg-ink/15"
                        }`}
                      >
                        <span
                          className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
                            available ? "translate-x-5" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </div>
              );
            })}

            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() =>
                updateSection(section.id, { items: [...section.items, emptyItem()] })
              }
            >
              <Plus className="size-4" /> Add item
            </Button>
          </div>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={() =>
          setSections([...sections, { id: crypto.randomUUID(), name: {}, items: [] }])
        }
      >
        <Plus className="size-4" /> Add section
      </Button>
    </div>
  );
}

/** Vegetarian and vegan switches plus a 0 to 3 chili spice level for one dish. */
function DietFields({
  item,
  onChange,
}: {
  item: MenuItem;
  onChange: (patch: Partial<MenuItem>) => void;
}) {
  const spicy = item.spicy ?? 0;
  const chip = (on: boolean) =>
    cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
      on ? "border-transparent text-white" : "border-line text-muted hover:border-ink/30 hover:text-ink",
    );
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">Dietary</span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={!!item.vegetarian}
          onClick={() =>
            // Turning vegetarian off also clears vegan (vegan dishes are vegetarian).
            onChange(item.vegetarian ? { vegetarian: false, vegan: false } : { vegetarian: true })
          }
          className={chip(!!item.vegetarian)}
          style={item.vegetarian ? { background: "#2f8f4e" } : undefined}
        >
          <Leaf className="size-3.5" /> Vegetarian
        </button>
        <button
          type="button"
          aria-pressed={!!item.vegan}
          onClick={() =>
            onChange(item.vegan ? { vegan: false } : { vegan: true, vegetarian: true })
          }
          className={chip(!!item.vegan)}
          style={item.vegan ? { background: "#2f8f4e" } : undefined}
        >
          <Vegan className="size-3.5" /> Vegan
        </button>

        <span className="mx-1 h-5 w-px bg-line" />

        <div className="inline-flex rounded-full bg-ink/5 p-1" role="radiogroup" aria-label="Spice level">
          {([0, 1, 2, 3] as SpiceLevel[]).map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={spicy === level}
              title={["Not spicy", "Mild", "Spicy", "Very spicy"][level]}
              onClick={() => onChange({ spicy: level })}
              className={cn(
                "flex h-7 items-center gap-0.5 rounded-full px-2.5 text-xs font-semibold transition",
                spicy === level ? "bg-white shadow-sm" : "text-muted hover:text-ink",
              )}
              style={spicy === level && level > 0 ? { color: "#e0482d" } : undefined}
            >
              {level === 0
                ? "Not spicy"
                : Array.from({ length: level }, (_, i) => (
                    <Flame key={i} className="size-3.5 fill-current" />
                  ))}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

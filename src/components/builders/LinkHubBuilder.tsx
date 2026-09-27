"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, ArrowUp, ArrowDown, Link2, Share2, User, FileText } from "lucide-react";
import { Button, Card, Field, Input, Select } from "@/components/ui";
import { LocalizedInput } from "@/components/localized-input";
import type { LinkHubContent, LinkHubLink, PageKind } from "@/lib/page-content";
import { useBuilderServices, type PageOption } from "./host";

const KIND_LABELS: Record<PageKind, string> = {
  MENU: "Menu",
  REVIEW: "Review",
  LINKHUB: "Link hub",
  VCARD: "Contact",
  WIFI: "Wi-Fi",
};

const SOCIAL_PLATFORMS = ["instagram", "tiktok", "facebook", "x", "youtube", "website"] as const;

export function emptyLinkHubContent(): LinkHubContent {
  return { links: [], socials: [] };
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

export function LinkHubBuilder({
  value,
  onChange,
}: {
  value: LinkHubContent;
  onChange: (next: LinkHubContent) => void;
}) {
  const set = <K extends keyof LinkHubContent>(key: K, v: LinkHubContent[K]) =>
    onChange({ ...value, [key]: v });

  const links = value.links ?? [];
  const socials = value.socials ?? [];

  const updateLink = (id: string, patch: Partial<LinkHubLink>) =>
    set(
      "links",
      links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    );

  // The business's own pages, so the hub can open them like sub-pages.
  const { pages } = useBuilderServices();
  const pageList = useQuery({
    queryKey: pages?.queryKey ?? ["builder-pages", "none"],
    queryFn: () => pages!.list(),
    enabled: !!pages,
  });
  const pageOptions = pageList.data ?? [];

  const linkToPage = (link: LinkHubLink, page: PageOption | undefined) =>
    updateLink(link.id, {
      pageId: page?.id ?? "",
      url: page ? `/p/${page.slug}` : "",
      // A fresh link takes the page's name as its label.
      ...(page && !Object.values(link.label ?? {}).some(Boolean) && { label: { de: page.name } }),
    });

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <User className="size-4" />
          </span>
          <p className="display text-lg text-ink">Profile</p>
        </div>
        <Field label="Headline">
          <LocalizedInput
            value={value.headline ?? {}}
            onChange={(v) => set("headline", v)}
            placeholder="Follow us everywhere"
          />
        </Field>
        <Field label="Avatar URL" hint="A square logo or photo works best.">
          <Input
            type="url"
            placeholder="https://…/logo.png"
            value={value.avatarUrl ?? ""}
            onChange={(e) => set("avatarUrl", e.target.value)}
          />
        </Field>
      </Card>

      {/* Links */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Link2 className="size-4" />
            </span>
            <p className="display text-lg text-ink">Links</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {pages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  set("links", [
                    ...links,
                    { id: crypto.randomUUID(), label: {}, url: "", pageId: "" },
                  ])
                }
              >
                <FileText className="size-4" /> Add page
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                set("links", [
                  ...links,
                  { id: crypto.randomUUID(), label: {}, url: "" },
                ])
              }
            >
              <Plus className="size-4" /> Add link
            </Button>
          </div>
        </div>

        {links.length === 0 && (
          <p className="text-sm text-muted">No links yet. Add your first one above.</p>
        )}

        {links.map((l, i) => (
          <div key={l.id} className="rounded-2xl border border-line bg-paper/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Link {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => set("links", move(links, i, i - 1))}
                  className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === links.length - 1}
                  onClick={() => set("links", move(links, i, i + 1))}
                  className="rounded-full p-1.5 text-muted transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Remove link"
                  onClick={() => set("links", links.filter((x) => x.id !== l.id))}
                  className="rounded-full p-1.5 text-muted transition hover:bg-negative/10 hover:text-negative"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Field label="Label">
                <LocalizedInput
                  value={l.label}
                  onChange={(v) => updateLink(l.id, { label: v })}
                  placeholder="Book a table"
                />
              </Field>
              {pages && (
                <div className="flex w-fit rounded-full bg-ink/5 p-1 text-xs font-semibold">
                  {[
                    { page: false, label: "Web address" },
                    { page: true, label: "One of your pages" },
                  ].map((o) => {
                    const active = (l.pageId !== undefined) === o.page;
                    return (
                      <button
                        key={o.label}
                        type="button"
                        onClick={() =>
                          active
                            ? undefined
                            : updateLink(l.id, o.page ? { pageId: "", url: "" } : { pageId: undefined, url: "" })
                        }
                        className={`rounded-full px-3 py-1.5 transition ${
                          active ? "bg-white text-ink shadow-sm" : "text-muted"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                {l.pageId !== undefined ? (
                  <Field
                    label="Page"
                    hint={
                      pageOptions.find((p) => p.id === l.pageId)?.published === false
                        ? "This page is a draft. Guests only see it once it is published."
                        : undefined
                    }
                  >
                    <Select
                      value={l.pageId}
                      onChange={(e) => linkToPage(l, pageOptions.find((p) => p.id === e.target.value))}
                    >
                      <option value="">{pageList.isLoading ? "Loading pages…" : "Choose a page"}</option>
                      {pageOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {KIND_LABELS[p.kind]}
                          {p.published ? "" : " (draft)"}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : (
                  <Field label="URL">
                    <Input
                      type="url"
                      placeholder="https://…"
                      value={l.url}
                      onChange={(e) => updateLink(l.id, { url: e.target.value })}
                    />
                  </Field>
                )}
                <Field label="Icon" hint="Optional">
                  <Input
                    placeholder="calendar"
                    value={l.icon ?? ""}
                    onChange={(e) => updateLink(l.id, { icon: e.target.value })}
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {/* Socials */}
      <Card className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Share2 className="size-4" />
            </span>
            <p className="display text-lg text-ink">Social icons</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => set("socials", [...socials, { platform: "instagram", url: "" }])}
          >
            <Plus className="size-4" /> Add
          </Button>
        </div>

        {socials.length === 0 && <p className="text-sm text-muted">No social icons yet.</p>}

        {socials.map((s, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label="Platform" className="w-36 shrink-0">
              <Select
                value={s.platform}
                onChange={(e) =>
                  set(
                    "socials",
                    socials.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)),
                  )
                }
              >
                {SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="URL" className="flex-1">
              <Input
                type="url"
                placeholder="https://…"
                value={s.url}
                onChange={(e) =>
                  set(
                    "socials",
                    socials.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                  )
                }
              />
            </Field>
            <button
              type="button"
              aria-label="Remove social"
              onClick={() => set("socials", socials.filter((_, j) => j !== i))}
              className="mb-1.5 rounded-full p-2.5 text-muted transition hover:bg-negative/10 hover:text-negative"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

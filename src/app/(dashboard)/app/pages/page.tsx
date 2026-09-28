"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  UtensilsCrossed,
  Link2,
  Contact,
  Wifi,
  Plus,
  ChevronRight,
  LayoutGrid,
  Search,
  Palette,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import { formatPlanNames, usePermissions } from "@/lib/permissions";
import type { Page, PageKind, PageSummary } from "@/lib/types";
import type { PageTheme } from "@/lib/page-content";
import { FONTS, allFontsStylesheetHref, resolveTheme } from "@/lib/page-theme";
import { designTemplateServices } from "@/lib/design-templates";
import type { DesignTemplate } from "@/components/builders/host";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, EmptyState, Field, Input, Select, Spinner } from "@/components/ui";
import { Modal } from "@/components/modal";
import { UpgradeNotice, ViewOnlyNotice } from "@/components/gate";

const KINDS: {
  kind: PageKind;
  name: string;
  description: string;
  icon: typeof Star;
}[] = [
  { kind: "REVIEW", name: "Review", description: "Collect Google reviews with smart routing.", icon: Star },
  { kind: "MENU", name: "Menu", description: "A multilingual menu with sections and prices.", icon: UtensilsCrossed },
  { kind: "LINKHUB", name: "Link hub", description: "One page for every link and social profile.", icon: Link2 },
  { kind: "VCARD", name: "Contact card", description: "Share contact details, saved in one tap.", icon: Contact },
  { kind: "WIFI", name: "Wifi", description: "Let guests join your network by tapping.", icon: Wifi },
];

const KIND_META: Record<PageKind, { name: string; icon: typeof Star }> = {
  REVIEW: { name: "Review", icon: Star },
  MENU: { name: "Menu", icon: UtensilsCrossed },
  LINKHUB: { name: "Link hub", icon: Link2 },
  VCARD: { name: "Contact card", icon: Contact },
  WIFI: { name: "Wifi", icon: Wifi },
};

export default function PagesPage() {
  const companyId = useCompanyId();
  const { canManage, pagesActive, planLoading, planName, plansWith } = usePermissions();
  // Pages are part of the plan, or staff turned them on for this business.
  const canCreate = canManage && pagesActive;
  const upgradePlans = plansWith("createPages");
  const router = useRouter();
  const qc = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<PageKind>("REVIEW");
  const [name, setName] = useState("");
  const [designId, setDesignId] = useState<string | null>(null);

  const templates = useMemo(() => designTemplateServices(companyId), [companyId]);
  const { data: designs } = useQuery({
    queryKey: templates.queryKey,
    queryFn: templates.list,
  });
  const chosenDesign = designs?.find((d) => d.id === designId);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["pages", companyId],
    queryFn: () => api.get<PageSummary[]>(`/companies/${companyId}/pages`),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<Page>(`/companies/${companyId}/pages`, {
        kind,
        name: name.trim(),
        ...(chosenDesign && { theme: chosenDesign.theme }),
      }),
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ["pages", companyId] });
      router.push(`/app/pages/${page.id}`);
    },
  });

  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<PageKind | "">("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<PageKind, PageSummary[]>();
    for (const p of pages ?? []) {
      if (kindFilter && p.kind !== kindFilter) continue;
      if (q && !p.name.toLowerCase().includes(q) && !p.slug.toLowerCase().includes(q)) continue;
      const list = map.get(p.kind) ?? [];
      list.push(p);
      map.set(p.kind, list);
    }
    return map;
  }, [pages, search, kindFilter]);

  const openCreate = () => {
    setKind("REVIEW");
    setName("");
    setDesignId(null);
    setCreating(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Pages"
        description="Build the pages your NFC cards point to."
        actions={
          canManage &&
          pagesActive && (
            <>
              <Link href="/app/pages/designs/new">
                <Button variant="outline">
                  <Palette className="size-4" /> New design
                </Button>
              </Link>
              {canCreate && (
                <Button onClick={openCreate}>
                  <Plus className="size-4" /> New page
                </Button>
              )}
            </>
          )
        }
      />

      {!canManage && <ViewOnlyNotice className="mb-6" />}
      {!pagesActive && !planLoading && (
        <UpgradeNotice
          className="mb-6"
          title={
            planName ? `Your ${planName} plan does not include pages` : "Pages are not in your plan"
          }
          description={
            upgradePlans.length > 0
              ? `Your pages are saved but offline, and cards that point to them open taplino.ch. Upgrade to ${formatPlanNames(upgradePlans)} to edit and publish them again, or contact us at hello@taplino.ch.`
              : "Your pages are saved but offline, and cards that point to them open taplino.ch. Contact us at hello@taplino.ch to bring them back."
          }
        />
      )}

      {designs && designs.length > 0 && (
        <section className="mb-10">
          {/* Loads the catalogue fonts so each thumbnail shows its heading font. */}
          <link rel="stylesheet" href={allFontsStylesheetHref()} precedence="default" />
          <div className="mb-3 flex items-center gap-2">
            <Palette className="size-4 text-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Designs</h2>
            <span className="text-xs text-muted">({designs.length})</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {designs.map((d) => (
              <Link key={d.id} href={`/app/pages/designs/${d.id}`}>
                <DesignThumb design={d} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (pages?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-8" />}
          title="No pages yet"
          description={
            canCreate
              ? "Create your first page and connect it to a card."
              : "No pages have been built for this business yet."
          }
          action={
            canCreate && (
              <Button onClick={openCreate}>
                <Plus className="size-4" /> New page
              </Button>
            )
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pages"
                aria-label="Search pages"
                className="pl-10"
              />
            </div>
            <Select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as PageKind | "")}
              aria-label="Filter by type"
            >
              <option value="">All types</option>
              {KINDS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.name}
                </option>
              ))}
            </Select>
          </div>
          {grouped.size === 0 && (
            <p className="py-10 text-center text-sm text-muted">No pages match your search.</p>
          )}
          {KINDS.filter((k) => grouped.has(k.kind)).map((k) => {
            const list = grouped.get(k.kind)!;
            const Icon = k.icon;
            return (
              <section key={k.kind}>
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="size-4 text-accent" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    {k.name}
                  </h2>
                  <span className="text-xs text-muted">({list.length})</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((p) => (
                    <PageRow key={p.id} page={p} offline={!pagesActive} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New page"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button
              loading={create.isPending}
              disabled={!name.trim()}
              onClick={() => create.mutate()}
            >
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-ink">Type</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {KINDS.map((k) => {
                const Icon = k.icon;
                const active = kind === k.kind;
                return (
                  <button
                    key={k.kind}
                    type="button"
                    onClick={() => setKind(k.kind)}
                    className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-accent bg-accent-soft"
                        : "border-line bg-paper/40 hover:border-ink/30"
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        active ? "bg-accent text-white" : "bg-ink/5 text-ink"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{k.name}</span>
                      <span className="block text-xs leading-snug text-muted">{k.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {designs && designs.length > 0 && (
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-ink">Design</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => setDesignId(null)} className="text-left">
                  <DesignThumb design={{ name: "Default", theme: {} }} active={!designId} />
                </button>
                {designs.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDesignId(d.id)}
                    className="text-left"
                  >
                    <DesignThumb design={d} active={designId === d.id} />
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Copies its colours, fonts, logo and cover. You can change them later.
              </p>
            </div>
          )}

          <Field label="Name">
            <Input
              autoFocus
              placeholder="e.g. Lunch menu"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) create.mutate();
              }}
            />
          </Field>

          {create.isError && (
            <p className="text-sm text-negative">
              {(create.error as Error).message || "Could not create the page."}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

/** A small preview of a saved design: background, accent, heading font and logo. */
function DesignThumb({
  design,
  active,
}: {
  design: Pick<DesignTemplate, "name"> & { theme: PageTheme };
  active?: boolean;
}) {
  const t = resolveTheme(design.theme);
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border transition hover:-translate-y-0.5",
        active ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-ink/25",
      )}
    >
      <div
        className="flex h-20 items-end justify-between gap-2 bg-cover bg-center px-3 pb-2.5"
        style={{
          backgroundColor: t.backgroundColor,
          color: t.textColor,
          backgroundImage: t.coverUrl
            ? `linear-gradient(to top, ${t.backgroundColor}, transparent 70%), url("${t.coverUrl}")`
            : undefined,
        }}
      >
        {t.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.logoUrl} alt="" className="h-8 max-w-[60%] object-contain" />
        ) : (
          <span className="text-2xl leading-none" style={{ fontFamily: FONTS[t.headingFont].css }}>
            Aa
          </span>
        )}
        <span className="h-3 w-8 shrink-0 rounded-full" style={{ background: t.brandColor }} />
      </div>
      <span className="truncate bg-white px-3 py-2 text-xs font-semibold text-ink">
        {design.name}
      </span>
      {active && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-accent text-white">
          <Check className="size-3" />
        </span>
      )}
    </div>
  );
}

function PageRow({ page, offline }: { page: PageSummary; offline: boolean }) {
  const Icon = KIND_META[page.kind].icon;
  return (
    <Link href={`/app/pages/${page.id}`}>
      <Card className="group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_16px_40px_-24px_rgba(0,0,0,0.4)]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{page.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="neutral">{KIND_META[page.kind].name}</Badge>
            {offline ? (
              <Badge tone="muted">Offline</Badge>
            ) : page.published ? (
              <Badge tone="positive">Published</Badge>
            ) : (
              <Badge tone="muted">Draft</Badge>
            )}
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
      </Card>
    </Link>
  );
}

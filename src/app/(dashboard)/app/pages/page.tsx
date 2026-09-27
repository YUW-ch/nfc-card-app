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
} from "lucide-react";
import { api } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import type { Page, PageKind, PageSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, EmptyState, Field, Input, Spinner } from "@/components/ui";
import { Modal } from "@/components/modal";

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
  const router = useRouter();
  const qc = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [kind, setKind] = useState<PageKind>("REVIEW");
  const [name, setName] = useState("");

  const { data: pages, isLoading } = useQuery({
    queryKey: ["pages", companyId],
    queryFn: () => api.get<PageSummary[]>(`/companies/${companyId}/pages`),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post<Page>(`/companies/${companyId}/pages`, { kind, name: name.trim() }),
    onSuccess: (page) => {
      qc.invalidateQueries({ queryKey: ["pages", companyId] });
      router.push(`/app/pages/${page.id}`);
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<PageKind, PageSummary[]>();
    for (const p of pages ?? []) {
      const list = map.get(p.kind) ?? [];
      list.push(p);
      map.set(p.kind, list);
    }
    return map;
  }, [pages]);

  const openCreate = () => {
    setKind("REVIEW");
    setName("");
    setCreating(true);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Pages"
        description="Build the pages your NFC cards point to."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" /> New page
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (pages?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<LayoutGrid className="size-8" />}
          title="No pages yet"
          description="Create your first page and connect it to a card."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" /> New page
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-8">
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
                    <PageRow key={p.id} page={p} />
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

function PageRow({ page }: { page: PageSummary }) {
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
            {page.published ? (
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

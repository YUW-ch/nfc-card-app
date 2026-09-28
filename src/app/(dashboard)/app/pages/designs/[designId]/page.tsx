"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import { designTemplateServices } from "@/lib/design-templates";
import type { PageContent, PageKind, PageTheme } from "@/lib/page-content";
import { Button, Card, EmptyState, Input, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { UpgradeNotice, ViewOnlyNotice } from "@/components/gate";
import { BuilderServicesProvider, type BuilderServices } from "@/components/builders/host";
import { DesignPanel } from "@/components/builders/DesignPanel";
import { PagePreview } from "@/components/builders/PagePreview";
import { cn } from "@/lib/utils";

/** Example pages the preview renders the design on. */
const SAMPLES: { kind: PageKind; label: string; content: PageContent }[] = [
  {
    kind: "MENU",
    label: "Menu",
    content: {
      currency: "CHF",
      sections: [
        {
          id: "starters",
          name: { en: "Starters", de: "Vorspeisen" },
          items: [
            {
              id: "burrata",
              name: { en: "Burrata", de: "Burrata" },
              description: { en: "Tomatoes, basil, olive oil", de: "Tomaten, Basilikum, Olivenöl" },
              priceCents: 1650,
              vegetarian: true,
            },
            {
              id: "carpaccio",
              name: { en: "Beef carpaccio", de: "Rindscarpaccio" },
              description: { en: "Rocket, parmesan, lemon", de: "Rucola, Parmesan, Zitrone" },
              priceCents: 1900,
            },
          ],
        },
        {
          id: "mains",
          name: { en: "Mains", de: "Hauptgerichte" },
          items: [
            {
              id: "tagliatelle",
              name: { en: "Tagliatelle al ragù", de: "Tagliatelle al ragù" },
              description: { en: "Slow cooked beef ragù", de: "Langsam geschmortes Rindsragout" },
              priceCents: 2600,
            },
            {
              id: "risotto",
              name: { en: "Mushroom risotto", de: "Pilzrisotto" },
              priceCents: 2800,
              vegan: true,
            },
          ],
        },
      ],
    },
  },
  {
    kind: "LINKHUB",
    label: "Link hub",
    content: {
      headline: { en: "Everything in one place", de: "Alles an einem Ort" },
      links: [
        { id: "book", label: { en: "Book a table", de: "Tisch reservieren" }, url: "https://example.com" },
        { id: "menu", label: { en: "Our menu", de: "Unsere Karte" }, url: "https://example.com" },
        { id: "gift", label: { en: "Gift vouchers", de: "Gutscheine" }, url: "https://example.com" },
      ],
      socials: [
        { platform: "instagram", url: "https://instagram.com" },
        { platform: "facebook", url: "https://facebook.com" },
      ],
    },
  },
  {
    kind: "REVIEW",
    label: "Review",
    content: { provider: "google", reviewUrl: "https://example.com", threshold: 4 },
  },
];

/**
 * Create or edit a saved design (`/app/pages/designs/new` or `/<id>`). New pages
 * can start from it, and every page can apply it from its design panel.
 */
export default function DesignEditor() {
  const { designId } = useParams<{ designId: string }>();
  const isNew = designId === "new";
  const companyId = useCompanyId();
  const { canManage: isManager, pagesActive } = usePermissions();
  // Designs are part of pages: read-only when pages are not in the plan.
  const canManage = isManager && pagesActive;
  const router = useRouter();
  const qc = useQueryClient();
  const templates = useMemo(() => designTemplateServices(companyId), [companyId]);

  const { data: list, isLoading } = useQuery({
    queryKey: templates.queryKey,
    queryFn: templates.list,
    enabled: !isNew,
  });
  const stored = list?.find((t) => t.id === designId);

  const [name, setName] = useState("");
  const [theme, setTheme] = useState<PageTheme>({});
  const [seeded, setSeeded] = useState(isNew);
  const [sample, setSample] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!stored || seeded) return;
    setName(stored.name);
    setTheme(stored.theme ?? {});
    setSeeded(true);
  }, [stored, seeded]);

  const dirty =
    isNew ||
    (!!stored &&
      (name !== stored.name || JSON.stringify(theme) !== JSON.stringify(stored.theme ?? {})));

  const save = useMutation({
    mutationFn: () =>
      isNew
        ? templates.create(name.trim(), theme)
        : templates.update(designId, { name: name.trim(), theme }),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: templates.queryKey });
      if (isNew) router.replace(`/app/pages/designs/${saved.id}`);
    },
  });

  const remove = useMutation({
    mutationFn: () => templates.remove(designId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: templates.queryKey });
      router.push("/app/pages");
    },
  });

  // Designs have no page to translate for, so only uploads are offered.
  const services = useMemo<BuilderServices>(
    () =>
      canManage
        ? {
            uploadImage: (file) =>
              api
                .upload<{ url: string }>(`/companies/${companyId}/uploads`, file)
                .then((r) => r.url),
          }
        : {},
    [companyId, canManage],
  );

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!isNew && !stored) {
    return (
      <EmptyState
        title="Design not found"
        description="It may have been deleted."
        action={
          <Link href="/app/pages">
            <Button variant="outline">Back to pages</Button>
          </Link>
        }
      />
    );
  }

  const previewName = name.trim() || "Your business";
  const current = SAMPLES[sample];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4">
        <Link
          href="/app/pages"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" /> All pages
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="eyebrow text-accent">{isNew ? "New design" : "Design"}</span>
            <Input
              autoFocus={isNew}
              value={name}
              maxLength={60}
              readOnly={!canManage}
              placeholder="e.g. Summer menu"
              onChange={(e) => setName(e.target.value)}
              className="mt-2 max-w-xs text-lg font-semibold"
              aria-label="Design name"
            />
          </div>

          {canManage && (
            <div className="flex flex-wrap items-center gap-3">
              {!isNew && (
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-4" /> Delete
                </Button>
              )}
              <Button
                size="sm"
                loading={save.isPending}
                disabled={!dirty || !name.trim()}
                onClick={() => save.mutate()}
              >
                {!dirty && !save.isPending ? (
                  <>
                    <Check className="size-4" /> Saved
                  </>
                ) : isNew ? (
                  "Create design"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          )}
        </div>

        {!isManager && <ViewOnlyNotice />}
        {isManager && !pagesActive && (
          <UpgradeNotice
            title="Pages are not in your plan"
            description="Your designs are saved. Upgrade your plan in Settings to change them."
          />
        )}
        {save.isError && (
          <p className="text-sm text-negative">
            {(save.error as Error).message || "Could not save the design."}
          </p>
        )}
      </div>

      <BuilderServicesProvider services={services}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <fieldset disabled={!canManage} className="flex min-w-0 flex-col gap-6">
            <Card className="text-sm text-muted">
              Colours, fonts, logo and cover photo saved here are copied onto every new page
              you start from this design. Changing the design later does not change existing
              pages.
            </Card>
            <DesignPanel
              theme={theme}
              onChange={setTheme}
              pageName={previewName}
              showSavedDesigns={false}
            />
          </fieldset>

          <div className="flex flex-col items-center gap-4 lg:sticky lg:top-6 lg:h-fit">
            <div className="inline-flex rounded-full bg-ink/5 p-1">
              {SAMPLES.map((s, i) => (
                <button
                  key={s.kind}
                  type="button"
                  onClick={() => setSample(i)}
                  aria-pressed={sample === i}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    sample === i ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <PagePreview
              kind={current.kind}
              name={previewName}
              content={current.content}
              theme={theme}
            />
          </div>
        </div>
      </BuilderServicesProvider>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="Delete this design?"
        description="Pages that already use it keep their look."
      />
    </div>
  );
}

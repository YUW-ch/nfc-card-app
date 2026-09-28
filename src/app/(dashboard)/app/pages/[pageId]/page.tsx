"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Check, Copy, Trash2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import type { Location, Page, PageContent, PageTheme } from "@/lib/types";
import type { LocalizedText } from "@/lib/page-content";
import { Badge, Button, Card, Input, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { UpgradeNotice, ViewOnlyNotice } from "@/components/gate";
import { WifiGuests, type WifiGuest } from "@/components/builders/WifiGuests";
import { seedContent } from "@/components/builders/PageContentEditor";
import { PageWorkspace } from "@/components/builders/PageWorkspace";
import type { BuilderServices, PageOption } from "@/components/builders/host";
import { designTemplateServices } from "@/lib/design-templates";

export default function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const companyId = useCompanyId();
  const { canManage, pagesActive } = usePermissions();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", companyId, pageId],
    queryFn: () => api.get<Page>(`/companies/${companyId}/pages/${pageId}`),
  });
  const { data: locations } = useQuery({
    queryKey: ["locations", companyId],
    queryFn: () => api.get<Location[]>(`/companies/${companyId}/locations`),
  });

  // Read-only (never deleted) when pages are not in the plan, or the page sits
  // on a location over the plan's limit. The API enforces the same.
  const lockedLocation = locations?.find((l) => l.id === page?.locationId && l.readOnly);
  const canEdit = canManage && pagesActive && !lockedLocation;

  // Local draft state (only PATCHed on Save).
  const [name, setName] = useState("");
  const [published, setPublished] = useState(false);
  const [content, setContent] = useState<PageContent>({});
  const [theme, setTheme] = useState<PageTheme>({});
  const [seeded, setSeeded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // What the shared builders call. Roles and the monthly translation limit are
  // enforced by these endpoints.
  const services = useMemo<BuilderServices>(() => {
    return {
      translate: (text, from, to) =>
        api
          .post<{ translations: LocalizedText }>(`/companies/${companyId}/translate`, {
            pageId,
            text,
            from,
            to,
          })
          .then((res) => res.translations),
      uploadImage: (file) =>
        api.upload<{ url: string }>(`/companies/${companyId}/uploads`, file).then((r) => r.url),
      // Every other page, for the link hub's page picker.
      pages: {
        queryKey: ["pages", companyId, "options"],
        list: () =>
          api
            .get<PageOption[]>(`/companies/${companyId}/pages`)
            .then((all) => all.filter((p) => p.id !== pageId)),
      },
      templates: designTemplateServices(companyId),
    };
  }, [companyId, pageId]);

  // Seed the draft once the page arrives.
  useEffect(() => {
    if (!page || seeded) return;
    setName(page.name);
    setPublished(page.published);
    setContent(seedContent(page.kind, page.content));
    setTheme(page.theme ?? {});
    setSeeded(true);
  }, [page, seeded]);

  const dirty = useMemo(() => {
    if (!page || !seeded) return false;
    return (
      name !== page.name ||
      published !== page.published ||
      JSON.stringify(content) !== JSON.stringify(seedContent(page.kind, page.content)) ||
      JSON.stringify(theme) !== JSON.stringify(page.theme ?? {})
    );
  }, [page, seeded, name, published, content, theme]);

  const save = useMutation({
    mutationFn: () =>
      api.patch<Page>(`/companies/${companyId}/pages/${pageId}`, {
        name: name.trim(),
        published,
        content,
        theme,
      }),
    onSuccess: (updated) => {
      qc.setQueryData(["page", companyId, pageId], updated);
      qc.invalidateQueries({ queryKey: ["pages", companyId] });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.delete<void>(`/companies/${companyId}/pages/${pageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pages", companyId] });
      router.push("/app/pages");
    },
  });

  const publicUrl = page ? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/p/${page.slug}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  if (isLoading || !seeded || !page) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="mb-6 flex flex-col gap-4">
        <Link
          href="/app/pages"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-4" /> All pages
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Input
              value={name}
              readOnly={!canEdit}
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs text-lg font-semibold"
              aria-label="Page name"
            />
            <Badge tone="neutral">{page.kind}</Badge>
          </div>

          {canEdit ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                <button
                  type="button"
                  role="switch"
                  aria-checked={published}
                  onClick={() => setPublished((p) => !p)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    published ? "bg-positive" : "bg-ink/15"
                  }`}
                >
                  <span
                    className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
                      published ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
                {published ? "Published" : "Draft"}
              </label>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete page"
              >
                <Trash2 className="size-4" /> Delete
              </Button>

              <Button
                size="sm"
                loading={save.isPending}
                disabled={!dirty}
                onClick={() => save.mutate()}
              >
                {!dirty && !save.isPending ? (
                  <>
                    <Check className="size-4" /> Saved
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          ) : (
            <Badge tone={!pagesActive ? "muted" : page.published ? "positive" : "muted"}>
              {!pagesActive ? "Offline" : page.published ? "Published" : "Draft"}
            </Badge>
          )}
        </div>

        {!canManage && <ViewOnlyNotice />}
        {canManage && !pagesActive && (
          <UpgradeNotice
            title="Pages are not in your plan"
            description="This page is saved but offline, and cards that point to it open taplino.ch. Upgrade your plan in Settings to edit and publish it again."
          />
        )}
        {canManage && pagesActive && lockedLocation && (
          <UpgradeNotice
            title={`${lockedLocation.name} is read-only`}
            description="This location is over your plan's limit. The page stays live. Make the location active in Locations, or upgrade, to change it."
          />
        )}

        {save.isError && (
          <p className="text-sm text-negative">
            {(save.error as Error).message || "Could not save changes."}
          </p>
        )}
      </div>

      {/* Public link card */}
      <Card className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white p-1.5 ring-1 ring-line">
            <QRCodeCanvas value={publicUrl || " "} size={64} fgColor="#14120f" bgColor="#ffffff" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Public link</p>
            <p className="truncate text-sm text-ink">{publicUrl || "Not available"}</p>
            {!published && (
              <p className="mt-0.5 text-xs text-muted">Publish the page to make it live.</p>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="size-4" /> Open
              </Button>
            </a>
          )}
        </div>
      </Card>

      <PageWorkspace
        kind={page.kind}
        name={name || page.name}
        content={content}
        onContentChange={setContent}
        theme={theme}
        onThemeChange={setTheme}
        canEdit={canEdit}
        services={services}
      />

      {page.kind === "WIFI" && (
        <WifiGuests
          queryKey={["wifi-guests", companyId, pageId]}
          list={() => api.get<WifiGuest[]>(`/companies/${companyId}/pages/${pageId}/wifi-guests`)}
          remove={
            canManage
              ? (guestId) =>
                  api.delete(`/companies/${companyId}/pages/${pageId}/wifi-guests/${guestId}`)
              : undefined
          }
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => remove.mutate()}
        loading={remove.isPending}
        title="Delete this page?"
        description="This cannot be undone. Any card pointing here will need a new page."
      />
    </div>
  );
}

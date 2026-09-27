"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, Check, Copy, Trash2, ExternalLink, Palette } from "lucide-react";
import { api } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import type {
  LinkHubContent,
  MenuContent,
  Page,
  PageContent,
  PageTheme,
  ReviewContent,
  VCardContent,
  WifiContent,
} from "@/lib/types";
import { Badge, Button, Card, Field, Input, Spinner } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { ReviewBuilder, emptyReviewContent } from "@/components/builders/ReviewBuilder";
import { MenuBuilder, emptyMenuContent } from "@/components/builders/MenuBuilder";
import { LinkHubBuilder, emptyLinkHubContent } from "@/components/builders/LinkHubBuilder";
import { VCardBuilder, emptyVCardContent } from "@/components/builders/VCardBuilder";
import { WifiBuilder, emptyWifiContent } from "@/components/builders/WifiBuilder";
import { PagePreview } from "@/components/builders/PagePreview";

const DEFAULT_BRAND = "#f0431f";

/** Seed a builder's content from the loaded page, filling missing fields. */
function seedContent(page: Page): PageContent {
  const raw = (page.content ?? {}) as Record<string, unknown>;
  const isEmpty = Object.keys(raw).length === 0;
  switch (page.kind) {
    case "REVIEW":
      return isEmpty
        ? emptyReviewContent()
        : { ...emptyReviewContent(), ...(raw as unknown as ReviewContent) };
    case "MENU": {
      const c = raw as Partial<MenuContent>;
      return { currency: c.currency ?? "CHF", sections: c.sections ?? emptyMenuContent().sections };
    }
    case "LINKHUB": {
      const c = raw as Partial<LinkHubContent>;
      return { headline: c.headline, avatarUrl: c.avatarUrl, links: c.links ?? [], socials: c.socials ?? [] };
    }
    case "VCARD":
      return { ...emptyVCardContent(), ...(raw as unknown as VCardContent) };
    case "WIFI":
      return { ...emptyWifiContent(), ...(raw as unknown as WifiContent) };
    default:
      return raw;
  }
}

export default function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>();
  const companyId = useCompanyId();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", companyId, pageId],
    queryFn: () => api.get<Page>(`/companies/${companyId}/pages/${pageId}`),
  });

  // Local draft state (only PATCHed on Save).
  const [name, setName] = useState("");
  const [published, setPublished] = useState(false);
  const [content, setContent] = useState<PageContent>({});
  const [theme, setTheme] = useState<PageTheme>({});
  const [seeded, setSeeded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Seed the draft once the page arrives.
  useEffect(() => {
    if (!page || seeded) return;
    setName(page.name);
    setPublished(page.published);
    setContent(seedContent(page));
    setTheme(page.theme ?? {});
    setSeeded(true);
  }, [page, seeded]);

  const dirty = useMemo(() => {
    if (!page || !seeded) return false;
    return (
      name !== page.name ||
      published !== page.published ||
      JSON.stringify(content) !== JSON.stringify(seedContent(page)) ||
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
              onChange={(e) => setName(e.target.value)}
              className="max-w-xs text-lg font-semibold"
              aria-label="Page name"
            />
            <Badge tone="neutral">{page.kind}</Badge>
          </div>

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
        </div>

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

      {/* Two columns */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-6">
          {page.kind === "REVIEW" && (
            <ReviewBuilder
              value={content as ReviewContent}
              onChange={(v) => setContent(v)}
            />
          )}
          {page.kind === "MENU" && (
            <MenuBuilder value={content as MenuContent} onChange={(v) => setContent(v)} />
          )}
          {page.kind === "LINKHUB" && (
            <LinkHubBuilder value={content as LinkHubContent} onChange={(v) => setContent(v)} />
          )}
          {page.kind === "VCARD" && (
            <VCardBuilder value={content as VCardContent} onChange={(v) => setContent(v)} />
          )}
          {page.kind === "WIFI" && (
            <WifiBuilder value={content as WifiContent} onChange={(v) => setContent(v)} />
          )}

          {/* Design */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Palette className="size-4" />
              </span>
              <div>
                <p className="display text-lg text-ink">Design</p>
                <p className="text-xs text-muted">The accent colour used across your page.</p>
              </div>
            </div>
            <Field label="Brand colour">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme.brandColor || DEFAULT_BRAND}
                  onChange={(e) => setTheme({ ...theme, brandColor: e.target.value })}
                  className="size-11 shrink-0 cursor-pointer rounded-xl border border-line bg-white p-1"
                  aria-label="Brand colour"
                />
                <Input
                  value={theme.brandColor ?? ""}
                  placeholder={DEFAULT_BRAND}
                  onChange={(e) => setTheme({ ...theme, brandColor: e.target.value })}
                />
              </div>
            </Field>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <PagePreview kind={page.kind} content={content} theme={theme} />
        </div>
      </div>

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

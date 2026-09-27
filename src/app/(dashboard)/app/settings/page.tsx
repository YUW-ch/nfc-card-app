"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompany, useCompanyId } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import type { BillingResponse, Company, Locale, PlanFeatures, SubscriptionPlan } from "@/lib/types";
import { formatChf } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Field, Input, Select, Spinner } from "@/components/ui";
import { ViewOnlyNotice } from "@/components/gate";
import { cn } from "@/lib/utils";

interface CompanySettings {
  analyticsEnabled: boolean;
  defaultLocale: Locale;
}

const LOCALES: { value: Locale; label: string }[] = [
  { value: "de", label: "German" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
  { value: "it", label: "Italian" },
];

export default function SettingsPage() {
  const companyId = useCompanyId();
  const { canManage } = usePermissions();

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Manage your business profile, preferences, and plan."
      />
      <div className="space-y-6">
        {!canManage && <ViewOnlyNotice />}
        <BusinessProfile companyId={companyId} canManage={canManage} />
        <Preferences companyId={companyId} canManage={canManage} />
        <PlanBilling companyId={companyId} />
      </div>
    </div>
  );
}

// ─── Business profile ────────────────────────────────────────────────────────

function BusinessProfile({ companyId, canManage }: { companyId: string; canManage: boolean }) {
  const { company, refetch } = useCompany();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brandColor, setBrandColor] = useState("#f0431f");
  const [logo, setLogo] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setSlug(company.slug);
    setBrandColor(company.brandColor || "#f0431f");
    setLogo(company.logo ?? "");
  }, [company]);

  const save = useMutation({
    mutationFn: () =>
      api.patch<Company>(`/companies/${companyId}`, {
        name: name.trim(),
        slug: slug.trim(),
        brandColor,
        logo: logo.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["access"] });
      refetch();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not save your profile."),
  });

  if (!company) {
    return (
      <Card className="flex justify-center py-10">
        <Spinner />
      </Card>
    );
  }

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="display text-xl text-ink">Business profile</h2>
        <p className="mt-1 text-sm text-muted">The name and brand shown on your public pages.</p>
      </div>
      <fieldset disabled={!canManage} className="min-w-0 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Slug" hint="Used in your public URLs.">
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            />
          </Field>
        </div>
        <Field label="Brand color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="size-11 cursor-pointer rounded-2xl border border-line bg-white p-1"
              aria-label="Brand color"
            />
            <Input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-40 font-mono"
            />
          </div>
        </Field>
        <Field label="Logo URL" hint="A square PNG or SVG works best.">
          <Input
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            placeholder="https://..."
          />
        </Field>
      </fieldset>
      {error && <p className="text-sm text-negative">{error}</p>}
      {canManage && (
        <div className="flex items-center gap-3">
          <Button loading={save.isPending} disabled={!name.trim()} onClick={() => {
            setError(null);
            save.mutate();
          }}>
            Save profile
          </Button>
          {saved && <span className="text-sm font-medium text-positive">Saved</span>}
        </div>
      )}
    </Card>
  );
}

// ─── Preferences ─────────────────────────────────────────────────────────────

function Preferences({ companyId, canManage }: { companyId: string; canManage: boolean }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["settings", companyId],
    queryFn: () => api.get<CompanySettings>(`/companies/${companyId}/settings`),
  });

  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [defaultLocale, setDefaultLocale] = useState<Locale>("de");

  useEffect(() => {
    if (!settingsQuery.data) return;
    setAnalyticsEnabled(settingsQuery.data.analyticsEnabled);
    setDefaultLocale(settingsQuery.data.defaultLocale);
  }, [settingsQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      api.patch<CompanySettings>(`/companies/${companyId}/settings`, {
        analyticsEnabled,
        defaultLocale,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", companyId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : "Could not save preferences."),
  });

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="display text-xl text-ink">Preferences</h2>
        <p className="mt-1 text-sm text-muted">Defaults applied across this workspace.</p>
      </div>

      {settingsQuery.isLoading ? (
        <div className="py-6">
          <Spinner />
        </div>
      ) : (
        <>
          <fieldset disabled={!canManage} className="min-w-0 space-y-5">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block font-semibold text-ink">Analytics</span>
                <span className="block text-sm text-muted">Collect tap analytics for your cards.</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={analyticsEnabled}
                onClick={() => setAnalyticsEnabled((v) => !v)}
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full transition",
                  analyticsEnabled ? "bg-accent" : "bg-ink/15",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 size-5 rounded-full bg-white transition-all",
                    analyticsEnabled ? "left-6" : "left-1",
                  )}
                />
              </button>
            </label>

            <Field label="Default language">
              <Select
                value={defaultLocale}
                onChange={(e) => setDefaultLocale(e.target.value as Locale)}
              >
                {LOCALES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </Field>
          </fieldset>

          {error && <p className="text-sm text-negative">{error}</p>}
          {canManage && (
            <div className="flex items-center gap-3">
              <Button loading={save.isPending} onClick={() => {
                setError(null);
                save.mutate();
              }}>
                Save preferences
              </Button>
              {saved && <span className="text-sm font-medium text-positive">Saved</span>}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

// ─── Plan & billing ──────────────────────────────────────────────────────────

const FEATURE_LABELS: { key: Exclude<keyof PlanFeatures, "tier" | "maxLocations">; label: string }[] = [
  { key: "createPages", label: "Create your own pages" },
  { key: "analytics", label: "Tap analytics" },
  { key: "multiLocation", label: "Multiple locations" },
  { key: "unlimitedDestinationChanges", label: "Unlimited destination changes" },
  { key: "managed", label: "Managed setup" },
];

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "/ month",
  YEARLY: "/ year",
  ONE_TIME: "one-time",
};

/** Mirrors the defaults in the backend's `BillingService.resolveFeatures`. */
function planFeatureLabels(plan: SubscriptionPlan) {
  const f = plan.features ?? {};
  const max = !f.multiLocation ? 1 : f.maxLocations === undefined ? 1 : f.maxLocations;
  return [
    ...FEATURE_LABELS.filter(({ key }) => Boolean(f[key])).map(({ label }) => label),
    max === null ? "Unlimited locations" : `Up to ${max} location${max === 1 ? "" : "s"}`,
  ];
}

function PlanBilling({ companyId }: { companyId: string }) {
  const billingQuery = useQuery({
    queryKey: ["billing", companyId],
    queryFn: () => api.get<BillingResponse>(`/companies/${companyId}/billing`),
  });

  const plansQuery = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => api.get<SubscriptionPlan[]>(`/billing/plans`),
  });

  const features = billingQuery.data?.features;
  const currentTier = features?.tier;

  return (
    <Card className="space-y-5">
      <div>
        <h2 className="display text-xl text-ink">Plan & billing</h2>
        <p className="mt-1 text-sm text-muted">Your current plan and what is available.</p>
      </div>

      {billingQuery.isLoading ? (
        <div className="py-6">
          <Spinner />
        </div>
      ) : features ? (
        <div className="rounded-card border border-line bg-paper/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow text-muted">Current plan</p>
              <p className="display mt-1 text-2xl capitalize text-ink">{features.tier}</p>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {FEATURE_LABELS.map(({ key, label }) => {
              const on = Boolean(features[key]);
              return (
                <li
                  key={key}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    on ? "text-ink" : "text-muted/60",
                  )}
                >
                  <Check className={cn("size-4", on ? "text-positive" : "text-muted/40")} />
                  {label}
                </li>
              );
            })}
            <li className="flex items-center gap-2 text-sm text-ink">
              <Check className="size-4 text-positive" />
              {features.maxLocations === null
                ? "Unlimited locations"
                : `Up to ${features.maxLocations} location${features.maxLocations === 1 ? "" : "s"}`}
            </li>
          </ul>
        </div>
      ) : null}

      <div>
        <p className="eyebrow mb-3 text-muted">Available plans</p>
        {plansQuery.isLoading ? (
          <div className="py-6">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(plansQuery.data ?? []).map((plan) => {
              const isCurrent = plan.tier === currentTier;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "rounded-card border p-5",
                    isCurrent ? "border-accent bg-accent-soft" : "border-line bg-white",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-ink">{plan.name}</p>
                    {isCurrent && <span className="eyebrow text-accent-ink">Current</span>}
                  </div>
                  <p className="display mt-2 text-2xl text-ink">
                    {formatChf(plan.priceCents)}
                    {INTERVAL_LABELS[plan.interval] && (
                      <span className="text-sm font-normal text-muted">
                        {" "}
                        {INTERVAL_LABELS[plan.interval]}
                        {plan.tier === "STARTER" && " per card"}
                      </span>
                    )}
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-muted">
                    {planFeatureLabels(plan).map((label) => (
                      <li key={label} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-sm text-muted">
        Want to change plans? Contact us at hello@taplino.ch and we will set you up.
      </p>
    </Card>
  );
}

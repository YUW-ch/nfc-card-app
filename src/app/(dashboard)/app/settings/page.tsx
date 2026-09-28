"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompany, useCompanyId } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import type {
  BillingResponse,
  Company,
  CompanySubscription,
  Locale,
  PlanFeatures,
  SubscriptionPlan,
} from "@/lib/types";
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
        {/* useSearchParams (back from Stripe) needs a Suspense boundary. */}
        <Suspense fallback={null}>
          <PlanBilling companyId={companyId} />
        </Suspense>
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
  const [brandColor, setBrandColor] = useState("#2f6df0");
  const [logo, setLogo] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setSlug(company.slug);
    setBrandColor(company.brandColor || "#2f6df0");
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** One line under the current plan: renewal, scheduled end, or who manages it. */
function subscriptionNote(sub: CompanySubscription | null): string | null {
  if (!sub) return null;
  if (sub.source === "MANUAL") return "Managed by Taplino.";
  if (sub.source !== "STRIPE") return null;
  if (sub.status === "PAST_DUE") return "Your last payment failed. Update your payment method.";
  if (sub.status === "PAUSED") return "Your subscription is paused.";
  if (sub.cancelAt) return `Ends on ${formatDate(sub.cancelAt)}. You move back to Starter then.`;
  return `Renews on ${formatDate(sub.currentPeriodEnd)}.`;
}

function PlanBilling({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const billingQuery = useQuery({
    queryKey: ["billing", companyId],
    queryFn: () => api.get<BillingResponse>(`/companies/${companyId}/billing`),
  });

  const plansQuery = useQuery({
    queryKey: ["billing-plans"],
    queryFn: () => api.get<SubscriptionPlan[]>(`/billing/plans`),
  });

  const onError = (err: unknown) =>
    setError(err instanceof ApiError ? err.message : "Could not open billing. Please try again.");

  // Stripe hands back a URL (Checkout, or the portal for an existing subscription).
  const changePlan = useMutation({
    mutationFn: (tier: string) =>
      api.post<{ url: string }>(`/companies/${companyId}/billing/change-plan`, { tier }),
    onSuccess: ({ url }) => window.location.assign(url),
    onError,
  });

  const portal = useMutation({
    mutationFn: () => api.post<{ url: string }>(`/companies/${companyId}/billing/portal`),
    onSuccess: ({ url }) => window.location.assign(url),
    onError,
  });

  // Back from Checkout: apply the subscription now instead of waiting for the
  // webhook, then drop the query string so a reload does not repeat it.
  const result = params.get("billing");
  const sessionId = params.get("session_id");
  useEffect(() => {
    if (!result) return;
    router.replace("/app/settings", { scroll: false });
    if (result === "simulated") {
      setNotice("Plan changed. Payment was simulated because Stripe is not configured.");
      return;
    }
    if (result === "cancelled") {
      setNotice("Checkout cancelled. Your plan did not change.");
      return;
    }
    if (result !== "success" || !sessionId) return;
    setNotice("Payment received. Activating your plan...");
    api
      .post(`/companies/${companyId}/billing/confirm`, { sessionId })
      .then(() => setNotice("Your new plan is active."))
      .catch(() =>
        setNotice("Payment received. Your plan will switch over in a moment."),
      )
      .finally(() => queryClient.invalidateQueries({ queryKey: ["billing", companyId] }));
  }, [result, sessionId, companyId, router, queryClient]);

  const features = billingQuery.data?.features;
  const subscription = billingQuery.data?.subscription ?? null;
  const billing = billingQuery.data?.billing;
  const currentTier = features?.tier;
  const currentPrice =
    (plansQuery.data ?? []).find((p) => p.tier === currentTier)?.priceCents ?? 0;
  const onStripe = subscription?.source === "STRIPE";
  const managedByUs = subscription?.source === "MANUAL" && currentTier !== "STARTER";
  const selfServe = Boolean(billing?.online && billing.canManage && !managedByUs);
  const note = subscriptionNote(subscription);

  /** Whether a plan can be switched to online from here. */
  const canSwitchTo = (plan: SubscriptionPlan) => {
    if (!selfServe || plan.tier === currentTier) return false;
    if (billing?.simulated) return true;
    // Back to the base plan means cancelling the Stripe subscription.
    if (plan.interval === "ONE_TIME") return onStripe && !subscription?.cancelAt;
    // Paid plans resolve their Stripe price by lookup key on the server, which
    // answers with a clear message if one is missing.
    return true;
  };

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="display text-xl text-ink">Plan & billing</h2>
          <p className="mt-1 text-sm text-muted">Your current plan and what is available.</p>
        </div>
        {billing?.online && billing.canManage && billing.hasAccount && (
          <Button
            variant="outline"
            size="sm"
            loading={portal.isPending}
            onClick={() => {
              setError(null);
              portal.mutate();
            }}
          >
            Invoices & payment
          </Button>
        )}
      </div>

      {notice && (
        <p className="rounded-card bg-accent-soft px-4 py-3 text-sm font-medium text-accent-ink">
          {notice}
        </p>
      )}
      {error && <p className="text-sm text-negative">{error}</p>}

      {billingQuery.isLoading ? (
        <div className="py-6">
          <Spinner />
        </div>
      ) : features ? (
        <div className="rounded-card border border-line bg-paper/40 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow text-muted">Current plan</p>
              <p className="display mt-1 text-2xl capitalize text-ink">
                {subscription?.plan.name ?? features.tier}
              </p>
              {note && (
                <p
                  className={cn(
                    "mt-1 text-sm",
                    subscription?.status === "PAST_DUE" ? "text-negative" : "text-muted",
                  )}
                >
                  {note}
                </p>
              )}
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
              const upgrade = plan.priceCents > currentPrice && plan.interval !== "ONE_TIME";
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "flex flex-col rounded-card border p-5",
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
                  <ul className="mt-4 flex-1 space-y-1.5 text-sm text-muted">
                    {planFeatureLabels(plan).map((label) => (
                      <li key={label} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                        {label}
                      </li>
                    ))}
                  </ul>
                  {canSwitchTo(plan) && (
                    <Button
                      className="mt-5"
                      size="sm"
                      variant={upgrade ? "solid" : "outline"}
                      loading={changePlan.isPending && changePlan.variables === plan.tier}
                      disabled={changePlan.isPending}
                      onClick={() => {
                        setError(null);
                        changePlan.mutate(plan.tier);
                      }}
                    >
                      {upgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-sm text-muted">
        {managedByUs || !billing?.online
          ? "Want to change plans? Contact us at hello@taplino.ch and we will set you up."
          : !billing.canManage
            ? "Only members with billing access can change the plan."
            : "Plans renew automatically and can be cancelled any time. Questions? hello@taplino.ch"}
      </p>
    </Card>
  );
}

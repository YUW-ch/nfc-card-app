"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import { useCompany } from "./company";
import type { BillingResponse, CompanyRole, PlanFeatures, SubscriptionPlan } from "./types";

type BooleanFeature = {
  [K in keyof PlanFeatures]: PlanFeatures[K] extends boolean ? K : never;
}[keyof PlanFeatures];

function planIncludes(plan: SubscriptionPlan, feature: BooleanFeature) {
  return Boolean(plan.features?.[feature]);
}

function planAllowsLocations(plan: SubscriptionPlan, count: number) {
  const max = plan.features?.maxLocations === undefined ? 1 : plan.features.maxLocations;
  return Boolean(plan.features?.multiLocation) && (max === null || count <= max);
}

/** "Pro", "Pro or Managed", "Pro, Plus or Managed". */
export function formatPlanNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

/**
 * Role and plan checks for the current company. These only shape the UI; the
 * API enforces the same rules (`requireManager`, plan limits) and stays the
 * source of truth.
 */
export function usePermissions() {
  const { company, companyId } = useCompany();

  const billingQuery = useQuery({
    // Same key as Settings > Plan & billing, so both share one cache entry.
    queryKey: ["billing", companyId],
    queryFn: () => api.get<BillingResponse>(`/companies/${companyId}/billing`),
    enabled: Boolean(companyId),
    staleTime: 5 * 60_000,
  });

  const plansQuery = useQuery({
    // Same key as Settings > Plan & billing.
    queryKey: ["billing-plans"],
    queryFn: () => api.get<SubscriptionPlan[]>(`/billing/plans`),
    staleTime: 5 * 60_000,
  });

  const role: CompanyRole = company?.role ?? "MEMBER";
  const features = billingQuery.data?.features;
  const plans = plansQuery.data ?? [];
  const otherPlans = plans.filter((p) => p.tier !== features?.tier);

  return {
    role,
    features,
    /** OWNER or ADMIN. Mirrors the backend's `requireManager`. */
    canManage: role === "OWNER" || role === "ADMIN",
    isOwner: role === "OWNER",
    /** True while the plan is still loading, so callers can avoid flashing a lock. */
    planLoading: billingQuery.isLoading || plansQuery.isLoading,
    /** Display name of the current plan, e.g. "Starter". */
    planName: plans.find((p) => p.tier === features?.tier)?.name,
    /** Names of other plans that include `feature`, cheapest first. */
    plansWith: (feature: BooleanFeature) =>
      otherPlans.filter((p) => planIncludes(p, feature)).map((p) => p.name),
    /** Names of other plans that allow `count` locations, cheapest first. */
    plansWithLocations: (count: number) =>
      otherPlans.filter((p) => planAllowsLocations(p, count)).map((p) => p.name),
    can: (feature: BooleanFeature) => Boolean(features?.[feature]),
    /**
     * Pages are live and editable (plan or staff override). When false they are
     * kept but read-only here and offline to the public. Treated as active while
     * loading, so editors do not flash a lock.
     */
    pagesActive: billingQuery.data?.pagesActive ?? true,
    /** How many locations the plan allows. null = unlimited. */
    locationLimit: features
      ? features.multiLocation
        ? features.maxLocations
        : 1
      : null,
    /** Mirrors the location limit in the backend's `LocationsService.create`. */
    canAddLocation: (existingCount: number) => {
      if (existingCount === 0) return true;
      if (!features) return true;
      return (
        features.multiLocation &&
        (features.maxLocations == null || existingCount < features.maxLocations)
      );
    },
  };
}

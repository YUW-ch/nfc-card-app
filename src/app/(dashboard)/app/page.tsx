"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, LayoutTemplate, MapPin, MousePointerClick, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useCompany } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import type { Card as CardType, PageSummary, Location, AnalyticsSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button, Card, Spinner } from "@/components/ui";
import { ClaimableOrdersBanner } from "@/components/claimable-orders";

interface StatDef {
  label: string;
  value: number | string;
  hint?: string;
  icon: typeof CreditCard;
}

function StatCard({ stat, loading }: { stat: StatDef; loading: boolean }) {
  const Icon = stat.icon;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted">{stat.label}</span>
        <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Icon className="size-4.5" />
        </span>
      </div>
      {loading ? (
        <Spinner />
      ) : (
        <div>
          <p className="display text-3xl text-ink">{stat.value}</p>
          {stat.hint && <p className="mt-1 text-xs text-muted">{stat.hint}</p>}
        </div>
      )}
    </Card>
  );
}

export default function OverviewPage() {
  const { company, companyId } = useCompany();
  const { canManage, can, planLoading } = usePermissions();
  const analyticsOn = can("analytics");

  const cardsQuery = useQuery({
    queryKey: ["cards", companyId],
    queryFn: () => api.get<CardType[]>(`/companies/${companyId}/cards`),
    enabled: Boolean(companyId),
  });
  const pagesQuery = useQuery({
    queryKey: ["pages", companyId],
    queryFn: () => api.get<PageSummary[]>(`/companies/${companyId}/pages`),
    enabled: Boolean(companyId),
  });
  const locationsQuery = useQuery({
    queryKey: ["locations", companyId],
    queryFn: () => api.get<Location[]>(`/companies/${companyId}/locations`),
    enabled: Boolean(companyId),
  });
  const analyticsQuery = useQuery({
    queryKey: ["analytics-summary", companyId],
    queryFn: () => api.get<AnalyticsSummary>(`/companies/${companyId}/analytics/summary`),
    enabled: Boolean(companyId) && analyticsOn,
  });

  const cards = cardsQuery.data ?? [];
  const activeCards = cards.filter((c) => c.status === "ACTIVE").length;

  const stats: { def: StatDef; loading: boolean }[] = [
    {
      def: {
        label: "Cards",
        value: cards.length,
        hint: `${activeCards} active`,
        icon: CreditCard,
      },
      loading: cardsQuery.isLoading,
    },
    {
      def: {
        label: "Active cards",
        value: activeCards,
        hint: "Assigned and live",
        icon: MapPin,
      },
      loading: cardsQuery.isLoading,
    },
    {
      def: {
        label: "Pages",
        value: pagesQuery.data?.length ?? 0,
        hint: "Menus, links, reviews",
        icon: LayoutTemplate,
      },
      loading: pagesQuery.isLoading,
    },
    {
      def: {
        label: "Taps",
        value: analyticsOn ? (analyticsQuery.data?.totals.taps ?? 0) : "Pro",
        hint: analyticsOn ? "Last 30 days" : "Not in your plan",
        icon: MousePointerClick,
      },
      loading: planLoading || analyticsQuery.isLoading,
    },
  ];

  // locationsQuery is fetched to warm the cache and confirm setup; surfaced elsewhere.
  void locationsQuery;

  return (
    <div>
      <PageHeader
        eyebrow={company?.name ?? "Dashboard"}
        title="Overview"
        description="A quick pulse on your cards, pages, and taps."
      />

      <ClaimableOrdersBanner className="mb-6" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.def.label} stat={s.def} loading={s.loading} />
        ))}
      </div>

      {canManage && (
        <div className="mt-8">
          <h2 className="display text-lg text-ink">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/app/cards">
              <Button>
                <Plus className="size-4" />
                Create card
              </Button>
            </Link>
            {can("createPages") && (
              <Link href="/app/pages">
                <Button variant="outline">
                  <LayoutTemplate className="size-4" />
                  Build a page
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

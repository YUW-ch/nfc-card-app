"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useCompanyId } from "@/lib/company";
import type { AnalyticsSummary, CardType } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

interface CardBreakdown {
  cardId: string;
  name: string;
  type: CardType;
  taps: number;
}

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

const KIND_LABEL: Record<string, string> = {
  REVIEW: "Reviews",
  MENU: "Menu",
  LINKHUB: "Link hub",
  VCARD: "Contact card",
  WIFI: "Wi-Fi",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function rangeFor(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDate(from), to: isoDate(to) };
}

export default function AnalyticsPage() {
  const companyId = useCompanyId();
  const [days, setDays] = useState<number>(30);
  const range = rangeFor(days);

  const summaryQuery = useQuery({
    queryKey: ["analytics-summary", companyId, range.from, range.to],
    queryFn: () =>
      api.get<AnalyticsSummary>(`/companies/${companyId}/analytics/summary`, {
        from: range.from,
        to: range.to,
      }),
  });

  const cardsQuery = useQuery({
    queryKey: ["analytics-cards", companyId, range.from, range.to],
    queryFn: () =>
      api.get<CardBreakdown[]>(`/companies/${companyId}/analytics/cards`, {
        from: range.from,
        to: range.to,
      }),
  });

  const summary = summaryQuery.data;
  const maxTaps = Math.max(1, ...(summary?.series ?? []).map((s) => s.taps));
  const byKind = Object.entries(summary?.totals.byKind ?? {}).sort((a, b) => b[1] - a[1]);
  const topCards = (cardsQuery.data ?? []).slice().sort((a, b) => b.taps - a.taps);

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="How often your cards are tapped, and which ones drive the most activity."
        actions={
          <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
            {PRESETS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDays(p.days)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                  days === p.days ? "bg-accent text-white" : "text-muted hover:text-ink",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {summaryQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !summary ? (
        <EmptyState
          icon={<BarChart3 className="size-10" />}
          title="No analytics yet"
          description="Once your cards start getting tapped, activity shows up here."
        />
      ) : (
        <div className="space-y-6">
          {!summary.analyticsEnabled && (
            <div className="flex items-start gap-3 rounded-card border border-accent/30 bg-accent-soft p-5">
              <Lock className="mt-0.5 size-5 shrink-0 text-accent-ink" />
              <div>
                <p className="font-semibold text-ink">Analytics is off for this plan</p>
                <p className="mt-1 text-sm text-muted">
                  Upgrade to Pro to unlock full tap analytics. Contact us to enable it.
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="eyebrow text-muted">Total taps</p>
              <p className="display mt-2 text-5xl text-ink">{summary.totals.taps}</p>
              <p className="mt-2 text-sm text-muted">
                {range.from} to {range.to}
              </p>
            </Card>
            <Card className="sm:col-span-2">
              <p className="eyebrow text-muted">Daily taps</p>
              {summary.series.length === 0 ? (
                <p className="mt-6 text-sm text-muted">No taps in this range.</p>
              ) : (
                <div className="mt-6 flex h-40 items-end gap-1">
                  {summary.series.map((point) => (
                    <div
                      key={point.date}
                      className="group relative flex-1"
                      title={`${point.date}: ${point.taps}`}
                    >
                      <div
                        className="w-full rounded-t-md bg-accent/80 transition group-hover:bg-accent"
                        style={{
                          height: `${Math.max(2, (point.taps / maxTaps) * 100)}%`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <p className="eyebrow text-muted">By type</p>
              {byKind.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No taps yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {byKind.map(([kind, taps]) => {
                    const pct = summary.totals.taps
                      ? Math.round((taps / summary.totals.taps) * 100)
                      : 0;
                    return (
                      <li key={kind}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-ink">{KIND_LABEL[kind] ?? kind}</span>
                          <span className="text-muted">
                            {taps} · {pct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-paper-2">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <p className="eyebrow text-muted">Top cards</p>
              {cardsQuery.isLoading ? (
                <div className="py-6">
                  <Spinner />
                </div>
              ) : topCards.length === 0 ? (
                <p className="mt-4 text-sm text-muted">No card activity yet.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <tbody>
                    {topCards.map((card) => (
                      <tr key={card.cardId} className="border-t border-line first:border-0">
                        <td className="py-2.5 pr-2">
                          <span className="font-medium text-ink">{card.name}</span>
                        </td>
                        <td className="py-2.5 pr-2">
                          <Badge tone="neutral">{KIND_LABEL[card.type] ?? card.type}</Badge>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-ink">{card.taps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, MailCheck, Trash2 } from "lucide-react";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
// modal.tsx exists with the same ConfirmDialog in the app and the admin console.
import { ConfirmDialog } from "@/components/modal";

export interface WifiGuest {
  id: string;
  email: string;
  locale: string;
  verified: boolean;
  marketingConsent: boolean;
  consentAt: string | null;
  visits: number;
  lastSeenAt: string;
  createdAt: string;
}

const dateFormat = new Intl.DateTimeFormat("de-CH", { dateStyle: "medium" });

function toCsv(rows: WifiGuest[]): string {
  const header = ["email", "language", "verified", "marketing_consent", "consent_at", "visits", "first_visit", "last_visit"];
  const lines = rows.map((g) =>
    [
      g.email,
      g.locale,
      g.verified ? "yes" : "no",
      g.marketingConsent ? "yes" : "no",
      g.consentAt ?? "",
      String(g.visits),
      g.createdAt,
      g.lastSeenAt,
    ]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function download(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Guests who left their email on a Wi-Fi page, with export and deletion.
 * Shared with the admin console: each host passes its own endpoints. Without
 * `remove` the list is read-only.
 */
export function WifiGuests({
  queryKey,
  list,
  remove: removeGuest,
}: {
  /** react-query key for the list, unique per page. */
  queryKey: readonly unknown[];
  list: () => Promise<WifiGuest[]>;
  remove?: (guestId: string) => Promise<unknown>;
}) {
  const qc = useQueryClient();
  const canManage = !!removeGuest;
  const [onlyMarketing, setOnlyMarketing] = useState(false);
  const [toDelete, setToDelete] = useState<WifiGuest | null>(null);

  const { data: guests = [], isLoading } = useQuery({ queryKey, queryFn: list });

  const remove = useMutation({
    mutationFn: (id: string) => removeGuest!(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setToDelete(null);
    },
  });

  const marketingCount = guests.filter((g) => g.marketingConsent).length;
  const shown = useMemo(
    () => (onlyMarketing ? guests.filter((g) => g.marketingConsent) : guests),
    [guests, onlyMarketing],
  );

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    download(
      `wifi-guests${onlyMarketing ? "-marketing" : ""}-${stamp}.csv`,
      toCsv(shown),
    );
  };

  return (
    <Card className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
            <MailCheck className="size-4" />
          </span>
          <div>
            <p className="display text-lg text-ink">Wi-Fi guests</p>
            <p className="text-xs text-muted">
              {guests.length} guests, {marketingCount} agreed to news and offers.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full bg-ink/5 p-1 text-sm font-semibold">
            {[
              { value: false, label: "All" },
              { value: true, label: "Marketing consent" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setOnlyMarketing(o.value)}
                className={`rounded-full px-3 py-1.5 transition ${
                  onlyMarketing === o.value ? "bg-white text-ink shadow-sm" : "text-muted"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={shown.length === 0}>
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted">
        Only email guests who agreed to news and offers. Guests without that consent are deleted
        automatically 12 months after their last visit. Delete a guest when they ask you to.
      </p>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={<MailCheck className="size-6" />}
          title="No guests yet"
          description="Guests appear here once they enter their email on this page."
        />
      ) : (
        <ul className="divide-y divide-line">
          {shown.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{g.email}</p>
                <p className="text-xs text-muted">
                  {g.visits} {g.visits === 1 ? "visit" : "visits"}, last{" "}
                  {dateFormat.format(new Date(g.lastSeenAt))} · {g.locale.toUpperCase()}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {g.marketingConsent && <Badge tone="positive">Marketing</Badge>}
                {g.verified && <Badge tone="muted">Verified</Badge>}
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setToDelete(g)}
                    aria-label={`Delete ${g.email}`}
                    className="rounded-full p-2 text-muted transition hover:bg-ink/5 hover:text-ink"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title="Delete this guest?"
        description={
          toDelete
            ? `${toDelete.email} and their consent are removed for good. Do this when a guest asks for deletion.`
            : undefined
        }
      />
    </Card>
  );
}

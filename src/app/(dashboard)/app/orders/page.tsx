"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Package, Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { checkoutStorageKey, useCompany } from "@/lib/company";
import { clearSavedCheckout } from "@/components/editor/cart-state";
import { usePermissions } from "@/lib/permissions";
import type { Order, OrderStatus } from "@/lib/types";
import { formatChf } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
import { ClaimableOrdersBanner } from "@/components/claimable-orders";

type Tone = "neutral" | "accent" | "positive" | "muted";

const STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", tone: "accent" },
  PAID: { label: "Paid", tone: "positive" },
  IN_PRODUCTION: { label: "In production", tone: "neutral" },
  SHIPPED: { label: "Shipped", tone: "positive" },
  CANCELLED: { label: "Cancelled", tone: "muted" },
  EXPIRED: { label: "Expired", tone: "muted" },
};

/** The Stripe webhook can lag the redirect: poll this often, this many times. */
const POLL_MS = 3000;
const MAX_POLLS = 10;

const dateFmt = new Intl.DateTimeFormat("de-CH", { day: "2-digit", month: "short", year: "numeric" });

function formatMoney(cents: number, currency: string) {
  return currency === "CHF" ? formatChf(cents) : `${currency} ${(cents / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      }
    >
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const router = useRouter();
  const paid = useSearchParams().get("paid");
  const { companyId } = useCompany();
  const { canManage } = usePermissions();
  const queryClient = useQueryClient();

  // Back from a paid checkout: the designer's saved cart is done with.
  useEffect(() => {
    if (paid && companyId) clearSavedCheckout(checkoutStorageKey(companyId));
  }, [paid, companyId]);

  const ordersQuery = useQuery({
    queryKey: ["orders", companyId],
    queryFn: () => api.get<Order[]>(`/companies/${companyId}/orders`),
    enabled: Boolean(companyId),
    // After checkout, keep refreshing until the webhook has marked the order paid.
    refetchInterval: (query) => {
      if (!paid || query.state.dataUpdateCount > MAX_POLLS) return false;
      const order = query.state.data?.find((o) => o.number === paid);
      return !order || order.status === "PENDING_PAYMENT" ? POLL_MS : false;
    },
  });

  const orders = ordersQuery.data ?? [];
  const paidOrder = paid ? orders.find((o) => o.number === paid) : undefined;
  const confirming =
    Boolean(paid) &&
    (!paidOrder || paidOrder.status === "PENDING_PAYMENT") &&
    (queryClient.getQueryState(["orders", companyId])?.dataUpdateCount ?? 0) <= MAX_POLLS;

  const orderButton = canManage ? (
    <Link href="/app/orders/new">
      <Button>
        <Plus className="size-4" />
        Order cards
      </Button>
    </Link>
  ) : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Shop"
        title="Orders"
        description="Your NFC card orders, from payment to delivery."
        actions={orderButton}
      />

      {paid && (
        <div className="mb-6 flex items-start gap-3 rounded-card border border-positive/30 bg-positive/10 p-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-positive" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-ink">Thank you, payment received for order {paid}</p>
            <p className="mt-1 text-sm text-muted">
              We are producing your cards now. They will appear under{" "}
              <Link href="/app/cards" className="font-semibold text-accent hover:text-accent-ink">
                Cards
              </Link>{" "}
              once produced, ready to connect to a page.
            </p>
            {confirming && (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                <Spinner className="size-3.5" />
                Confirming the payment with our provider.
              </p>
            )}
          </div>
          <button
            onClick={() => router.replace("/app/orders")}
            className="rounded-full p-1 text-muted transition hover:bg-ink/5 hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <ClaimableOrdersBanner className="mb-6" />

      {ordersQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : ordersQuery.error ? (
        <p className="rounded-2xl bg-negative/10 px-4 py-3 text-sm text-negative">
          {ordersQuery.error.message || "Could not load your orders."}
        </p>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-10" />}
          title="Design your first card"
          description="Pick a card, add your logo and colours, and we produce and ship it. Your cards then show up here and under Cards."
          action={orderButton}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} highlight={order.number === paid} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, highlight }: { order: Order; highlight: boolean }) {
  const status = STATUS[order.status] ?? { label: order.status, tone: "neutral" as const };
  const cardsOrdered = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Card className={highlight ? "border-accent/40" : undefined}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="display text-xl text-ink">Order {order.number}</h2>
            <Badge tone={status.tone}>{status.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {dateFmt.format(new Date(order.createdAt))}
            {order.shippedAt && `, shipped ${dateFmt.format(new Date(order.shippedAt))}`}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="display text-2xl text-ink tabular-nums">
            {formatMoney(order.totalCents, order.currency)}
          </p>
          {order.discountCents > 0 && (
            <p className="text-xs text-muted">
              incl. {formatMoney(order.discountCents, order.currency)} volume discount
            </p>
          )}
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line border-t border-line">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0 text-ink">
              <span className="font-semibold tabular-nums">{item.quantity} x</span> {item.productName}
            </span>
            <span className="shrink-0 text-muted tabular-nums">
              {formatMoney(item.lineTotalCents, order.currency)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="flex items-center gap-2 text-muted">
          <CreditCard className="size-4" />
          {order.cardCount > 0 ? (
            <>
              {order.cardCount} {order.cardCount === 1 ? "card" : "cards"} in your account
            </>
          ) : (
            <>
              {cardsOrdered} {cardsOrdered === 1 ? "card" : "cards"} ordered
            </>
          )}
        </span>
        {order.cardCount > 0 && (
          <Link href="/app/cards" className="font-semibold text-accent hover:text-accent-ink">
            View cards
          </Link>
        )}
      </div>
    </Card>
  );
}

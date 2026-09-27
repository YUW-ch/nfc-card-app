"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompany } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Paid orders placed with the user's verified email that no business owns yet. */
export function useClaimableOrders() {
  const { companyId } = useCompany();
  return useQuery({
    queryKey: ["orders-claimable", companyId],
    queryFn: () => api.get<Order[]>(`/companies/${companyId}/orders/claimable`),
    enabled: Boolean(companyId),
  });
}

/**
 * Banner offering to attach unlinked orders (placed on the website as a guest)
 * to the current business. Renders nothing when there is nothing to claim.
 */
export function ClaimableOrdersBanner({ className }: { className?: string }) {
  const { access, company, companyId } = useCompany();
  const { canManage } = usePermissions();
  const queryClient = useQueryClient();
  const claimable = useClaimableOrders();

  const claim = useMutation({
    mutationFn: () => api.post<{ claimed: number }>(`/companies/${companyId}/orders/claim`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", companyId] });
      queryClient.invalidateQueries({ queryKey: ["orders-claimable", companyId] });
      queryClient.invalidateQueries({ queryKey: ["cards", companyId] });
    },
  });

  const orders = claimable.data ?? [];
  if (orders.length === 0) return null;

  const email = access?.user?.email ?? orders[0].email;
  const count = orders.length;

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-card border border-accent/30 bg-accent-soft p-5 sm:flex-row sm:items-center",
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-accent">
        <PackagePlus className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">
          You have {count} {count === 1 ? "order" : "orders"} placed with {email} that{" "}
          {count === 1 ? "is" : "are"} not linked yet
        </p>
        <p className="mt-1 text-sm text-muted">
          {canManage
            ? `Link ${count === 1 ? "it" : "them"} to ${company?.name ?? "this business"} and the cards appear under Cards.`
            : "Ask an owner or admin of this business to link them."}
        </p>
        {claim.error && (
          <p className="mt-2 text-sm text-negative">
            {claim.error instanceof ApiError ? claim.error.message : "Could not link the orders."}
          </p>
        )}
      </div>
      {canManage && (
        <Button className="shrink-0" loading={claim.isPending} onClick={() => claim.mutate()}>
          Add to {company?.name ?? "this business"}
        </Button>
      )}
    </div>
  );
}

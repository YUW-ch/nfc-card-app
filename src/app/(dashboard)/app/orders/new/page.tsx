"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useCompany, useCompanyId } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import { PageHeader } from "@/components/page-header";
import { Spinner } from "@/components/ui";
import { CardEditor } from "@/components/editor/CardEditor";
import {
  CheckoutError,
  type CheckoutPayload,
  type CheckoutResult,
} from "@/components/editor/checkout";
import type { EditorLocale } from "@/components/editor/locale";
import type { ProductCatalog, VolumeTier } from "@/components/editor/types";

// The dashboard is in English, so the designer (and the order confirmation
// email) follow suit.
const EDITOR_LOCALE: EditorLocale = "EN";

type ApiProduct = { key: string; priceCents: number; stock: number | null; available: boolean };
type ShopResponse = { products: ApiProduct[]; volumeTiers: VolumeTier[] };

function toCatalog(products: ApiProduct[]): ProductCatalog {
  const catalog: ProductCatalog = {};
  for (const p of products) {
    if (p?.key && Number.isInteger(p.priceCents) && p.priceCents >= 0) {
      catalog[p.key] = {
        price: p.priceCents / 100,
        available: Boolean(p.available),
        stock: typeof p.stock === "number" ? p.stock : null,
      };
    }
  }
  return catalog;
}

async function fetchShop(): Promise<{ catalog: ProductCatalog; volumeTiers?: VolumeTier[] }> {
  try {
    const shop = await api.get<ShopResponse>("/public/shop");
    return {
      catalog: toCatalog(shop.products ?? []),
      volumeTiers: shop.volumeTiers?.length ? shop.volumeTiers : undefined,
    };
  } catch {
    // Older backends only expose the product list; the editor then uses its
    // built-in volume tiers. If that fails too, it falls back to its defaults.
    const products = await api.get<ApiProduct[]>("/public/products").catch(() => []);
    return { catalog: toCatalog(products) };
  }
}

export default function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { cancelled } = use(searchParams);
  const companyId = useCompanyId();
  const { company, access } = useCompany();
  const { canManage } = usePermissions();

  const shopQuery = useQuery({
    queryKey: ["shop"],
    queryFn: fetchShop,
    staleTime: 60_000,
  });

  // Logged-in orders use the account's email, so the body carries no email.
  async function onCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
    const body: Omit<CheckoutPayload, "email"> = { ...payload };
    delete (body as CheckoutPayload).email;
    try {
      return await api.post<CheckoutResult>(`/companies/${companyId}/orders`, body);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) throw new CheckoutError("stock", err.message);
        if (err.status === 400 || err.status === 413) throw new CheckoutError("invalid", err.message);
      }
      throw new CheckoutError("generic", err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Shop"
        title="Order cards"
        description="Design your cards, choose a quantity and pay securely by card or TWINT. Paid cards appear in this business automatically."
        actions={
          <Link
            href="/app/orders"
            className="inline-flex items-center gap-2 rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:border-ink"
          >
            <ArrowLeft className="size-4" />
            All orders
          </Link>
        }
      />

      {!canManage ? (
        <div className="rounded-card border border-line bg-white p-6 text-sm text-muted">
          Only owners and admins can order cards for {company?.name ?? "this business"}. Ask one of
          them to place the order.
        </div>
      ) : shopQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <CardEditor
          layout="panel"
          locale={EDITOR_LOCALE}
          catalog={shopQuery.data?.catalog}
          volumeTiers={shopQuery.data?.volumeTiers}
          askEmail={false}
          notice={cancelled === "1" ? "cancelled" : null}
          prefill={{
            customerName: access?.user?.name ?? undefined,
            companyName: company?.name,
          }}
          onCheckout={onCheckout}
        />
      )}
    </div>
  );
}

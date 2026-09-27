"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { WifiOff, CreditCard } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { PageKind, PageTheme, PageContent, CardType } from "@/lib/types";
import { PublicRenderer } from "@/components/public/PublicRenderer";

type CardResponse =
  | {
      status: "ok";
      card: { id: string; name: string; type: CardType; design?: unknown };
      page: {
        id: string;
        kind: PageKind;
        name: string;
        theme?: PageTheme;
        content?: PageContent;
        slug: string;
      };
    }
  | { status: "inactive"; card: { name: string; type: CardType } };

// ── Shared UI ──

export function TapLoader() {
  return (
    <div className="tap-safe flex min-h-[100dvh] flex-col items-center justify-center bg-paper">
      <div className="relative flex size-24 items-center justify-center">
        <span
          className="ripple-ring absolute inset-0 rounded-full"
          style={{ background: "rgba(240,67,31,0.18)" }}
        />
        <span
          className="ripple-ring absolute inset-0 rounded-full"
          style={{ background: "rgba(240,67,31,0.18)", animationDelay: "0.9s" }}
        />
        <span className="display text-2xl text-ink">
          t<span className="text-accent">.</span>
        </span>
      </div>
    </div>
  );
}

export function TapMessage({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="tap-safe flex min-h-[100dvh] flex-col items-center justify-center bg-paper px-8 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-accent-soft text-accent">
        {icon}
      </div>
      <p className="display text-2xl text-ink">{title}</p>
      {subtitle && <p className="mt-2 max-w-xs text-muted">{subtitle}</p>}
      <a
        href="https://taplino.ch"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 text-xs font-medium text-muted/70 transition hover:text-muted"
      >
        Powered by <span className="font-semibold">taplino</span>
      </a>
    </div>
  );
}

export default function CardPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error } = useQuery<CardResponse, ApiError>({
    queryKey: ["public-card", slug],
    queryFn: () => api.get<CardResponse>(`/public/cards/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) return <TapLoader />;

  if (error) {
    return (
      <TapMessage
        icon={<CreditCard className="size-8" />}
        title="This card isn't set up yet"
        subtitle="It looks like this card has not been activated. Check back soon."
      />
    );
  }

  if (data?.status === "inactive") {
    return (
      <TapMessage
        icon={<WifiOff className="size-8" />}
        title="This card is not active yet"
        subtitle={data.card?.name ? `"${data.card.name}" is waiting to be set up.` : undefined}
      />
    );
  }

  if (data?.status === "ok") {
    return <PublicRenderer page={data.page} />;
  }

  return (
    <TapMessage
      icon={<CreditCard className="size-8" />}
      title="This card isn't set up yet"
      subtitle="Check back soon."
    />
  );
}

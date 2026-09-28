"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { wifiAccessClient } from "@/lib/wifi-access";
import type { PageKind, PageTheme, PageContent } from "@/lib/types";
import { PublicRenderer } from "@/components/public/PublicRenderer";
import { TapLoader, TapMessage } from "@/components/tap";

type PageResponse =
  | {
      status: "ok";
      page: {
        id: string;
        kind: PageKind;
        name: string;
        theme?: PageTheme;
        content?: PageContent;
        slug: string;
        companyName?: string;
      };
    }
  // The business's pages are offline on its plan: the API names taplino.ch.
  | { status: "redirect"; url: string };

export default function PublicPageRoute() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error } = useQuery<PageResponse, ApiError>({
    queryKey: ["public-page", slug],
    queryFn: () => api.get<PageResponse>(`/public/pages/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  const redirectUrl = data?.status === "redirect" ? data.url : null;
  useEffect(() => {
    if (redirectUrl) window.location.replace(redirectUrl);
  }, [redirectUrl]);

  if (isLoading || redirectUrl) return <TapLoader />;

  if (error || data?.status !== "ok") {
    return (
      <TapMessage
        icon={<FileQuestion className="size-8" />}
        title="This page isn't set up yet"
        subtitle="It looks like this link has not been published. Check back soon."
      />
    );
  }

  return (
      <PublicRenderer
        page={data.page}
        wifi={wifiAccessClient(data.page.slug)}
      />
    );
}

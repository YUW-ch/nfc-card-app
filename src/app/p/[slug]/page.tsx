"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileQuestion } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { PageKind, PageTheme, PageContent } from "@/lib/types";
import { PublicRenderer } from "@/components/public/PublicRenderer";
import { TapLoader, TapMessage } from "@/app/c/[slug]/page";

type PageResponse = {
  status: "ok";
  page: {
    id: string;
    kind: PageKind;
    name: string;
    theme?: PageTheme;
    content?: PageContent;
    slug: string;
  };
};

export default function PublicPageRoute() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data, isLoading, error } = useQuery<PageResponse, ApiError>({
    queryKey: ["public-page", slug],
    queryFn: () => api.get<PageResponse>(`/public/pages/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) return <TapLoader />;

  if (error || data?.status !== "ok") {
    return (
      <TapMessage
        icon={<FileQuestion className="size-8" />}
        title="This page isn't set up yet"
        subtitle="It looks like this link has not been published. Check back soon."
      />
    );
  }

  return <PublicRenderer page={data.page} />;
}

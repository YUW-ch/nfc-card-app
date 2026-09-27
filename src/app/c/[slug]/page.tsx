"use client";

import { useParams } from "next/navigation";
import { CardTap } from "@/components/tap";

// Old-style card link /c/<slug>. Only cards made before per-business links
// answer it; new cards use /c/<business>/<card>.
export default function LegacyCardPage() {
  const { slug } = useParams<{ slug: string }>();
  return <CardTap path={`/public/cards/${encodeURIComponent(slug)}`} />;
}

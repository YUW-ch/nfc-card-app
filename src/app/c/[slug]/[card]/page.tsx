"use client";

import { useParams } from "next/navigation";
import { CardTap } from "@/components/tap";

// Card link /c/<business>/<card>. The first segment is the business's short
// name (or one it used before), the second the card's name within it.
export default function CardPage() {
  const { slug, card } = useParams<{ slug: string; card: string }>();
  return (
    <CardTap path={`/public/cards/${encodeURIComponent(slug)}/${encodeURIComponent(card)}`} />
  );
}

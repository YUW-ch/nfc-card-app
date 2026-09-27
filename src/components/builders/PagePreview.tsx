"use client";

import type { PageContent, PageKind, PageTheme } from "@/lib/page-content";
import { PublicRenderer } from "@/components/public/PublicRenderer";

/**
 * The live page inside a phone frame. Renders the real public views, so the
 * preview is exactly what guests see after publishing.
 */
export function PagePreview({
  kind,
  content,
  theme,
  name,
}: {
  kind: PageKind;
  content: PageContent;
  theme: PageTheme;
  name: string;
}) {
  return (
    <div className="w-[340px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
      <div className="relative overflow-hidden rounded-[1.8rem]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-ink" />
        <div className="no-scrollbar h-[640px] overflow-y-auto">
          <PublicRenderer page={{ kind, name, content, theme }} embedded />
        </div>
      </div>
    </div>
  );
}

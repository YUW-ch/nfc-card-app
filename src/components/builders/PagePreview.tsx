"use client";

import type { CSSProperties } from "react";
import type { PageContent, PageKind, PageTheme } from "@/lib/page-content";
import { resolveTheme } from "@/lib/page-theme";
import { PublicRenderer } from "@/components/public/PublicRenderer";

// Insets of a notched phone (status bar with the camera cut-out, home
// indicator). The public views pad by these, so the preview shows the same
// spacing guests get on a real device.
const SAFE_TOP = 44;
const SAFE_BOTTOM = 28;

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
  const { backgroundColor, textColor } = resolveTheme(theme);
  const insets = { "--safe-top": `${SAFE_TOP}px`, "--safe-bottom": `${SAFE_BOTTOM}px` } as CSSProperties;

  return (
    <div className="w-[340px] rounded-[2.5rem] border-[10px] border-ink bg-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]">
      <div className="relative overflow-hidden rounded-[1.8rem]" style={insets}>
        {/* Status bar: content scrolls underneath it, like on a phone. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20"
          style={{ height: SAFE_TOP, background: backgroundColor }}
        />
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-30 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
        <div className="no-scrollbar h-[640px] overflow-y-auto">
          <PublicRenderer page={{ kind, name, content, theme }} embedded />
        </div>
        <div
          className="pointer-events-none absolute bottom-2 left-1/2 z-30 h-1 w-28 -translate-x-1/2 rounded-full opacity-40"
          style={{ background: textColor }}
        />
      </div>
    </div>
  );
}

"use client";

import type { PageContent, PageKind, PageTheme } from "@/lib/page-content";
import { BuilderServicesProvider, type BuilderServices } from "./host";
import { PageContentEditor } from "./PageContentEditor";
import { PagePreview } from "./PagePreview";

/**
 * The page editing surface shared by the panel app and the admin console: the
 * builder and design panels on the left, the live preview on the right.
 *
 * Each host decides access and owns the API: it passes `canEdit` from its own
 * permission check and `services` that call its own endpoints (the backend
 * enforces roles and limits there). Read-only viewers get a disabled builder
 * with no Translate or upload actions.
 */
export function PageWorkspace({
  kind,
  name,
  content,
  onContentChange,
  theme,
  onThemeChange,
  canEdit,
  services,
}: {
  kind: PageKind;
  /** The page's name, used as its title until the design sets one. */
  name: string;
  content: PageContent;
  onContentChange: (next: PageContent) => void;
  theme: PageTheme;
  onThemeChange: (next: PageTheme) => void;
  canEdit: boolean;
  services: BuilderServices;
}) {
  // Viewers can still browse saved designs; everything that writes is dropped.
  const available: BuilderServices = canEdit ? services : { templates: services.templates };

  return (
    <BuilderServicesProvider services={available}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        {/* A disabled fieldset turns every builder control read-only. */}
        <fieldset disabled={!canEdit} className="flex min-w-0 flex-col gap-6">
          <PageContentEditor
            kind={kind}
            content={content}
            onContentChange={onContentChange}
            theme={theme}
            onThemeChange={onThemeChange}
            pageName={name}
          />
        </fieldset>

        <div className="lg:sticky lg:top-6 lg:h-fit">
          <PagePreview kind={kind} name={name} content={content} theme={theme} />
        </div>
      </div>
    </BuilderServicesProvider>
  );
}

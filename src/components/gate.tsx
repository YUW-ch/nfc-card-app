"use client";

import type { ReactNode } from "react";
import { Eye, Lock } from "lucide-react";
import { usePermissions } from "@/lib/permissions";
import { Spinner } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Renders children only for OWNER and ADMIN. */
export function RoleGate({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { canManage } = usePermissions();
  return <>{canManage ? children : fallback}</>;
}

/** Renders children only when the current plan includes `feature`. */
export function PlanGate({
  feature,
  title,
  description,
  children,
}: {
  feature: "analytics" | "multiLocation" | "unlimitedDestinationChanges" | "managed" | "createPages";
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { can, planLoading } = usePermissions();
  if (planLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }
  if (!can(feature)) return <UpgradeNotice title={title} description={description} />;
  return <>{children}</>;
}

export function UpgradeNotice({
  title,
  description = "Contact us at hello@taplino.ch to upgrade your plan.",
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-card border border-accent/30 bg-accent-soft p-5",
        className,
      )}
    >
      <Lock className="mt-0.5 size-5 shrink-0 text-accent-ink" />
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
    </div>
  );
}

/** Shown to MEMBERs on pages they can see but not change. */
export function ViewOnlyNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm text-muted",
        className,
      )}
    >
      <Eye className="size-4 shrink-0" />
      View only. Ask an owner or admin to make changes.
    </div>
  );
}

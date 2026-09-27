"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = "solid" | "outline" | "ghost" | "light" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  children,
  variant = "solid",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 will-change-transform disabled:opacity-50 disabled:pointer-events-none";
  const sizes: Record<ButtonSize, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const variants: Record<ButtonVariant, string> = {
    solid:
      "bg-accent text-white hover:bg-accent-ink hover:-translate-y-0.5 shadow-[0_10px_30px_-12px_rgba(47,109,240,0.7)]",
    outline: "border border-ink/20 text-ink hover:border-ink hover:-translate-y-0.5 bg-transparent",
    ghost: "text-ink hover:text-accent",
    light: "bg-white text-ink hover:-translate-y-0.5 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.5)]",
    danger: "bg-negative text-white hover:brightness-95 hover:-translate-y-0.5",
  };
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

// ─── Card surface ─────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <As className={cn("rounded-card border border-line bg-white p-6", className)}>{children}</As>
  );
}

// ─── Form fields ──────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-negative">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const inputBase =
  "w-full rounded-2xl border border-line bg-paper/40 px-4 py-3 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-accent focus:bg-white";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, "min-h-24 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputBase, "appearance-none pr-10", className)} {...props}>
      {children}
    </select>
  );
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "positive" | "muted";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/5 text-ink",
    accent: "bg-accent-soft text-accent-ink",
    positive: "bg-positive/10 text-positive",
    muted: "bg-ink/5 text-muted",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-muted", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-paper/30 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-accent">{icon}</div>}
      <p className="display text-xl text-ink">{title}</p>
      {description && <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

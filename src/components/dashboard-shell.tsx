"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Package,
  LayoutTemplate,
  MapPin,
  BarChart3,
  Users,
  Settings,
  Menu as MenuIcon,
  X,
  ChevronDown,
  Check,
  LogOut,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useCompany } from "@/lib/company";
import { usePermissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Plan feature this page needs. A lock shows when the plan lacks it. */
  feature?: "analytics";
}

const NAV: NavItem[] = [
  { label: "Overview", href: "/app", icon: LayoutDashboard },
  { label: "Cards", href: "/app/cards", icon: CreditCard },
  { label: "Orders", href: "/app/orders", icon: Package },
  { label: "Pages", href: "/app/pages", icon: LayoutTemplate },
  { label: "Locations", href: "/app/locations", icon: MapPin },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3, feature: "analytics" },
  { label: "Team", href: "/app/team", icon: Users },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

function Wordmark() {
  return (
    <Link href="/app" className="display text-2xl tracking-tight text-ink">
      taplino<span className="text-accent">.</span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { can, planLoading } = usePermissions();
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        const locked = Boolean(item.feature) && !planLoading && !can(item.feature!);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-accent-soft text-accent-ink"
                : "text-ink-soft hover:bg-paper-2 hover:text-ink",
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            {item.label}
            {locked && <Lock className="ml-auto size-3.5 text-muted" aria-label="Not in your plan" />}
          </Link>
        );
      })}
    </nav>
  );
}

function CompanySwitcher() {
  const { company, companies, setCompanyId } = useCompany();
  const [open, setOpen] = useState(false);

  if (!company) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-ink/30"
      >
        <span className="max-w-[10rem] truncate">{company.name}</span>
        <ChevronDown className={cn("size-4 text-muted transition", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
              Businesses
            </p>
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCompanyId(c.id);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-ink hover:bg-paper-2"
              >
                <span className="truncate">{c.name}</span>
                {c.id === company.id && <Check className="size-4 shrink-0 text-accent" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const router = useRouter();
  const { access } = useCompany();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const user = access?.user;
  const name = user?.name ?? user?.email ?? "";
  const initials =
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex size-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper transition hover:bg-ink-2"
        aria-label="Account menu"
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-10 cursor-default"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-muted">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-line" />
            <button
              onClick={signOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink hover:bg-paper-2 disabled:opacity-50"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-paper">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[250px] flex-col border-r border-line bg-white px-4 py-6 lg:flex">
        <div className="px-2">
          <Wordmark />
        </div>
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            aria-hidden
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[250px] flex-col border-r border-line bg-white px-4 py-6">
            <div className="flex items-center justify-between px-2">
              <Wordmark />
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-muted hover:text-ink"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-8 flex-1">
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[250px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-ink lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="size-5" />
          </button>
          <CompanySwitcher />
          <div className="flex-1" />
          <UserMenu />
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient, useSession } from "@/lib/auth-client";
import { Button, Card, Field, Input } from "@/components/ui";

function Wordmark() {
  return (
    <span className="display text-3xl tracking-tight text-ink">
      taplino<span className="text-accent">.</span>
    </span>
  );
}

// Dev-only convenience: prefill the form with the backend's seeded dev user
// (nfc-card-backend `pnpm db:seed:dev`), overridable via .env.local.
// Gated on NODE_ENV so the values are stripped from production bundles.
const DEV_EMAIL =
  process.env.NODE_ENV === "development"
    ? (process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "dev@taplino.ch")
    : "";
const DEV_PASSWORD =
  process.env.NODE_ENV === "development"
    ? (process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD ?? "taplino-dev")
    : "";

// Dev-only: one seeded account per plan (nfc-card-backend `pnpm db:seed:dev`).
// Empty outside `next dev`, so neither the emails nor the password ship.
const DEV_ACCOUNTS =
  process.env.NODE_ENV === "development"
    ? [
        { email: "dev@taplino.ch", label: "Dev", hint: "Starter, also super admin" },
        { email: "starter@taplino.ch", label: "Starter", hint: "Café Starter" },
        { email: "pro@taplino.ch", label: "Pro", hint: "Bistro Pro" },
        { email: "managed@taplino.ch", label: "Managed", hint: "Hotel Managed" },
      ].map((a) => ({ ...a, password: "taplino-dev" }))
    : [];

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  // Subscribing keeps better-auth's session store live on this page, and
  // refetching it after sign-in means the dashboard layout never reads the
  // stale signed-out state and bounces straight back here.
  const { refetch: refetchSession } = useSession();
  const verified = params.get("verified") === "true";
  // Carried through from a shop order email via register and verify-email.
  const prefillEmail = params.get("email");
  const order = params.get("order");

  const [email, setEmail] = useState(prefillEmail ?? DEV_EMAIL);
  const [password, setPassword] = useState(prefillEmail ? "" : DEV_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message ?? "Could not sign in. Please try again.");
      return;
    }
    await refetchSession();
    // Drop the previous account's cached /access, otherwise the dashboard sees
    // a user mismatch and signs the new session out again.
    queryClient.clear();
    router.push("/app");
  }

  return (
    <Card className="w-full max-w-md">
      <h1 className="display text-2xl text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">Sign in to manage your cards and pages.</p>

      {verified && (
        <div className="mt-5 rounded-2xl bg-positive/10 px-4 py-3 text-sm text-positive">
          Email verified, please sign in.
        </div>
      )}

      {order && (
        <div className="mt-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-ink">
          Your order <span className="font-semibold">{order}</span> will be linked to this account
          once you create your business.
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.ch"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>

        {error && <p className="text-sm text-negative">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>

      {DEV_ACCOUNTS.length > 0 && (
        <DevAccounts
          current={email}
          onPick={(account) => {
            setEmail(account.email);
            setPassword(account.password);
            setError(null);
          }}
        />
      )}

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-muted hover:text-accent">
          Forgot password?
        </Link>
        <span className="text-muted">
          New here?{" "}
          <Link href="/register" className="font-semibold text-accent hover:text-accent-ink">
            Create an account
          </Link>
        </span>
      </div>
    </Card>
  );
}

function DevAccounts({
  current,
  onPick,
}: {
  current: string;
  onPick: (account: (typeof DEV_ACCOUNTS)[number]) => void;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-line p-3">
      <p className="eyebrow px-1 text-muted">Dev accounts</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {DEV_ACCOUNTS.map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => onPick(a)}
            className={`rounded-xl border px-3 py-2 text-left transition hover:border-accent ${
              current === a.email ? "border-accent bg-accent-soft/60" : "border-line bg-white"
            }`}
          >
            <span className="block text-sm font-semibold text-ink">{a.label}</span>
            <span className="block truncate text-xs text-muted">{a.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-paper px-4 py-12">
      <Wordmark />
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <p className="text-sm text-muted">Loading…</p>
          </Card>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}

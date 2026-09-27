"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button, Card, Field, Input } from "@/components/ui";

function Wordmark() {
  return (
    <span className="display text-3xl tracking-tight text-ink">
      taplino<span className="text-accent">.</span>
    </span>
  );
}

// Dev-only convenience: prefill the form from .env.local so local sign-in is one click.
// Gated on NODE_ENV so the values are stripped from production bundles.
const DEV_EMAIL =
  process.env.NODE_ENV === "development" ? (process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL ?? "") : "";
const DEV_PASSWORD =
  process.env.NODE_ENV === "development" ? (process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD ?? "") : "";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const verified = params.get("verified") === "true";

  const [email, setEmail] = useState(DEV_EMAIL);
  const [password, setPassword] = useState(DEV_PASSWORD);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not sign in. Please try again.");
      return;
    }
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

"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button, Card, Field, Input } from "@/components/ui";

function Wordmark() {
  return (
    <span className="display text-3xl tracking-tight text-ink">
      taplino<span className="text-accent">.</span>
    </span>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-paper px-4 py-12">
          <Wordmark />
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

/**
 * Where the verification email sends the user afterwards. When they arrive from
 * a shop order email (`?email=&order=`) we carry both through to sign in, so the
 * order note and the email prefill survive the verify step.
 */
function verifiedCallbackUrl(email: string, order: string | null) {
  if (typeof window === "undefined" || !order) return undefined;
  const qs = new URLSearchParams({ verified: "true", email, order });
  return `${window.location.origin}/login?${qs.toString()}`;
}

function RegisterForm() {
  const params = useSearchParams();
  const order = params.get("order");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: verifiedCallbackUrl(email, order),
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Could not create your account. Please try again.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-paper px-4 py-12">
      <Wordmark />

      {sent ? (
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <MailCheck className="size-6" />
          </div>
          <h1 className="display text-2xl text-ink">Check your inbox</h1>
          <p className="mt-2 text-sm text-muted">
            We sent a verification link to <span className="font-semibold text-ink">{email}</span>.
            Click it to confirm your email, then sign in.
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="font-semibold text-accent hover:text-accent-ink"
            >
              Back to sign in
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="w-full max-w-md">
          <h1 className="display text-2xl text-ink">Create your account</h1>
          <p className="mt-1.5 text-sm text-muted">Start managing your NFC cards in minutes.</p>

          {order && (
            <div className="mt-5 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-ink">
              Your order <span className="font-semibold">{order}</span> will be linked to this
              account once you create your business.
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <Field label="Name">
              <Input
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Baker"
              />
            </Field>
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
            <Field label="Password" hint="At least 8 characters.">
              <Input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error && <p className="text-sm text-negative">{error}</p>}

            <Button type="submit" loading={loading} className="w-full">
              Create account
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent hover:text-accent-ink">
              Sign in
            </Link>
          </p>
        </Card>
      )}
    </main>
  );
}

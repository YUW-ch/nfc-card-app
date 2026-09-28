"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck, AlertCircle } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { Logo } from "@/components/logo";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3311";

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const callbackURL = params.get("callbackURL");
  const [redirecting, setRedirecting] = useState(false);

  if (!token) {
    return (
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-negative/10 text-negative">
          <AlertCircle className="size-6" />
        </div>
        <h1 className="display text-2xl text-ink">Invalid link</h1>
        <p className="mt-2 text-sm text-muted">
          This verification link is missing or malformed. Please open the most recent link from
          your email, or sign in to request a new one.
        </p>
        <div className="mt-6">
          <Link href="/login" className="font-semibold text-accent hover:text-accent-ink">
            Back to sign in
          </Link>
        </div>
      </Card>
    );
  }

  function verify() {
    setRedirecting(true);
    const cb = callbackURL || "/login?verified=true";
    window.location.href = `${API_URL}/api/v1/auth/verify-email?token=${token}&callbackURL=${encodeURIComponent(
      cb,
    )}`;
  }

  return (
    <Card className="w-full max-w-md text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
        <MailCheck className="size-6" />
      </div>
      <h1 className="display text-2xl text-ink">Verify your email</h1>
      <p className="mt-2 text-sm text-muted">
        Confirm your email address to activate your Taplino account.
      </p>
      <div className="mt-6">
        <Button onClick={verify} loading={redirecting} className="w-full">
          Verify my email
        </Button>
      </div>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-paper px-4 py-12">
      <Logo size="lg" />
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <p className="text-sm text-muted">Loading…</p>
          </Card>
        }
      >
        <VerifyEmailInner />
      </Suspense>
    </main>
  );
}

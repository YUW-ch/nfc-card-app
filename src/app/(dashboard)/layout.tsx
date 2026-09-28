"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authClient, useSession } from "@/lib/auth-client";
import { CompanyProvider, useCompany } from "@/lib/company";
import { api, ApiError } from "@/lib/api";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button, Card, Field, Input, Spinner } from "@/components/ui";
import { Logo } from "@/components/logo";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper">
      <Spinner className="size-7" />
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function Onboarding() {
  const { refetch, setCompanyId } = useCompany();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const effectiveSlug = slugTouched ? slug : slugify(name);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const company = await api.post<{ id: string }>("/companies", {
        name: name.trim(),
        slug: effectiveSlug,
      });
      if (company?.id) setCompanyId(company.id);
      refetch();
    } catch (err) {
      setLoading(false);
      setError(
        err instanceof ApiError ? err.message : "Could not create your business. Please try again.",
      );
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-paper px-4 py-12">
      <Logo size="lg" />
      <Card className="w-full max-w-md">
        <span className="eyebrow text-accent">Welcome</span>
        <h1 className="display mt-2 text-2xl text-ink">Create your first business</h1>
        <p className="mt-1.5 text-sm text-muted">
          This is where your cards, pages, and locations live. You can add more later.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <Field label="Business name">
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Café Baumann"
            />
          </Field>
          <Field label="Slug" hint="Used in your public page URLs.">
            <Input
              type="text"
              required
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="cafe-baumann"
            />
          </Field>

          {error && <p className="text-sm text-negative">{error}</p>}

          <Button type="submit" loading={loading} className="w-full">
            Create business
          </Button>
        </form>
      </Card>
    </main>
  );
}

function isUnauthorized(err: unknown) {
  return err instanceof ApiError && err.status === 401;
}

/**
 * Signs out and returns to login. Used when the backend no longer accepts the
 * session, or /access answers for a different user than the one signed in, so
 * the dashboard never falls through to onboarding with a dead session.
 */
function SignOutToLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await authClient.signOut();
      if (cancelled) return;
      queryClient.clear();
      router.replace("/login");
    })();
    return () => {
      cancelled = true;
    };
  }, [queryClient, router]);

  return <FullScreenSpinner />;
}

function AccessError({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-paper px-4 py-12">
      <Card className="w-full max-w-md text-center">
        <h1 className="display text-2xl text-ink">Could not load your account</h1>
        <p className="mt-1.5 text-sm text-muted">Check your connection and try again.</p>
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      </Card>
    </main>
  );
}

function DashboardBody({ userId, children }: { userId: string; children: ReactNode }) {
  const { access, isLoading, error, refetch, companies, companyId } = useCompany();
  const queryClient = useQueryClient();
  const [unauthorized, setUnauthorized] = useState(false);

  // Any dashboard request that comes back 401 means the session is gone.
  useEffect(() => {
    const onQuery = queryClient.getQueryCache().subscribe((e) => {
      if (e.type === "updated" && isUnauthorized(e.query.state.error)) setUnauthorized(true);
    });
    const onMutation = queryClient.getMutationCache().subscribe((e) => {
      if (e.type === "updated" && isUnauthorized(e.mutation?.state.error)) setUnauthorized(true);
    });
    return () => {
      onQuery();
      onMutation();
    };
  }, [queryClient]);

  if (isLoading) return <FullScreenSpinner />;
  if (
    unauthorized ||
    isUnauthorized(error) ||
    (access && (!access.user || access.user.id !== userId))
  ) {
    return <SignOutToLogin />;
  }
  if (error || !access) return <AccessError onRetry={refetch} />;
  if (companies.length === 0) return <Onboarding />;
  // `companyId` is populated by an effect once the company list resolves. Hold
  // the shell (and the child pages that call useCompanyId()) until it is set, so
  // a hard load of a sub-route never renders before a company is selected.
  if (!companyId) return <FullScreenSpinner />;

  return <DashboardShell>{children}</DashboardShell>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending) return <FullScreenSpinner />;
  if (!session?.user) return null;

  return (
    <CompanyProvider>
      <DashboardBody userId={session.user.id}>{children}</DashboardBody>
    </CompanyProvider>
  );
}

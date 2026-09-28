"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Building2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { Button, Card, Spinner } from "@/components/ui";
import { Logo } from "@/components/logo";

interface InviteInfo {
  email: string;
  companyName: string;
  role: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED" | string;
  expiresAt: string;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-paper px-4 py-12">
      <Logo size="lg" />
      {children}
    </main>
  );
}

function roleLabel(role: string) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => api.get<InviteInfo>(`/invitations/${token}`),
    retry: false,
  });

  async function accept() {
    setAcceptError(null);
    setAccepting(true);
    try {
      await api.post("/invitations/accept", { code: token });
      router.push("/app");
    } catch (e) {
      setAccepting(false);
      setAcceptError(
        e instanceof ApiError ? e.message : "Could not accept the invitation. Please try again.",
      );
    }
  }

  if (isLoading || sessionPending) {
    return (
      <Shell>
        <Card className="flex w-full max-w-md items-center justify-center py-10">
          <Spinner />
        </Card>
      </Shell>
    );
  }

  if (error || !data) {
    return (
      <Shell>
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-negative/10 text-negative">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="display text-2xl text-ink">Invitation not found</h1>
          <p className="mt-2 text-sm text-muted">
            This invitation link is invalid or no longer available.
          </p>
          <div className="mt-6">
            <Link href="/login" className="font-semibold text-accent hover:text-accent-ink">
              Go to sign in
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  const inactive = data.status !== "PENDING";

  if (inactive) {
    const message =
      data.status === "ACCEPTED"
        ? "This invitation has already been used."
        : data.status === "EXPIRED"
          ? "This invitation has expired. Ask the company owner to send a new one."
          : "This invitation is no longer valid.";
    return (
      <Shell>
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-ink/5 text-muted">
            <AlertCircle className="size-6" />
          </div>
          <h1 className="display text-2xl text-ink">Invitation unavailable</h1>
          <p className="mt-2 text-sm text-muted">{message}</p>
          <div className="mt-6">
            <Link href="/login" className="font-semibold text-accent hover:text-accent-ink">
              Go to sign in
            </Link>
          </div>
        </Card>
      </Shell>
    );
  }

  const loggedIn = Boolean(session?.user);

  return (
    <Shell>
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Building2 className="size-6" />
        </div>
        <h1 className="display text-2xl text-ink">
          You&rsquo;ve been invited to join {data.companyName}
        </h1>
        <p className="mt-2 text-sm text-muted">
          as <span className="font-semibold text-ink">{roleLabel(data.role)}</span>. The invite was
          sent to <span className="font-semibold text-ink">{data.email}</span>.
        </p>

        {loggedIn ? (
          <div className="mt-6 space-y-3">
            {acceptError && <p className="text-sm text-negative">{acceptError}</p>}
            <Button onClick={accept} loading={accepting} className="w-full">
              Accept invitation
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              Sign in or create an account to accept. You can return to this link afterwards.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="w-full" onClick={() => router.push("/login")}>
                Sign in
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/register")}
              >
                Create account
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Shell>
  );
}

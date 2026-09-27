import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";

const router = { replace: vi.fn(), push: vi.fn() };
const signOut = vi.fn();
const useSession = vi.fn();
const apiGet = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth-client", () => ({
  authClient: { signOut: () => signOut() },
  useSession: () => useSession(),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, api: { ...actual.api, get: (path: string) => apiGet(path) } };
});
vi.mock("@/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: ReactNode }) => (
    <div data-testid="dashboard">{children}</div>
  ),
}));

const { default: DashboardLayout } = await import("./layout");

const USER = { id: "user-1", name: "Una User", email: "una@example.ch" };

function access(overrides: Record<string, unknown> = {}) {
  return {
    user: { ...USER, emailVerified: true, avatarUrl: null, platformRole: "USER" },
    companies: [{ id: "co-1", name: "Café", slug: "cafe", logo: null, brandColor: "#2f6df0", role: "OWNER" }],
    requiresPasskey: false,
    hasPasskey: false,
    ...overrides,
  };
}

function renderLayout() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DashboardLayout>
        <p>page content</p>
      </DashboardLayout>
    </QueryClientProvider>,
  );
}

async function expectSignedOutToLogin() {
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Create your first business")).toBeNull();
}

beforeEach(() => {
  vi.clearAllMocks();
  signOut.mockResolvedValue({ data: { success: true }, error: null });
  useSession.mockReturnValue({ data: { user: USER }, isPending: false });
});

afterEach(cleanup);

describe("dashboard layout session handling", () => {
  it("signs out instead of showing onboarding when /access rejects the session", async () => {
    apiGet.mockRejectedValue(new ApiError(401, "Unauthorized"));
    renderLayout();
    await expectSignedOutToLogin();
  });

  it("signs out when /access answers for a different user than the session", async () => {
    apiGet.mockResolvedValue(
      access({
        user: { id: "user-2", name: "Other", email: "other@example.ch", emailVerified: true, avatarUrl: null, platformRole: "ADMIN" },
        companies: [],
      }),
    );
    renderLayout();
    await expectSignedOutToLogin();
  });

  it("signs out when /access has no user", async () => {
    apiGet.mockResolvedValue(access({ user: null, companies: [] }));
    renderLayout();
    await expectSignedOutToLogin();
  });

  it("shows a retry screen, not onboarding, when /access fails for another reason", async () => {
    apiGet.mockRejectedValue(new ApiError(500, "Internal server error"));
    renderLayout();
    expect(await screen.findByText("Could not load your account")).toBeTruthy();
    expect(screen.queryByText("Create your first business")).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("shows onboarding for a valid user without a business", async () => {
    apiGet.mockResolvedValue(access({ companies: [] }));
    renderLayout();
    expect(await screen.findByText("Create your first business")).toBeTruthy();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("renders the dashboard for a valid user with a business", async () => {
    apiGet.mockResolvedValue(access());
    renderLayout();
    expect(await screen.findByTestId("dashboard")).toBeTruthy();
    expect(screen.getByText("page content")).toBeTruthy();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("redirects to login when there is no session at all", async () => {
    useSession.mockReturnValue({ data: null, isPending: false });
    renderLayout();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/login"));
    expect(apiGet).not.toHaveBeenCalled();
  });
});

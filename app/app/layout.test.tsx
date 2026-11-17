import { beforeEach, describe, expect, it, vi } from "vitest";
import AppRouteLayout from "./layout";

const mocks = vi.hoisted(() => ({
  pathname: "/app/inspection/templates/new" as string | null,
  requireRouteAccess: vi.fn()
}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => mocks.pathname })
}));
vi.mock("@/lib/require-auth", () => ({ requireRouteAccess: mocks.requireRouteAccess }));
vi.mock("@/components/layout/dasbhoard/ResponsiveSidebarProvider", () => ({
  ResponsiveSidebarProvider: ({ children }: { children: React.ReactNode }) => children
}));
vi.mock("@/components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => children
}));
vi.mock("@/components/auth/ModuleAccessGuard", () => ({
  ModuleAccessGuard: ({ children }: { children: React.ReactNode }) => children
}));

describe("app route server boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/app/inspection/templates/new";
    mocks.requireRouteAccess.mockResolvedValue(undefined);
  });

  it("checks the requested nested URL before returning the page layout", async () => {
    await AppRouteLayout({ children: <p>Protected page</p> });
    expect(mocks.requireRouteAccess).toHaveBeenCalledWith("/app/inspection/templates/new");
  });

  it("does not return the layout when authorization rejects the request", async () => {
    mocks.requireRouteAccess.mockRejectedValue(new Error("redirect:/unauthorized"));
    await expect(AppRouteLayout({ children: <p>Protected page</p> }))
      .rejects.toThrow("redirect:/unauthorized");
  });

  it("fails closed if trusted pathname forwarding is missing", async () => {
    mocks.pathname = null;
    await expect(AppRouteLayout({ children: <p>Protected page</p> }))
      .rejects.toThrow("Unable to determine module route");
    expect(mocks.requireRouteAccess).not.toHaveBeenCalled();
  });
});

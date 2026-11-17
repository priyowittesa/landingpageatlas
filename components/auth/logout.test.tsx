import { Children, isValidElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, redirect, signIn } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`Redirect: ${url}`);
  }),
  signIn: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useEffect: (effect: () => void) => effect(),
  };
});
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("next-auth/react", () => ({ signIn }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-atlas-pathname": "/app/workspace-dashboard" }),
}));
vi.mock("@/components/ui/button", () => ({ Button: () => null }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/auth-routes", () => ({
  KEYCLOAK_LOGIN_URL: "/auth/login",
  KEYCLOAK_LOGOUT_CALLBACK_URL: "/auth/login",
}));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("@/lib/rbac-access", () => ({
  hasModuleAccess: vi.fn(),
  hasRouteAccess: vi.fn(() => true),
}));
vi.mock("@/lib/require-auth", () => import("../../lib/require-auth"));
vi.mock("@/components/layout/AppLayout", () => ({ AppLayout: () => null }));
vi.mock("@/components/layout/dasbhoard/ResponsiveSidebarProvider", () => ({
  ResponsiveSidebarProvider: () => null,
}));

import AppRouteLayout from "../../app/app/layout";
import LoginPage from "../../app/auth/login/page";
import { Button } from "@/components/ui/button";
import { keycloakSignOut } from "../../lib/keycloak-logout";
import { requireAuth } from "../../lib/require-auth";

function findSignInButton(node: ReactNode): (() => void) | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; onClick?: () => void }>(child)) {
      continue;
    }
    if (child.type === Button) return child.props.onClick;
    const onClick = findSignInButton(child.props.children);
    if (onClick) return onClick;
  }
}

describe("logout and protected routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      Response.json({ data: { rbac: { modules: [] } } })
    ));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts logout without scheduling another sign-in", async () => {
    const storage = { setItem: vi.fn() };
    const location = { href: "" };
    vi.stubGlobal("sessionStorage", storage);
    vi.stubGlobal("window", { location });

    await keycloakSignOut();

    expect(location.href).toBe(
      "/api/auth/keycloak-logout?callbackUrl=%2Fauth%2Flogin"
    );
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("does not sign in automatically, even with an old logout flag", () => {
    vi.stubGlobal("sessionStorage", {
      getItem: vi.fn(() => "1"),
      removeItem: vi.fn(),
    });

    const button = findSignInButton(LoginPage());
    expect(signIn).not.toHaveBeenCalled();
    expect(button).toBeDefined();

    button?.();
    expect(signIn).toHaveBeenCalledOnce();
    expect(signIn).toHaveBeenCalledWith("keycloak", {
      callbackUrl: "/auth/redirect",
    });
  });

  it.each([
    ["missing session", null],
    ["missing access token", {}],
    ["expired refresh token", { accessToken: "token", error: "RefreshTokenExpired" }],
  ])("redirects a direct request with a %s", async (_, session) => {
    getServerSession.mockResolvedValue(session);
    await expect(AppRouteLayout({ children: "private content" })).rejects.toThrow(
      "Redirect: /auth/login"
    );
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("allows a valid session", async () => {
    const session = { accessToken: "token" };
    getServerSession.mockResolvedValue(session);
    await expect(requireAuth()).resolves.toBe(session);
    await expect(
      AppRouteLayout({ children: "private content" })
    ).resolves.toBeDefined();
    expect(redirect).not.toHaveBeenCalled();
  });
});

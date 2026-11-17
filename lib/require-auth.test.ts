import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { requireRouteAccess } from "./require-auth";

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  fetch: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`redirect:${path}`); })
}));
vi.mock("next-auth", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "https://api.example.test" } }));

describe("server route authorization", () => {
  afterEach(() => vi.unstubAllGlobals());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
    mocks.getServerSession.mockResolvedValue({ accessToken: "access-token" });
    mocks.fetch.mockResolvedValue(Response.json({
      data: { rbac: { modules: [{
        id: "inspection", key: "inspection", name: "Inspection",
        href: "/inspection", access_level: "no_access"
      }] } }
    }));
  });

  it("redirects a signed-in user away from a denied direct URL", async () => {
    await expect(requireRouteAccess("/app/inspection/templates/new"))
      .rejects.toThrow("redirect:/unauthorized");
    expect(mocks.fetch).toHaveBeenCalledWith("https://api.example.test/v1/auth/me", {
      headers: { Authorization: "Bearer access-token" },
      cache: "no-store"
    });
  });

  it("allows shared workspace routes and granted modules", async () => {
    await expect(requireRouteAccess("/app/workspace-dashboard")).resolves.toBeUndefined();
    mocks.fetch.mockResolvedValue(Response.json({
      data: { rbac: { modules: [{
        id: "inspection", key: "inspection", name: "Inspection",
        href: "/inspection", access_level: "view_only"
      }] } }
    }));
    await expect(requireRouteAccess("/app/inspection/templates")).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("requires login before querying permissions", async () => {
    mocks.getServerSession.mockResolvedValue(null);
    await expect(requireRouteAccess("/app/inspection")).rejects.toThrow("redirect:/auth/login");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it.each([undefined, false])("denies Data Access when is_admin is %s", async (isAdmin) => {
    mocks.fetch.mockImplementation(async () => Response.json({
      data: { is_admin: isAdmin, rbac: { modules: [] } }
    }));
    for (const path of ["/app/data-access", "/app/data-access/module-id/edit"]) {
      await expect(requireRouteAccess(path)).rejects.toThrow("redirect:/unauthorized");
    }
  });

  it("allows admins into Data Access without module grants", async () => {
    mocks.fetch.mockImplementation(async () => Response.json({
      data: { is_admin: true, rbac: { modules: [] } }
    }));
    await expect(requireRouteAccess("/app/data-access")).resolves.toBeUndefined();
    await expect(requireRouteAccess("/app/data-access/module-id/edit")).resolves.toBeUndefined();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("fails closed when the permission service is unavailable", async () => {
    mocks.fetch.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(requireRouteAccess("/app/inspection")).rejects.toThrow("Unable to verify module access");
  });

  it("fails closed for malformed profile responses, even on shared routes", async () => {
    mocks.fetch.mockResolvedValue(Response.json({}));
    await expect(requireRouteAccess("/app/workspace-dashboard"))
      .rejects.toThrow("Unable to verify module access");
  });
});

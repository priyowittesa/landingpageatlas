import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerSession, env } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  env: {
    nextAuthUrl: "https://atlas.example.com",
    keycloakIssuer: "https://sso.example.com/realms/atlas",
    keycloakClientId: "atlas",
  },
}));

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/auth-routes", () => ({ KEYCLOAK_LOGIN_URL: "/auth/login" }));
vi.mock("@/lib/env", () => ({ env }));

import { GET } from "./route";

describe("Keycloak logout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSession.mockResolvedValue({ idToken: "id-token" });
  });

  it("clears session cookie chunks before redirecting to Keycloak logout", async () => {
    const request = new NextRequest(
      "https://atlas.example.com/api/auth/keycloak-logout?callbackUrl=%2Fauth%2Flogin",
      {
        headers: {
          cookie: "__Secure-next-auth.session-token.0=part1; __Secure-next-auth.session-token.1=part2",
        },
      }
    );
    const response = await GET(request);
    const destination = new URL(response.headers.get("location")!);

    expect(destination.origin + destination.pathname).toBe(
      "https://sso.example.com/realms/atlas/protocol/openid-connect/logout"
    );
    expect(destination.searchParams.get("id_token_hint")).toBe("id-token");
    expect(destination.searchParams.get("post_logout_redirect_uri")).toBe(
      "https://atlas.example.com/auth/login"
    );
    for (const name of [
      "next-auth.session-token",
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.session-token.0",
      "__Secure-next-auth.session-token.1",
    ]) {
      expect(response.cookies.get(name)?.value).toBe("");
      expect(response.cookies.get(name)?.expires).toEqual(new Date(0));
    }
  });

  it("uses the client ID to end the SSO session when there is no ID token", async () => {
    getServerSession.mockResolvedValue(null);
    const response = await GET(
      new NextRequest("https://atlas.example.com/api/auth/keycloak-logout")
    );
    const destination = new URL(response.headers.get("location")!);

    expect(destination.searchParams.get("client_id")).toBe("atlas");
    expect(destination.searchParams.get("post_logout_redirect_uri")).toBe(
      "https://atlas.example.com/auth/login"
    );
    expect(response.cookies.get("__Secure-next-auth.session-token")?.value).toBe("");
  });
});

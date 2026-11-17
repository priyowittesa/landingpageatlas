import axios, { AxiosError, type AxiosAdapter } from "axios";
import type { Session } from "next-auth";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authOptions } from "./auth";
import { axiosConfig } from "./axios";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/env", () => ({
  env: { apiBaseUrl: "https://api.example.test" },
}));

describe("refresh token API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["rotated-refresh-token", undefined])(
    "refreshes expired NextAuth tokens with refresh token rotation: %s",
    async (refreshToken) => {
      mocks.fetch.mockResolvedValue(Response.json({
        status: true,
        data: {
          access_token: "new-access-token",
          refresh_token: refreshToken,
        },
      }));
      const jwt = authOptions.callbacks!.jwt!;
      const token = {
        accessToken: "expired-access-token",
        refreshToken: "original-refresh-token",
        accessTokenExpiry: 0,
        provider: "credentials",
      };

      const refreshed = await jwt({ token } as Parameters<typeof jwt>[0]);

      expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(
        "https://api.example.test/v1/auth/refresh",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: "original-refresh-token" }),
        }
      );
      expect(refreshed).toMatchObject({
        accessToken: "new-access-token",
        refreshToken: refreshToken ?? "original-refresh-token",
        error: undefined,
      });
      expect(refreshed.accessTokenExpiry).toBeGreaterThan(Date.now());
    }
  );

  it("refreshes on an Axios 401 and retries with the new access token", async () => {
    mocks.getSession.mockResolvedValue({
      accessToken: "expired-access-token",
      refreshToken: "original-refresh-token",
    } satisfies Partial<Session>);
    const post = vi.spyOn(axios, "post")
      .mockResolvedValueOnce({
        data: {
          data: {
            access_token: "new-access-token",
            refresh_token: "rotated-refresh-token",
          },
        },
      })
      .mockResolvedValueOnce({ data: {} });
    vi.spyOn(axios, "get").mockResolvedValue({
      data: { csrfToken: "csrf-token" },
    });
    const adapter = vi.fn<AxiosAdapter>().mockImplementation(async (config) => {
      const response = {
        data: { ok: true },
        status: config.headers.Authorization === "Bearer new-access-token" ? 200 : 401,
        statusText: "",
        headers: {},
        config,
      };
      if (response.status === 401) {
        throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, response);
      }
      return response;
    });

    const response = await axiosConfig().get("/protected", { adapter });

    expect(response.data).toEqual({ ok: true });
    expect(adapter).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/v1/auth/refresh",
      { refresh_token: "original-refresh-token" }
    );
    expect(post).toHaveBeenNthCalledWith(2, "/api/auth/session", {
      csrfToken: "csrf-token",
      data: {
        accessToken: "new-access-token",
        refreshToken: "rotated-refresh-token",
        accessTokenExpiry: expect.any(Number),
      },
    });
  });
});

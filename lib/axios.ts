import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosError,
} from "axios";
import { getSession } from "next-auth/react";
import { env } from "@/lib/env";

// Must match ACCESS_TOKEN_TTL_MS in lib/auth.ts so the persisted expiry
// stays consistent with what the jwt() callback expects.
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;

let refreshPromise: Promise<string | null> | null = null;

/**
 * Push freshly-refreshed tokens back into the NextAuth JWT cookie by
 * triggering the "update" flow (POST /api/auth/session). Without this the
 * session keeps holding the stale access token, so every request 401s and
 * the refresh-token rotation eventually breaks — which is exactly what
 * forces users to reload the page after being idle.
 */
async function persistRefreshedSession(data: {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
}): Promise<void> {
  try {
    const csrfRes = await axios.get("/api/auth/csrf");
    const csrfToken = csrfRes.data?.csrfToken;
    if (!csrfToken) return;
    await axios.post("/api/auth/session", { csrfToken, data });
  } catch (err) {
    // Non-fatal: the retried request still uses the new token via the
    // explicit header. Persisting just keeps future requests healthy.
    console.warn("[axios] Failed to persist refreshed session:", err);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const session = await getSession();
      if (!session?.refreshToken) {
        console.warn("[axios] No refresh token in session — cannot refresh.");
        return null;
      }
      const res = await axios.post(`${env.apiBaseUrl}/v1/auth/refresh`, {
        refresh_token: session.refreshToken,
      });
      const accessToken: string | undefined = res.data?.data?.access_token;
      if (!accessToken) {
        console.warn("[axios] Refresh response missing access_token:", res.data);
        return null;
      }
      // Backends commonly rotate the refresh token on each refresh; keep
      // whichever we get back so the next refresh doesn't fail.
      const refreshToken: string =
        res.data?.data?.refresh_token ?? session.refreshToken;
      const accessTokenExpiry = Date.now() + ACCESS_TOKEN_TTL_MS;
      void persistRefreshedSession({ accessToken, refreshToken, accessTokenExpiry });
      return accessToken;
    } catch (err) {
      console.error("[axios] Token refresh failed:", err);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export function axiosConfig(baseURL?: string): AxiosInstance {
  const instance = axios.create({
    baseURL: baseURL ?? env.apiBaseUrl,
    timeout: 30_000,
    headers: { "Content-Type": "application/json" },
  });

  instance.interceptors.request.use(async (config) => {
    // Only attach the session token when the caller hasn't already set one.
    // The 401 retry path sets an explicit Authorization header with the
    // freshly-refreshed token; re-running getSession() here would otherwise
    // overwrite it with the (still-stale) session token and make the retry
    // fail again — which is what previously forced a page reload.
    const existingAuth =
      config.headers?.Authorization ??
      (config.headers as Record<string, unknown> | undefined)?.authorization;
    if (existingAuth) return config;

    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {
        _retry?: boolean;
      };
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const newToken = await refreshAccessToken();
        if (newToken) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          };
          return instance(originalRequest);
        }
        // Don't signOut here — the useAutoSignOut hook handles actual
        // session expiry (when the JWT-level refresh also fails). A 401
        // from a specific endpoint (e.g. permissions) should not log out
        // the user.
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

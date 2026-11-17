import { env } from "@/lib/env";

/**
 * Lightweight fetch helper for calling the backend API.
 *
 * Pass the Keycloak access_token from the NextAuth session:
 *   const session = await getServerSession(authOptions);
 *   const data = await apiClient("/users/me", { accessToken: session.accessToken });
 *
 * The backend receives:  Authorization: Bearer <access_token>
 * The backend validates the token with Keycloak and reads roles from
 * token.resource_access[clientId].roles.
 */
export async function apiClient<T = unknown>(
  path: string,
  options: {
    accessToken?: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const { accessToken, method = "GET", body, headers } = options;

  const res = await fetch(`${env.apiBaseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      // Attach the Keycloak access token so the backend can validate it
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<T>;
}

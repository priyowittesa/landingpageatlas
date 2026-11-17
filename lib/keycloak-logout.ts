import { KEYCLOAK_LOGOUT_CALLBACK_URL } from "@/lib/auth-routes";

/**
 * Client-side Keycloak SSO logout.
 *
 * Redirects to a server-side route handler that:
 *   1. Reads the id_token from the NextAuth session (server-only env access)
 *   2. Clears the NextAuth session cookie
 *   3. Redirects to Keycloak's end-session endpoint with id_token_hint
 *
 * This must run through a server route because KEYCLOAK_ISSUER is a
 * server-only env var — it is not available in the browser.
 */
export async function keycloakSignOut(
  callbackUrl = KEYCLOAK_LOGOUT_CALLBACK_URL,
) {
  window.location.href = `/api/auth/keycloak-logout?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}

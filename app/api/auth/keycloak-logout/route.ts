import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";
import { env } from "@/lib/env";

const NEXT_AUTH_COOKIE_PATTERN = /^(?:__Secure-|__Host-)?next-auth\./;

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const idToken = session?.idToken;
  const requestedCallbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  const callbackUrl =
    requestedCallbackUrl?.startsWith("/") &&
      !requestedCallbackUrl.startsWith("//")
      ? requestedCallbackUrl
      : KEYCLOAK_LOGIN_URL;
  const redirectUri = new URL(callbackUrl, env.nextAuthUrl).toString();
  let response: NextResponse;

  if (env.keycloakIssuer) {
    const clientId = env.keycloakClientId;
    const params = new URLSearchParams({
      post_logout_redirect_uri: redirectUri,
    });
    if (idToken) params.set("id_token_hint", idToken);
    else if (clientId) params.set("client_id", clientId);
    const logoutUrl = `${env.keycloakIssuer}/protocol/openid-connect/logout?${params.toString()}`;

    // Clear all NextAuth cookies, then end the Keycloak browser session too.
    response = idToken || clientId
      ? NextResponse.redirect(logoutUrl)
      : NextResponse.redirect(redirectUri);
  } else {
    // No idToken — just redirect to login
    response = NextResponse.redirect(redirectUri);
  }

  const sessionCookieNames = new Set([
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    ...request.cookies
      .getAll()
      .map(({ name }) => name)
      .filter((name) => NEXT_AUTH_COOKIE_PATTERN.test(name)),
  ]);

  for (const name of sessionCookieNames) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: name.startsWith("__Secure-") || name.startsWith("__Host-"),
    });
  }

  return response;
}

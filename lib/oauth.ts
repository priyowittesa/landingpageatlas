import { env } from "@/lib/env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export function getGoogleOAuthUrl(forceSelectAccount = false): string {
  const params = new URLSearchParams({
    client_id: env.googleClientId ?? "",
    redirect_uri: env.googleRedirectUri ?? "",
    response_type: "code",
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/adwords",
    ].join(" "),
    access_type: "online",
    prompt: forceSelectAccount ? "select_account consent" : "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

const YAHOO_AUTH_URL = "https://api.login.yahoo.com/oauth2/request_auth";

export function getYahooOAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env.yahooClientId ?? "",
    redirect_uri: env.yahooRedirectUri ?? "",
    response_type: "code",
    scope: "openid email profile",
  });
  return `${YAHOO_AUTH_URL}?${params.toString()}`;
}

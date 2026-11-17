/**
 * ─── NextAuth configuration with Keycloak SSO ──────────────────────
 *
 * This file configures NextAuth to use Keycloak as the identity provider
 * via the standard OIDC (OpenID Connect) authorization code flow.
 *
 * Flow:
 *   1. User clicks "Sign in with Keycloak" → signIn("keycloak")
 *   2. NextAuth redirects to Keycloak's login page
 *   3. User logs in on Keycloak (not on our app)
 *   4. Keycloak redirects back to /api/auth/callback/keycloak with code
 *   5. NextAuth exchanges the code for access_token, id_token, refresh_token
 *   6. The jwt() callback saves these tokens + extracted roles into the JWT
 *   7. The session() callback exposes them to useSession() / getServerSession()
 *
 * The access_token is sent to the backend as: Authorization: Bearer <token>
 * The backend validates the token with Keycloak and reads roles from
 * token.resource_access[KEYCLOAK_CLIENT_ID].roles.
 */
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KeycloakProvider from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";
import { env } from "./env";
import type { UserRole } from "@/types/next-auth";

const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_BUFFER_MS = 60 * 1000;

type AppUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  phoneNumber: string | null;
  profilePictureUrl: string | null;
};

function isAppUser(user: unknown): user is AppUser {
  return (
    typeof user === "object" &&
    user !== null &&
    "accessToken" in user &&
    "refreshToken" in user
  );
}

// Keycloak access tokens contain a "resource_access" field that maps
// client IDs to their roles. Example:
//   "resource_access": {
//     "website-a": { "roles": ["admin", "user"] },
//     "website-b": { "roles": ["viewer"] }
//   }
// We only read roles for THIS website's cli  ent ID (KEYCLOAK_CLIENT_ID).
// This is how the same user can have different roles on different websites.
type KeycloakResourceAccess = {
  resource_access?: Record<string, { roles?: string[] }>;
};

function extractKeycloakRoles(accessToken: string): string[] {
  try {
    const decoded = jwtDecode<KeycloakResourceAccess>(accessToken);
    const clientId = env.keycloakClientId;
    if (!clientId) return [];
    return decoded.resource_access?.[clientId]?.roles ?? [];
  } catch {
    return [];
  }
}

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const res = await fetch(`${env.apiBaseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refreshToken }),
    });
    const json = await res.json();
    if (!res.ok || !json.status) throw new Error(json.message);

    return {
      ...token,
      accessToken: json.data.access_token,
      refreshToken: json.data.refresh_token ?? token.refreshToken,
      accessTokenExpiry: Date.now() + ACCESS_TOKEN_TTL_MS,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshTokenExpired" as const };
  }
}

async function refreshKeycloakToken(token: Record<string, unknown>) {
  try {
    const clientId = env.keycloakClientId;
    const clientSecret = env.keycloakClientSecret;
    const issuer = env.keycloakIssuer;
    if (!clientId || !clientSecret || !issuer) {
      return { ...token, error: "RefreshTokenExpired" as const };
    }
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refreshToken as string,
    });
    const res = await fetch(
      `${issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error_description ?? json.error);

    return {
      ...token,
      accessToken: json.access_token,
      idToken: json.id_token ?? token.idToken,
      refreshToken: json.refresh_token ?? token.refreshToken,
      accessTokenExpiry: Date.now() + json.expires_in * 1000,
      roles: extractKeycloakRoles(json.access_token),
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshTokenExpired" as const };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const loginRes = await fetch(`${env.apiBaseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
          }),
        });
        const loginJson = await loginRes.json();
        if (!loginRes.ok || !loginJson.status)
          throw new Error(loginJson.message ?? "Login failed");

        const { access_token, refresh_token } = loginJson.data;

        const meRes = await fetch(`${env.apiBaseUrl}/auth/me`, {
          headers: { Authorization: access_token },
        });
        const meJson = await meRes.json();

        return {
          id: meJson.data.id,
          name: meJson.data.full_name,
          email: meJson.data.email,
          role: meJson.data.role,
          accessToken: access_token,
          refreshToken: refresh_token,
          phoneNumber: meJson.data.phone_number,
          profilePictureUrl: meJson.data.profile_picture_url,
        };
      },
    }),

    CredentialsProvider({
      id: "google-oauth",
      name: "Google",
      credentials: {
        code: { label: "Code", type: "text" },
        scope: { label: "Scope", type: "text" },
        authuser: { label: "Auth User", type: "text" },
        prompt: { label: "Prompt", type: "text" },
        iss: { label: "Iss", type: "text" },
      },
      async authorize(credentials) {
        const params = new URLSearchParams({
          code: credentials?.code ?? "",
          scope: credentials?.scope ?? "",
          authuser: credentials?.authuser ?? "",
          prompt: credentials?.prompt ?? "",
          iss: credentials?.iss ?? "",
        });
        const res = await fetch(
          `${env.apiBaseUrl}/auth/google/callback?${params.toString()}`
        );
        const json = await res.json();
        if (!res.ok || !json.status) return null;

        const { access_token, refresh_token } = json.data;
        const meRes = await fetch(`${env.apiBaseUrl}/auth/me`, {
          headers: { Authorization: access_token },
        });
        const meJson = await meRes.json();

        return {
          id: meJson.data.id,
          name: meJson.data.full_name,
          email: meJson.data.email,
          role: meJson.data.role,
          accessToken: access_token,
          refreshToken: refresh_token,
          phoneNumber: meJson.data.phone_number,
          profilePictureUrl: meJson.data.profile_picture_url,
        };
      },
    }),

    CredentialsProvider({
      id: "yahoo-oauth",
      name: "Yahoo",
      credentials: {
        code: { label: "Code", type: "text" },
        state: { label: "State", type: "text" },
      },
      async authorize(credentials) {
        const params = new URLSearchParams({
          code: credentials?.code ?? "",
          state: credentials?.state ?? "",
        });
        const res = await fetch(
          `${env.apiBaseUrl}/auth/yahoo/callback?${params.toString()}`
        );
        const json = await res.json();
        if (!res.ok || !json.status) return null;

        const { access_token, refresh_token } = json.data;
        const meRes = await fetch(`${env.apiBaseUrl}/auth/me`, {
          headers: { Authorization: access_token },
        });
        const meJson = await meRes.json();

        return {
          id: meJson.data.id,
          name: meJson.data.full_name,
          email: meJson.data.email,
          role: meJson.data.role,
          accessToken: access_token,
          refreshToken: refresh_token,
          phoneNumber: meJson.data.phone_number,
          profilePictureUrl: meJson.data.profile_picture_url,
        };
      },
    }),

    ...(env.keycloakClientId && env.keycloakClientSecret && env.keycloakIssuer
      ? [
        KeycloakProvider({
          clientId: env.keycloakClientId,
          clientSecret: env.keycloakClientSecret,
          issuer: env.keycloakIssuer,
          authorization: {
            params: {
              scope: "openid email profile roles",
            },
          },
        }),
      ]
      : []),
  ],

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // The client-side axios interceptor refreshes access tokens on 401
      // and pushes the refreshed tokens back here via update() so the JWT
      // cookie stays in sync (including refresh-token rotation). Without
      // this, the session would keep serving the stale access token and
      // every request would 401 again until the user reloads the page.
      if (trigger === "update" && session && typeof session === "object") {
        const incoming = session as {
          accessToken?: string;
          refreshToken?: string;
          accessTokenExpiry?: number;
        };
        if (incoming.accessToken) token.accessToken = incoming.accessToken;
        if (incoming.refreshToken) token.refreshToken = incoming.refreshToken;
        if (incoming.accessTokenExpiry)
          token.accessTokenExpiry = incoming.accessTokenExpiry;
        token.error = undefined;
        return token;
      }

      // Initial sign-in from credentials providers
      if (user && isAppUser(user)) {
        return {
          ...token,
          id: user.id,
          role: user.role,
          roles: [],
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpiry: Date.now() + ACCESS_TOKEN_TTL_MS,
          phoneNumber: user.phoneNumber,
          profilePictureUrl: user.profilePictureUrl,
          provider: "credentials",
        };
      }

      // Initial sign-in from Keycloak
      if (account?.provider === "keycloak" && account.access_token) {
        const roles = extractKeycloakRoles(account.access_token);
        return {
          ...token,
          id: token.sub,
          roles,
          accessToken: account.access_token,
          idToken: account.id_token,
          refreshToken: account.refresh_token,
          accessTokenExpiry: account.expires_at
            ? account.expires_at * 1000
            : Date.now() + ACCESS_TOKEN_TTL_MS,
          provider: "keycloak",
        };
      }

      // Return early if no access token (not yet signed in)
      if (!token.accessToken) return token;

      const isExpired =
        Date.now() > (token.accessTokenExpiry as number) - REFRESH_BUFFER_MS;
      if (!isExpired) return token;

      // Refresh using the correct provider's token endpoint
      if (token.provider === "keycloak") {
        return refreshKeycloakToken(token as Record<string, unknown>);
      }
      return refreshAccessToken(token as Record<string, unknown>);
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? session.user.id;
        session.user.role = token.role as UserRole;
        session.user.roles = (token.roles as string[]) ?? [];
        session.user.phoneNumber = token.phoneNumber as string | null;
        session.user.profilePictureUrl = token.profilePictureUrl as string | null;
      }
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string | undefined;
      session.idToken = token.idToken as string | undefined;
      session.roles = (token.roles as string[]) ?? [];
      session.error = token.error as "RefreshTokenExpired" | undefined;
      return session;
    },
  },
};

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";
import { env } from "@/lib/env";
import type { AuthMeData } from "@/hooks/useAuthMe";
import type { ApiResponse } from "@/types/api";
import { hasModuleAccess, hasRouteAccess } from "@/lib/rbac-access";

export async function requireAuth(): Promise<Session> {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || session.error === "RefreshTokenExpired") {
    redirect(KEYCLOAK_LOGIN_URL);
  }
  return session;
}

export async function requireModuleAccess(
  moduleKey: string,
  route: string
): Promise<void> {
  const session = await requireAuth();
  const response = await fetch(`${env.apiBaseUrl}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Unable to verify module access");
  const profile = (await response.json()) as ApiResponse<AuthMeData>;
  if (!hasModuleAccess(profile.data?.rbac?.modules, moduleKey, route)) {
    redirect("/unauthorized");
  }
}

export async function requireRouteAccess(pathname: string): Promise<void> {
  const session = await requireAuth();
  const response = await fetch(`${env.apiBaseUrl}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Unable to verify module access");
  const profile = (await response.json()) as ApiResponse<AuthMeData>;
  if (!profile.data) throw new Error("Unable to verify module access");
  if (!hasRouteAccess(profile.data.rbac?.modules, pathname, profile.data.is_admin)) {
    redirect("/unauthorized");
  }
}

export async function requireCompany(companyName: string): Promise<void> {
  const session = await requireAuth();
  const response = await fetch(`${env.apiBaseUrl}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) throw new Error("Unable to verify company access");
  const profile = (await response.json()) as ApiResponse<AuthMeData>;
  if (profile.data?.company?.company_name !== companyName) {
    redirect("/unauthorized");
  }
}

export async function requireRole(role: string): Promise<Session> {
  const session = await requireAuth();
  if (!session.roles?.includes(role)) {
    redirect("/unauthorized");
  }
  return session;
}

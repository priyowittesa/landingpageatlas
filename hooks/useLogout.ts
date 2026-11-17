"use client";

import { useState } from "react";
import { keycloakSignOut } from "@/lib/keycloak-logout";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false);

  async function logout() {
    setIsLoading(true);
    await keycloakSignOut(KEYCLOAK_LOGIN_URL);
  }

  return { logout, isLoading };
}

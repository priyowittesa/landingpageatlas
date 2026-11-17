"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { keycloakSignOut } from "@/lib/keycloak-logout";

export function useAutoSignOut() {
  const { data: session } = useSession();
  useEffect(() => {
    if (session?.error === "RefreshTokenExpired") {
      void keycloakSignOut();
    }
  }, [session?.error]);
}

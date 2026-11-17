"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { keycloakSignOut } from "@/lib/keycloak-logout";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";

export function LogoutButton({
  children = "Sign out",
  callbackUrl = KEYCLOAK_LOGIN_URL,
}: {
  children?: React.ReactNode;
  callbackUrl?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      variant="ghost"
      onClick={() => {
        setIsLoading(true);
        void keycloakSignOut(callbackUrl);
      }}
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : children}
    </Button>
  );
}

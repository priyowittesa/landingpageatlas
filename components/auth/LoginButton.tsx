"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LoginButton({
  provider = "keycloak",
  children = "Sign in",
  callbackUrl = "/auth/redirect"
}: {
  provider?: string;
  children?: React.ReactNode;
  callbackUrl?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Button
      onClick={() => {
        setIsLoading(true);
        signIn(provider, { callbackUrl });
      }}
      disabled={isLoading}
    >
      {isLoading ? "Redirecting..." : children}
    </Button>
  );
}

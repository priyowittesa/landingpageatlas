"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

// This page does NOT contain a custom login form.
// Clicking the button redirects the user to Keycloak's own login page.
// Keycloak handles authentication and returns an access_token to NextAuth.
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sign in to ATLAS</h1>
          <p className="mt-1 text-sm text-gray-500">
            You will be redirected to sign in.
          </p>
        </div>

        {/* signIn("keycloak") sends the user to Keycloak's OIDC login page.
            After successful login, Keycloak redirects back to NextAuth's
            callback URL (/api/auth/callback/keycloak) with the access_token. */}
        <Button
          className="w-full"
          onClick={() => signIn("keycloak", { callbackUrl: "/auth/redirect" })}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}

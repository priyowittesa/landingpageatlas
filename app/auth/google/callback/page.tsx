"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const scope = searchParams.get("scope");
    const authuser = searchParams.get("authuser");
    const prompt = searchParams.get("prompt");
    const iss = searchParams.get("iss");

    if (!code) {
      router.push(KEYCLOAK_LOGIN_URL);
      return;
    }

    signIn("google-oauth", {
      code,
      scope,
      authuser,
      prompt,
      iss,
      redirect: false,
      callbackUrl: "/auth/redirect"
    }).then((result) => {
      if (result?.error) {
        router.push(KEYCLOAK_LOGIN_URL);
      } else {
        router.push(result?.url ?? "/auth/redirect");
      }
    });
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">Completing Google sign-in...</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }
    >
      <GoogleCallbackHandler />
    </Suspense>
  );
}

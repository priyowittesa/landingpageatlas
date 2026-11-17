"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";

function YahooCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      router.push(KEYCLOAK_LOGIN_URL);
      return;
    }

    signIn("yahoo-oauth", {
      code,
      state,
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
      <p className="text-sm text-gray-500">Completing Yahoo sign-in...</p>
    </div>
  );
}

export default function YahooCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }
    >
      <YahooCallbackHandler />
    </Suspense>
  );
}

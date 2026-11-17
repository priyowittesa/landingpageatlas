"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { KEYCLOAK_LOGIN_URL } from "@/lib/auth-routes";

export default function RedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user) {
      router.push("/app/workspace-dashboard");
    } else {
      router.push(KEYCLOAK_LOGIN_URL);
    }
  }, [session, status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-gray-500">Redirecting...</p>
    </div>
  );
}

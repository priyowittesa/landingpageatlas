"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/auth/redirect",
      });
      if (result?.error) {
        setError(result.error);
        return null;
      }
      router.push(result?.url ?? "/auth/redirect");
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}

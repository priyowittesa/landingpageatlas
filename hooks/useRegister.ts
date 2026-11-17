"use client";

import { useState } from "react";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { AuthRegisterFormDto } from "@/types/type-auth";
import type { ApiResponse } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register(payload: AuthRegisterFormDto) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.post<ApiResponse<null>>(
        `${env.apiBaseUrl}/auth/register`,
        payload
      );
      return res.data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { register, isLoading, error };
}

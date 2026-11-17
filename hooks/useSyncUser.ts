"use client";

import { useState } from "react";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

export type SyncedUser = {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
  phone_number?: string | null;
  profile_picture_url?: string | null;
  tenant_id?: string;
};

export function useSyncUser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function syncCurrentUser(): Promise<SyncedUser | null> {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get<ApiResponse<SyncedUser>>("/v1/auth/me");
      return res.data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "User sync failed";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  return { syncCurrentUser, isLoading, error };
}

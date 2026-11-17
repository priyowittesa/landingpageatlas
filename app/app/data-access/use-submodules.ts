"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { loadPortalModules } from "./catalog";

const axios = axiosConfig(env.apiBaseUrl);

export function useSubmodules(moduleId: string, scope: string | null) {
  return useQuery({
    queryKey: ["data-access-submodules", scope, moduleId],
    queryFn: () => loadPortalModules(async (pageToken) => (
      await axios.get("/v1/portal/modules", {
        params: {
          parent_id: moduleId,
          ...(pageToken ? { page_token: pageToken } : {})
        }
      })
    ).data),
    enabled: Boolean(scope && moduleId),
    meta: { errorMessage: "Unable to load sub-modules." }
  });
}

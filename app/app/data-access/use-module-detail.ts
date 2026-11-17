"use client";

import { useQuery } from "@tanstack/react-query";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { portalModuleSchema } from "./catalog";

const axios = axiosConfig(env.apiBaseUrl);

export function useModuleDetail(moduleId: string, scope: string | null) {
  return useQuery({
    queryKey: ["data-access-module", scope, moduleId],
    queryFn: async () => {
      const response = await axios.get(`/v1/portal/modules/${encodeURIComponent(moduleId)}`);
      const detail = portalModuleSchema.parse(response.data);
      if (detail.id !== moduleId) throw new Error("The module detail does not match the requested module.");
      return detail;
    },
    enabled: Boolean(scope && moduleId),
    meta: { errorMessage: "Unable to load module details." }
  });
}

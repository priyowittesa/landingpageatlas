"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { portalModuleSchema, type PortalModule } from "./catalog";

const axios = axiosConfig(env.apiBaseUrl);
const MODULE_FIELDS = [
  "category", "href", "icon", "is_menu", "key", "monthly_price",
  "name", "order", "parent_id", "status", "version", "yearly_price"
] as const;

export async function updateModuleDescription(moduleId: string, description: string) {
  const url = `/v1/portal/modules/${encodeURIComponent(moduleId)}`;
  const response = await axios.get(url);
  const current = portalModuleSchema.passthrough().parse(response.data);
  if (current.id !== moduleId) throw new Error("The module detail does not match the requested module.");
  // PUT uses the module settings payload; preserve the latest values of other fields.
  const payload: Record<string, unknown> = { description };
  for (const field of MODULE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(current, field)) payload[field] = current[field];
  }
  await axios.put(url, payload);
}

export function useUpdateModule(moduleId: string, scope: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (description: string) => {
      if (!scope || !moduleId) throw new Error("Your session is not ready.");
      await updateModuleDescription(moduleId, description);
    },
    onSuccess: async (_result, description) => {
      const queryKey = ["data-access-module", scope, moduleId] as const;
      client.setQueryData<PortalModule>(queryKey, (previous) => previous ? { ...previous, description } : previous);
      await Promise.all([
        client.invalidateQueries({ queryKey }),
        client.invalidateQueries({ queryKey: ["data-access-catalog", scope] }),
        client.invalidateQueries({ queryKey: ["data-access-submodules", scope] }),
        client.invalidateQueries({ queryKey: ["portal-modules"] })
      ]);
    },
    meta: {
      successMessage: "Module description saved.",
      errorMessage: "Unable to save the module description."
    }
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthMe } from "@/hooks/useAuthMe";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { loadPortalModules, moduleRows } from "./catalog";

const axios = axiosConfig(env.apiBaseUrl);

export function useDataAccess() {
  const me = useAuthMe();
  const scope = me.data?.user_id
    ? `${me.data.tenant_id ?? "personal"}:${me.data.user_id}`
    : null;
  const catalog = useQuery({
    queryKey: ["data-access-catalog", scope],
    queryFn: () => loadPortalModules(async (pageToken) => (
      await axios.get("/v1/portal/modules", {
        params: pageToken ? { page_token: pageToken } : undefined
      })
    ).data),
    enabled: Boolean(scope),
    meta: { errorMessage: "Unable to load the module catalog." }
  });

  return {
    ...catalog,
    data: catalog.data ? { modules: moduleRows(catalog.data) } : undefined,
    isLoading: me.isLoading || catalog.isLoading,
    error: me.error ?? catalog.error,
    refetch: () => {
      if (me.error || !scope) return me.refetch();
      return catalog.refetch();
    },
    scope
  };
}

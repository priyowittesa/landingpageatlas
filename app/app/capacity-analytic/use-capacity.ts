"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useAuthMe } from "@/hooks/useAuthMe";
import { capacityGet, capacityListAll, capacityWrite } from "./api";
import type { Params } from "./api-types";
import { canManageCapacity } from "./permissions";

export function useCapacityAccess() {
  const pathname = usePathname();
  const auth = useAuthMe(pathname);
  const profile = auth.isFetchedAfterMount && !auth.isError ? auth.data : undefined;
  return {
    scope: profile ? `${profile.user_id}:${profile.tenant_id ?? profile.company?.id ?? "default"}` : null,
    canManage: canManageCapacity(profile?.rbac?.modules),
  };
}

export function useCapacityScope() {
  return useCapacityAccess().scope;
}

export function useCapacityQuery<T>(path: string, params?: Params, enabled = true) {
  const scope = useCapacityScope();
  return useQuery({
    queryKey: ["capacity-analytic", scope, path, params],
    queryFn: ({ signal }) => capacityGet<T>(path, params, signal),
    enabled: !!scope && enabled,
    retry: false,
  });
}

export function useCapacityOptions<T>(path: string, params?: Params, enabled = true) {
  const scope = useCapacityScope();
  return useQuery({
    queryKey: ["capacity-analytic", scope, path, "all", params],
    queryFn: ({ signal }) => capacityListAll<T>(path, params, signal),
    enabled: !!scope && enabled,
    retry: false,
  });
}

export function useCapacityMutation<T, V = void>(mutationFn: (variables: V) => Promise<T>) {
  const { scope, canManage } = useCapacityAccess();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: (variables: V) => {
      if (!scope) throw new Error("Your session is not ready. Please try again.");
      if (!canManage) throw new Error("You do not have permission to change capacity analytics.");
      return mutationFn(variables);
    },
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ["capacity-analytic", scope] }),
  });
  return { ...mutation, canManage };
}

// Validation and previews are read-only POSTs, and must not invalidate analytics.
export function useCapacityPreview<T>(path: string, body: unknown, enabled = true) {
  const scope = useCapacityScope();
  return useQuery({
    queryKey: ["capacity-analytic", scope, path, body],
    queryFn: () => capacityWrite<T>(path, body),
    enabled: !!scope && enabled,
    retry: false,
  });
}

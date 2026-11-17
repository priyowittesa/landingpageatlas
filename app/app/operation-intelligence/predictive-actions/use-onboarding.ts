"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthMe } from "@/hooks/useAuthMe";
import { hasRouteAccess } from "@/lib/rbac-access";
import {
  activateOnboarding, createOnboarding, engineError, getIndustryPack,
  getLatestOnboarding, getOnboarding, regenerateOnboarding,
  OnboardingStateChanged, type Onboarding
} from "./onboarding-api";
import { canManageOnboarding, onboardingRoute } from "./onboarding-permissions";

export const onboardingKeys = {
  latest: (scope: string | null) => ["ai-engine", scope, "onboardings", "latest"] as const,
  detail: (scope: string | null, id?: string) => ["ai-engine", scope, "onboardings", id] as const
};
const queryMeta = { suppressErrorStatuses: [400, 403, 404, 409, 422, 502] };
type Action = "create" | "regenerate" | "activate";
type ActionVariables = { action: Action; scope: string; id?: string; name: string };

export function onboardingPollInterval(query: { state: { data?: Onboarding; error?: unknown } }) {
  return query.state.data?.status === "generating" && !query.state.error ? 4000 : false;
}

export function useOnboarding() {
  const auth = useAuthMe(onboardingRoute);
  const profile = auth.isFetchedAfterMount && !auth.isError ? auth.data : undefined;
  const allowed = hasRouteAccess(profile?.rbac?.modules, onboardingRoute);
  const scope = profile && allowed
    ? `${profile.user_id}:${profile.tenant_id ?? profile.company?.id ?? "default"}`
    : null;
  const name = profile?.company?.company_name?.trim() || "Operations Intelligence";
  const canManage = canManageOnboarding(profile?.rbac?.modules);
  const client = useQueryClient();
  const activeScope = useRef(scope);
  useEffect(() => { activeScope.current = scope; }, [scope]);

  const latest = useQuery({
    queryKey: onboardingKeys.latest(scope),
    queryFn: ({ signal }) => getLatestOnboarding(signal),
    enabled: !!scope,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    retry: false,
    meta: queryMeta
  });
  const id = latest.data?.id;
  const detail = useQuery({
    queryKey: onboardingKeys.detail(scope, id),
    queryFn: ({ signal }) => getOnboarding(id!, signal),
    enabled: !!scope && !!id,
    staleTime: 0,
    refetchInterval: onboardingPollInterval,
    retry: false,
    meta: queryMeta
  });
  const record = detail.data ?? latest.data;
  const packId = record?.industry_pack_id;
  const pack = useQuery({
    queryKey: ["ai-engine", scope, "industry-pack", packId],
    queryFn: ({ signal }) => getIndustryPack(packId!, signal),
    enabled: !!scope && !!packId && record?.status === "ready",
    retry: false,
    meta: queryMeta
  });

  const action = useMutation({
    mutationFn: async (variables: ActionVariables) => {
      if (!canManage || variables.scope !== activeScope.current) throw new Error("You do not have permission to change this onboarding.");
      if (variables.action === "create") return createOnboarding(variables.name);
      if (!variables.id) throw new Error("Reload the onboarding before continuing.");
      return variables.action === "activate"
        ? activateOnboarding(variables.id)
        : regenerateOnboarding(variables.id);
    },
    retry: false,
    onMutate: async (variables: ActionVariables) => {
      if (variables.scope !== activeScope.current) return;
      await client.cancelQueries({ queryKey: ["ai-engine", variables.scope, "onboardings"] });
    },
    onSuccess: (result, variables) => {
      if (variables.scope !== activeScope.current) return;
      client.setQueryData(onboardingKeys.latest(variables.scope), result.record);
      client.setQueryData(onboardingKeys.detail(variables.scope, result.record.id), result.record);
    },
    onError: async (error, variables) => {
      if (variables.scope !== activeScope.current) return;
      const { code, status } = engineError(error);
      if (error instanceof OnboardingStateChanged) {
        client.setQueryData(onboardingKeys.latest(variables.scope), error.record);
        client.setQueryData(onboardingKeys.detail(variables.scope, error.record.id), error.record);
      } else if (code === "GENERATION_RUNNING" && record && record.id === variables.id) {
        const running = { ...record, status: "generating" as const, status_message: null };
        client.setQueryData(onboardingKeys.latest(variables.scope), running);
        client.setQueryData(onboardingKeys.detail(variables.scope, record.id), running);
      } else if (status === 404 || code === "DUPLICATE" || (variables.action === "create" && status === 502)) {
        await client.invalidateQueries({ queryKey: onboardingKeys.latest(variables.scope), exact: true });
      } else if (code === "VERSION_CONFLICT") {
        await client.invalidateQueries({ queryKey: onboardingKeys.detail(variables.scope, variables.id), exact: true });
      }
    },
    meta: queryMeta
  });
  const resetAction = action.reset;
  useEffect(() => { resetAction(); }, [scope, resetAction]);

  const reload = latest.refetch;
  useEffect(() => {
    if (engineError(detail.error).status === 404) void reload();
  }, [detail.error, reload]);

  function run(kind: Action) {
    if (!scope || !canManage || action.isPending) return;
    action.mutate({ action: kind, scope, id: record?.id, name });
  }

  return {
    scope, record, pack, canManage,
    loading: !scope || latest.isPending ||
      (latest.data?.status === "ready" && !detail.data && detail.isPending),
    error: auth.error ?? latest.error ?? detail.error,
    actionError: action.error,
    busy: action.isPending,
    warnings: action.data?.warnings ?? [],
    generate: () => run("create"),
    regenerate: () => run("regenerate"),
    activate: () => run("activate"),
    refresh: !scope ? auth.refetch : latest.isError || !record?.id ? latest.refetch : detail.refetch,
    reload: !scope ? auth.refetch : latest.refetch
  };
}

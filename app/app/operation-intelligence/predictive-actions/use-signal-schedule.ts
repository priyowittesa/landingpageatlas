"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { engineError } from "./onboarding-api";
import {
  getOnboardingSchedule,
  stopOnboardingSchedule,
  updateOnboardingSchedule,
  type OnboardingScanSchedule
} from "./onboarding-schedule-api";
import { schedulePayload, type SignalSchedule } from "./signal-schedule-data";

export const scheduleKey = (scope: string, id: string) =>
  ["ai-engine", scope, "onboardings", id, "schedule"] as const;
type ScheduleAction = {
  scope: string;
  id: string;
} & ({ action: "stop" } | { action: "update"; draft: SignalSchedule });
const meta = { suppressErrorStatuses: [400, 403, 404, 409, 422, 502] };

export function useSignalSchedule(scope: string, id: string, canManage: boolean) {
  const client = useQueryClient();
  const active = useRef({ scope, id, canManage });
  const inFlight = useRef(false);
  useEffect(() => { active.current = { scope, id, canManage }; }, [scope, id, canManage]);
  const isCurrent = (variables: ScheduleAction) =>
    variables.scope === active.current.scope && variables.id === active.current.id;

  const mutation = useMutation({
    mutationFn: (variables: ScheduleAction) => {
      if (!isCurrent(variables) || !active.current.canManage) {
        throw new Error("You do not have permission to change this schedule.");
      }
      return variables.action === "stop"
        ? stopOnboardingSchedule(variables.id)
        : updateOnboardingSchedule(variables.id, schedulePayload(variables.draft));
    },
    onMutate: async (variables) => {
      if (!isCurrent(variables)) return;
      await client.cancelQueries({ queryKey: scheduleKey(variables.scope, variables.id), exact: true });
    },
    onSuccess: (schedule: OnboardingScanSchedule, variables) => {
      if (!isCurrent(variables)) return;
      client.setQueryData(scheduleKey(variables.scope, variables.id), schedule);
    },
    onError: async (error, variables) => {
      if (isCurrent(variables) && engineError(error).status === 404) {
        await client.invalidateQueries({ queryKey: scheduleKey(variables.scope, variables.id), exact: true });
      }
    },
    retry: false,
    meta
  });
  const query = useQuery({
    queryKey: scheduleKey(scope, id),
    queryFn: ({ signal }) => getOnboardingSchedule(id, signal),
    enabled: !!scope && !!id && !mutation.isPending,
    staleTime: 30_000,
    refetchOnMount: "always",
    refetchInterval: (current) =>
      current.state.data?.status === "active" && !current.state.error && !mutation.isPending
        ? 30_000
        : false,
    retry: false,
    meta
  });
  const reset = mutation.reset;
  useEffect(() => { reset(); }, [scope, id, reset]);

  async function run(action: "stop" | "update", draft?: SignalSchedule) {
    const variables: ScheduleAction = action === "stop"
      ? { scope, id, action }
      : { scope, id, action, draft: draft! };
    if (!canManage || !isCurrent(variables) || !active.current.canManage ||
        !scope || !id || inFlight.current || mutation.isPending ||
        query.isPending || query.isError ||
        (action === "stop" && query.data?.status !== "active")) return false;
    inFlight.current = true;
    try {
      await mutation.mutateAsync(variables);
      return isCurrent(variables);
    } catch {
      return false;
    } finally {
      inFlight.current = false;
    }
  }

  return {
    schedule: query.data,
    loading: query.isPending,
    error: query.error,
    actionError: mutation.error,
    busy: mutation.isPending,
    canManage,
    retry: () => void query.refetch(),
    resetError: reset,
    update: (draft: SignalSchedule) => run("update", draft),
    stop: () => run("stop")
  };
}

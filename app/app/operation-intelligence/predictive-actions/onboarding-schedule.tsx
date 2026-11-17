"use client";

import { SignalSchedulePanel } from "./signal-schedule";
import { useSignalSchedule } from "./use-signal-schedule";

export function OnboardingSchedule({
  scope, onboardingId, canManage
}: {
  scope: string;
  onboardingId: string;
  canManage: boolean;
}) {
  const flow = useSignalSchedule(scope, onboardingId, canManage);
  return (
    <SignalSchedulePanel
      schedule={flow.schedule}
      loading={flow.loading}
      error={flow.error}
      actionError={flow.actionError}
      busy={flow.busy}
      canManage={flow.canManage}
      onRetry={flow.retry}
      onResetError={flow.resetError}
      onUpdate={flow.update}
      onStop={flow.stop}
    />
  );
}

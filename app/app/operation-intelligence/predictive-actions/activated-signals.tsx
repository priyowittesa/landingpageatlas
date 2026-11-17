"use client";

import { useQuery } from "@tanstack/react-query";
import { getOnboardingSignals } from "./onboarding-signals";
import { SignalsResults } from "./signals-results";
import { OnboardingSchedule } from "./onboarding-schedule";

export function ActivatedSignals({
  scope, onboardingId, canManage, onReviewFormulas
}: {
  scope: string;
  onboardingId: string;
  canManage: boolean;
  onReviewFormulas: () => void;
}) {
  const signals = useQuery({
    queryKey: ["ai-engine", scope, "onboardings", onboardingId, "signals"],
    queryFn: ({ signal }) => getOnboardingSignals(onboardingId, signal),
    retry: false
  });
  return (
    <SignalsResults
      signals={signals.data ?? []}
      loading={signals.isPending}
      error={signals.isError}
      onRetry={() => void signals.refetch()}
      onReviewFormulas={onReviewFormulas}
      scheduleControls={
        <OnboardingSchedule
          key={`${scope}:${onboardingId}`}
          scope={scope}
          onboardingId={onboardingId}
          canManage={canManage}
        />
      }
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  usePolicySummary,
  useRecentlyAppliedChanges,
  useScheduledChanges
} from "../hooks/useAdminTokenPolicy";
import { formatShortDate, formatTokens } from "../lib/format";
import {
  LoadingState,
  RecentlyAppliedRow,
  ScheduledChangeRow
} from "./TokenUsageUpcomingChanges";
import { EditDefaultPolicyDialog } from "./admin/EditDefaultPolicyDialog";

export function TokenUsageAdminOverview() {
  const router = useRouter();
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Overview" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs]);

  const { data: summary, isLoading: summaryLoading } = usePolicySummary();
  const {
    data: scheduled,
    isLoading: scheduledLoading,
    isError: scheduledError
  } = useScheduledChanges();
  const {
    data: recentlyApplied,
    isLoading: appliedLoading,
    isError: appliedError
  } = useRecentlyAppliedChanges();

  if (summaryLoading || !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  const { defaultPolicy: dp, policySpread: ps } = summary;
  const totalClients = ps.clientsOnDefault + ps.clientsWithCustomPolicy;
  const scheduledPercent =
    totalClients > 0 ? (ps.scheduledChangesPending / totalClients) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Page header + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold leading-7 text-gray-900">
            Overview
          </h1>
          <p className="mt-0.5 text-sm leading-5 text-gray-500">
            Set the baseline every new client starts with, and override it for
            the clients that negotiated something different.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 text-sm"
            onClick={() => router.push("/app/token-usage/clients")}
          >
            Manage clients
          </Button>
          <Button
            size="sm"
            className="h-10 gap-2 bg-primary-700 text-sm hover:bg-primary-800"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit default policy
          </Button>
        </div>
      </div>

      {/* Two side-by-side cards */}
      <div className="flex gap-5">
        {/* Default policy card */}
        <Card className="flex w-[562px] shrink-0 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e8ff]">
                <Coins className="h-4 w-4 text-[#5829a8]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">
                  Default policy
                </h2>
                <p className="text-xs text-[#64748b]">
                  Quota and reset cycle every new client starts on.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-[#f2ebfd] px-3 py-0.5 text-xs font-medium text-[#5829a8]">
              Applies to new clients
            </span>
          </div>

          {/* Big number + tokens per cycle */}
          <div className="flex items-end gap-1">
            <span className="text-6xl font-bold leading-none text-gray-900">
              {formatTokens(dp.allowance)}
            </span>
            <span className="pb-4 pl-2.5 text-base font-medium text-gray-500">
              tokens per {dp.resetPeriod} cycle
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Last updated */}
          <p className="text-base text-gray-500">
            Last updated {formatShortDate(dp.updatedAt)} by {dp.updatedBy.name}
          </p>
        </Card>

        {/* Policy spread card */}
        <Card className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e8ff]">
              <Users className="h-4 w-4 text-[#5829a8]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Policy spread
              </h2>
              <p className="text-xs text-[#64748b]">
                How many clients run on the default versus a custom override.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {/* Clients on default */}
            <div className="flex items-center gap-4">
              <span className="flex-1 text-base text-gray-900">
                Clients on default
              </span>
              <span className="w-12 text-right text-base text-gray-900">
                {ps.clientsOnDefault}
              </span>
            </div>
            {/* Clients with custom policy */}
            <div className="flex items-center gap-4">
              <span className="flex-1 text-base text-gray-900">
                Clients with custom policy
              </span>
              <span className="w-12 text-right text-base text-gray-900">
                {ps.clientsWithCustomPolicy}
              </span>
            </div>
            {/* Scheduled changes pending */}
            <div className="flex items-center gap-4">
              <span className="flex-1 text-base text-gray-900">
                Scheduled changes pending
              </span>

              <span className="w-12 text-right text-base text-gray-900">
                {ps.scheduledChangesPending}
              </span>
            </div>
            {/* Committed quota per cycle */}
            <div className="flex items-center gap-4">
              <span className="flex-1 text-base text-gray-900">
                Committed quota per cycle
              </span>
              <span className="text-right text-base whitespace-nowrap text-gray-900">
                {formatTokens(ps.committedQuotaPerCycle)}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="h-10 w-full text-sm"
            onClick={() => router.push("/app/token-usage/clients")}
          >
            Open client list
          </Button>
        </Card>
      </div>

      {/* Next scheduled changes + Latest policy changes */}
      <div className="flex gap-5">
        {/* Scheduled changes — 669px */}
        <Card className="flex w-[669px] shrink-0 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e8ff]">
                <Coins className="h-4 w-4 text-[#5829a8]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">
                  Next scheduled changes
                </h2>
                <p className="text-xs text-[#64748b]">
                  Approved policies waiting for their effective date.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-sm"
              onClick={() => router.push("/app/token-usage/upcoming-changes")}
            >
              View all
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            {scheduledLoading ? (
              <LoadingState message="Loading scheduled changes…" />
            ) : scheduledError ? (
              <LoadingState message="Failed to load scheduled changes." />
            ) : scheduled.length === 0 ? (
              <LoadingState message="No scheduled changes." />
            ) : (
              scheduled.map((entry) => (
                <ScheduledChangeRow key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </Card>

        {/* Latest policy changes */}
        <Card className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e8ff]">
                <Coins className="h-4 w-4 text-[#5829a8]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0f172a]">
                  Latest policy changes
                </h2>
                <p className="text-xs text-[#64748b]">
                  The most recent edits with the values.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-sm"
              onClick={() => router.push("/app/token-usage/audit-trail")}
            >
              Open audit trail
            </Button>
          </div>

          <div className="flex flex-col gap-2.5">
            {appliedLoading ? (
              <LoadingState message="Loading latest policy changes…" />
            ) : appliedError ? (
              <LoadingState message="Failed to load latest policy changes." />
            ) : recentlyApplied.length === 0 ? (
              <LoadingState message="No latest policy changes." />
            ) : (
              recentlyApplied.map((entry) => (
                <RecentlyAppliedRow key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </Card>
      </div>

      <EditDefaultPolicyDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultPolicy={{
          allowance: dp.allowance,
          resetPeriod: dp.resetPeriod
        }}
      />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Pencil, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  useRecentlyAppliedChanges,
  useScheduledChanges
} from "../hooks/useAdminTokenPolicy";
import { formatShortDate, formatTokens } from "../lib/format";
import type { ApiChangeItem, TokenResetPeriod } from "../types/admin";
import { EditClientQuotasDialog } from "./admin/EditClientQuotasDialog";

const RESET_PERIODS = new Set<TokenResetPeriod>([
  "daily",
  "weekly",
  "monthly",
  "quarterly"
]);

function toResetPeriod(value: string): TokenResetPeriod {
  return RESET_PERIODS.has(value as TokenResetPeriod)
    ? (value as TokenResetPeriod)
    : "monthly";
}

/** Value pill — old (red) or new (green). */
export function ValuePill({
  value,
  kind
}: {
  value: string;
  kind: "old" | "new";
}) {
  return (
    <span
      className={
        kind === "old"
          ? "inline-flex items-center justify-center rounded bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700"
          : "inline-flex items-center justify-center rounded bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700"
      }
    >
      {value}
    </span>
  );
}

/** Old → New transition with arrow. */
export function ValueTransition({
  old,
  new: newVal
}: {
  old: string;
  new: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <ValuePill value={old} kind="old" />
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
      <ValuePill value={newVal} kind="new" />
    </div>
  );
}

/** Days remaining until `effectiveAt` (negative = already passed). */
export function daysUntil(effectiveAt: string): number {
  const now = new Date();
  const target = new Date(effectiveAt);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

/** One scheduled change row — countdown box + client + quota/reset changes. */
export function ScheduledChangeRow({ entry }: { entry: ApiChangeItem }) {
  const days = Math.max(0, daysUntil(entry.effective_at));

  return (
    <div className="flex items-center gap-4 rounded-[10px] border border-gray-200 px-4 py-2.5">
      {/* Countdown box */}
      <div className="flex shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#f2ebfd] px-7 py-2.5 text-center">
        <span className="text-3xl font-semibold leading-9 text-[#5829a8]">
          {days}
        </span>
        <span className="text-base font-normal leading-6 text-[#5829a8]">
          {days === 1 ? "Day" : "Days"}
        </span>
      </div>

      {/* Right content */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Top row: client name + subtitle + Cancel */}
        <div className="flex items-center">
          <div className="flex flex-1 flex-col">
            <p className="text-lg font-semibold leading-7 text-gray-900">
              {entry.actor}
            </p>
            <p className="text-sm font-light leading-5 text-gray-900">
              Takes effect {formatShortDate(entry.effective_at)} · scheduled by{" "}
              {entry.actor}
            </p>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-sm">
            Cancel
          </Button>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Field changes: Quota + Reset side-by-side */}
        <div className="flex items-start gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-900">Quota</span>
            <ValueTransition
              old={formatTokens(Number(entry.previous_allowance))}
              new={formatTokens(Number(entry.allowance))}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <span className="text-sm font-semibold text-gray-900">Reset</span>
            <ValueTransition
              old={entry.previous_reset_period}
              new={entry.reset_period}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One "Recently applied" entry — client name + date + field changes. */
export function RecentlyAppliedRow({ entry }: { entry: ApiChangeItem }) {
  const changes: { field: string; old: string; new: string }[] = [];

  if (entry.previous_allowance !== entry.allowance) {
    changes.push({
      field: "Quota",
      old: formatTokens(Number(entry.previous_allowance)),
      new: formatTokens(Number(entry.allowance))
    });
  }
  if (entry.previous_reset_period !== entry.reset_period) {
    changes.push({
      field: "Reset",
      old: entry.previous_reset_period,
      new: entry.reset_period
    });
  }
  // Always show at least one row
  if (changes.length === 0) {
    changes.push({
      field: "Quota",
      old: formatTokens(Number(entry.previous_allowance)),
      new: formatTokens(Number(entry.allowance))
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 px-4 py-2.5">
      {/* Top divider line */}
      <div className="border-t border-gray-100" />

      {/* Client name + date */}
      <div className="flex flex-col">
        <p className="text-lg font-semibold leading-7 text-gray-900">
          {entry.actor}
        </p>
        <p className="text-sm text-gray-500">
          {formatShortDate(entry.effective_at)}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Field changes */}
      <div className="flex flex-col gap-2">
        {changes.map((change, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-sm text-gray-900">{change.field}</span>
            <div className="flex flex-1 items-center gap-2.5">
              <ValuePill value={change.old} kind="old" />
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
              <ValuePill value={change.new} kind="new" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="rounded-[10px] border border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
        {message}
      </div>
    </div>
  );
}

export function TokenUsageUpcomingChanges() {
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Upcoming changes" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs]);

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
  const editTargets = useMemo(
    () =>
      Array.from(
        new Map(
          scheduled.map((entry) => [
            entry.tenant_id,
            {
              tenantId: entry.tenant_id,
              name: entry.actor,
              allowance: Number(entry.allowance),
              resetPeriod: toResetPeriod(entry.reset_period)
            }
          ])
        ).values()
      ),
    [scheduled]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Page header + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold leading-7 text-gray-900">
            Upcoming changes
          </h1>
          <p className="mt-0.5 text-sm leading-5 text-gray-500">
            Policies already approved that take effect on a future date. Cancel
            one any time before it applies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-10 gap-2 text-sm">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            className="h-10 gap-2 bg-primary-700 text-sm hover:bg-primary-800"
            disabled={editTargets.length === 0}
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Two side-by-side cards */}
      <div className="flex gap-5">
        {/* Next scheduled changes — 745px */}
        <Card className="flex w-[745px] shrink-0 flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e8ff]">
              <ArrowRight className="h-4 w-4 text-[#5829a8]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Next scheduled changes
              </h2>
              <p className="text-xs text-[#64748b]">
                Policies queued to take effect later. Click one to review or
                cancel it.
              </p>
            </div>
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

        {/* Recently applied */}
        <Card className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f3e8ff]">
              <ArrowRight className="h-4 w-4 text-[#5829a8]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0f172a]">
                Recently applied
              </h2>
              <p className="text-xs text-[#64748b]">
                Scheduled policies that already took effect.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {appliedLoading ? (
              <LoadingState message="Loading recently applied changes…" />
            ) : appliedError ? (
              <LoadingState message="Failed to load recently applied changes." />
            ) : recentlyApplied.length === 0 ? (
              <LoadingState message="No recently applied changes." />
            ) : (
              recentlyApplied.map((entry) => (
                <RecentlyAppliedRow key={entry.id} entry={entry} />
              ))
            )}
          </div>
        </Card>
      </div>

      <EditClientQuotasDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        targets={editTargets}
      />
    </div>
  );
}

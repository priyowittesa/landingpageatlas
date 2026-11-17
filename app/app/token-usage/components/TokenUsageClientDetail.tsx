"use client";

import { useEffect, useState } from "react";
import { ChevronRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import {
  useTokenClientDetail,
  useTokenAuditTrail
} from "../hooks/useAdminTokenPolicy";
import {
  auditActionClassMap,
  auditActionLabels,
  resetPeriodLabels,
  type TokenAuditEntry,
  type TokenPolicyValues
} from "../types/admin";
import { formatShortDate, formatTokens } from "../lib/format";
import { EditPolicyDialog } from "./admin/EditPolicyDialog";
import { RevertPolicyDialog } from "./admin/RevertPolicyDialog";

/** One row of the policy comparison inside the "Policy in force" card. */
function PolicyRow({
  label,
  value,
  defaultValue,
  differ
}: {
  label: string;
  value: string;
  defaultValue: string;
  differ: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "text-sm font-semibold",
            differ ? "text-violet-600" : "text-gray-800"
          )}
        >
          {value}
        </span>
        {differ && (
          <span className="text-xs text-gray-400">
            (default: {defaultValue})
          </span>
        )}
      </div>
    </div>
  );
}

/** The "Policy in force" card. */
function PolicyInForceCard({
  inForce,
  defaultPolicy,
  isCustom
}: {
  inForce: TokenPolicyValues;
  defaultPolicy: TokenPolicyValues;
  isCustom: boolean;
}) {
  const rows = [
    {
      label: "Token allowance",
      value: formatTokens(inForce.allowance),
      defaultValue: formatTokens(defaultPolicy.allowance),
      differ: inForce.allowance !== defaultPolicy.allowance
    },
    {
      label: "Reset period",
      value: resetPeriodLabels[inForce.resetPeriod],
      defaultValue: resetPeriodLabels[defaultPolicy.resetPeriod],
      differ: inForce.resetPeriod !== defaultPolicy.resetPeriod
    }
  ];

  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
              <SlidersHorizontal className="h-4 w-4 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Policy in force
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                What this client runs on today, and how it differs from the
                default.
              </p>
            </div>
          </div>
          {isCustom && (
            <Badge
              variant="outline"
              className="border-transparent bg-violet-100 text-xs font-medium text-violet-700"
            >
              Custom override
            </Badge>
          )}
        </div>

        <div className="mt-6 divide-y divide-gray-100">
          {rows.map((row) => (
            <PolicyRow key={row.label} {...row} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** The "Cycle status" card. */
function CycleStatusCard({
  used,
  remaining,
  quota,
  remainingPercent,
  periodStart,
  periodEnd,
  hasScheduled
}: {
  used: number;
  remaining: number;
  quota: number;
  remainingPercent: number;
  periodStart: string;
  periodEnd: string;
  hasScheduled: boolean;
}) {
  const usedPercent = 100 - remainingPercent;

  return (
    <Card className="gap-0 p-0">
      <CardContent className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
            <SlidersHorizontal className="h-4 w-4 text-primary-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Cycle status
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Usage, balance and reset dates for the current cycle.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Used this cycle</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatTokens(used)} / {formatTokens(quota)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Remaining</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatTokens(remaining)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Usage</span>
            <Progress
              value={usedPercent}
              className="h-2 flex-1"
              indicatorClassName="bg-primary-600"
            />
            <span className="text-sm font-medium text-gray-600">
              {Math.round(usedPercent)}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Period</span>
            <span className="text-sm font-semibold text-gray-900">
              {formatShortDate(periodStart)} – {formatShortDate(periodEnd)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Next reset</span>
            {hasScheduled ? (
              <Badge
                variant="outline"
                className="border-transparent bg-violet-100 text-xs font-medium text-violet-700"
              >
                Schedule
              </Badge>
            ) : (
              <span className="text-sm font-semibold text-gray-900">
                {formatShortDate(periodEnd)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** `quota_amount  50.000 → 90.000  +2` cell in the history table. */
function ChangeCell({ entry }: { entry: TokenAuditEntry }) {
  const first = entry.diff[0];
  const extra = entry.diff.length - 1;
  if (!first) return <span className="text-xs text-gray-400">—</span>;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span className="text-sm text-gray-600">{first.field}</span>
      <span className="rounded-md bg-rose-50 px-2 py-0.5 text-sm font-semibold text-rose-600">
        {first.old}
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-sm font-semibold text-emerald-600">
        {first.new}
      </span>
      {extra > 0 && <span className="text-sm text-gray-400">+{extra}</span>}
    </div>
  );
}

/** One expandable history row. */
function HistoryRow({ entry }: { entry: TokenAuditEntry }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(entry.occurredAt);
  const day = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });

  return (
    <>
      <TableRow
        className="cursor-pointer border-gray-100 hover:bg-gray-50/70"
        onClick={() => setExpanded((value) => !value)}
      >
        <TableCell className="w-12 pl-4">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-700 transition-transform",
              expanded && "rotate-90"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </span>
        </TableCell>
        <TableCell className="text-sm font-medium text-gray-800">
          {day}
        </TableCell>
        <TableCell className="text-sm text-gray-500">{time}</TableCell>
        <TableCell className="text-sm font-semibold text-gray-900">
          {entry.adminName}
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={cn(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              auditActionClassMap[entry.action]
            )}
          >
            {auditActionLabels[entry.action]}
          </Badge>
        </TableCell>
        <TableCell>
          <ChangeCell entry={entry} />
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="border-gray-100 bg-gray-50/40 hover:bg-gray-50/40">
          <TableCell colSpan={6} className="py-3">
            <div className="ml-14 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Field changes
              </p>
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-100 bg-white hover:bg-white">
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Field
                      </TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        Old
                      </TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        New
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.diff.map((change, index) => (
                      <TableRow
                        key={`${entry.id}-${index}`}
                        className="border-gray-100 last:border-0"
                      >
                        <TableCell className="text-xs font-medium text-gray-700">
                          {change.field}
                        </TableCell>
                        <TableCell>
                          <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-600">
                            {change.old}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                            {change.new}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-xs text-gray-500">{entry.summary}</p>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export function TokenUsageClientDetail({ clientId }: { clientId: string }) {
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  const { data: client, isLoading, isError } = useTokenClientDetail(clientId);
  const {
    data: auditEntries,
    isLoading: auditLoading,
    isError: auditError
  } = useTokenAuditTrail({ clientId, pageSize: 50 });
  const [editOpen, setEditOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);

  const clientName = client?.name || "Client detail";

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Token Usage", href: "/app/token-usage/overview" },
      { title: "Clients", href: "/app/token-usage/clients" },
      { title: clientName }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbItems, clearBreadcrumbs, clientName]);

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-gray-950">
              Client detail
            </h1>
          </div>
        </div>
        <Card className="gap-0 p-0">
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">
              Failed to load client detail. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !client) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-gray-950">
              Loading…
            </h1>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="gap-0 p-0">
            <CardContent className="p-6">
              <p className="text-sm text-gray-400">Loading client detail…</p>
            </CardContent>
          </Card>
          <Card className="gap-0 p-0">
            <CardContent className="p-6">
              <p className="text-sm text-gray-400">Loading cycle status…</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isCustom = client.policySource === "override";
  const hasScheduled = Boolean(client.scheduledPolicy);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Header: client name + actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-gray-950">
            {client.name || "Client"}
          </h1>
          {client.email && (
            <p className="mt-1 text-sm leading-5 text-gray-500">
              {client.email}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-1.5 text-sm"
            onClick={() => setRevertOpen(true)}
            disabled={!isCustom}
          >
            <RotateCcw className="h-4 w-4" />
            Revert to default
          </Button>
          <Button
            size="sm"
            className="h-10 gap-1.5 bg-primary-700 text-sm hover:bg-primary-800"
            onClick={() => setEditOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Edit policy
          </Button>
        </div>
      </div>

      {/* Two side-by-side cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        <PolicyInForceCard
          inForce={client.inForcePolicy}
          defaultPolicy={client.defaultPolicy}
          isCustom={isCustom}
        />
        <CycleStatusCard
          used={client.used}
          remaining={client.remaining}
          quota={client.quota}
          remainingPercent={client.remainingPercent}
          periodStart={client.periodStart}
          periodEnd={client.periodEnd}
          hasScheduled={hasScheduled}
        />
      </div>

      {/* Policy history table */}
      <Card className="gap-0 overflow-hidden p-0">
        <CardContent className="p-6 pb-0">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
              <SlidersHorizontal className="h-4 w-4 text-primary-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Policy history for this client
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Past changes and who made them. Click a row for the full diff.
              </p>
            </div>
          </div>
        </CardContent>
        <div className="mt-4 overflow-x-auto">
          <Table className="min-w-220">
            <TableHeader>
              <TableRow className="border-gray-100 bg-white hover:bg-white">
                <TableHead className="w-12 pl-4" />
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Date
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Time
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Admin
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Action
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Change
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLoading ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    Loading policy history…
                  </TableCell>
                </TableRow>
              ) : auditError ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    Failed to load policy history.
                  </TableCell>
                </TableRow>
              ) : !auditEntries || auditEntries.entries.length === 0 ? (
                <TableRow className="border-gray-100 hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-xs text-gray-400"
                  >
                    No policy changes recorded.
                  </TableCell>
                </TableRow>
              ) : (
                auditEntries.entries.map((entry) => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <EditPolicyDialog
        client={client}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <RevertPolicyDialog
        client={client}
        open={revertOpen}
        onOpenChange={setRevertOpen}
      />
    </div>
  );
}

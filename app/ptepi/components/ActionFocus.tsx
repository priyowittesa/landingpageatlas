"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Check, ChevronDown, Play, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "../format";
import type { MetricId } from "../metrics";
import { OWNER_PREVIEW_COUNT, getDueGroups, getOwnerLoads, type AgingBucketId, type FocusAction } from "../store/action-helpers";
import { useActionsStore, type ActionStatus, type EpiAction } from "../store/actions-store";
import { canPerform, isRelevantTo, type DemoRole } from "../store/roles";
import { MetricLabel } from "./MetricLabel";
import { SyntheticDataBadge } from "./SyntheticDataBadge";
import { Tr, useT } from "./Tr";

type FocusCardProps = { metricId: MetricId; help: string; insight: string | null; children: ReactNode; className?: string };

function FocusCard({ metricId, help, insight, children, className }: FocusCardProps) {
  return (
    <section className={cn("ptepi-card flex flex-col overflow-hidden", className)}>
      <div className="space-y-3 border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-950">
            <MetricLabel metricId={metricId} />
          </h2>
          <SyntheticDataBadge />
        </div>
        <p className="text-sm text-gray-700">
          <Tr>{help}</Tr>
        </p>
        {insight && (
          <p className="flex w-full items-start gap-2.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5 text-sm text-primary-950">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary-700 px-1.5 py-0.5 text-xs font-semibold text-white">
              <Sparkles size={12} aria-hidden />
              <Tr>AI insight</Tr>
            </span>
            <Tr>{insight}</Tr>
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function DueText({ daysLeft }: { daysLeft: number }) {
  if (daysLeft === 0) return <Tr>Due today</Tr>;
  return (
    <>
      {Math.abs(daysLeft)} <Tr>{daysLeft < 0 ? "days overdue" : "days left"}</Tr>
    </>
  );
}

/** Start or close an action in place; disabled, with the reason, when the demo role may not. */
function QuickActions({ action, role }: { action: EpiAction; role: DemoRole }) {
  const setStatus = useActionsStore((state) => state.setStatus);
  const t = useT();
  const change = (status: ActionStatus) => {
    setStatus(action.id, status);
    toast.success(status === "done" ? `${action.id} ${t("closed")}` : `${action.id}: ${t("In progress")}`);
  };
  const canStart = canPerform(role, "status", action);
  const canClose = canPerform(role, "close", action);

  return (
    <>
      {action.status === "open" && (
        <button
          type="button"
          disabled={!canStart}
          title={canStart ? undefined : `${role.label}: ${t("cannot change this action")}`}
          onClick={() => change("in-progress")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play size={14} aria-hidden />
          <Tr>Start</Tr>
        </button>
      )}
      <button
        type="button"
        disabled={!canClose}
        title={canClose ? undefined : `${role.label}: ${t("cannot close this action")}`}
        onClick={() => change("done")}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary-200 bg-white px-3 py-1.5 text-sm font-semibold text-primary-900 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Check size={14} aria-hidden />
        <Tr>Close</Tr>
      </button>
    </>
  );
}

function ActionItem({ item, role, showOwner }: { item: FocusAction; role: DemoRole; showOwner: boolean }) {
  const { action, daysLeft } = item;
  const urgent = daysLeft <= 7;
  return (
    <li className="space-y-2 rounded-lg border border-border bg-background p-3.5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset",
            daysLeft < 0 ? "bg-red-50 text-red-900 ring-red-200" : urgent ? "bg-amber-50 text-amber-900 ring-amber-300" : "bg-primary-50 text-primary-900 ring-primary-200"
          )}
        >
          {urgent && <TriangleAlert size={12} aria-hidden />}
          <DueText daysLeft={daysLeft} />
        </span>
        <span className="text-gray-700">{formatDate(action.dueDate)}</span>
        <span className="font-semibold text-gray-900">{action.projectId}</span>
        {action.status === "in-progress" && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-green-900 ring-1 ring-inset ring-green-200">
            <Tr>In progress</Tr>
          </span>
        )}
        <span className="ml-auto text-gray-600">{action.id}</span>
      </div>
      <p className="text-sm font-semibold leading-snug text-gray-950">
        <Tr>{action.title}</Tr>
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-700">
          {showOwner && (
            <>
              <Tr>Owner</Tr>: <span className="font-medium text-gray-900">{action.ownerRole}</span>
              {isRelevantTo(role, action) && (
                <>
                  {" "}
                  (<Tr>Yours</Tr>)
                </>
              )}
              {" · "}
            </>
          )}
          <Link href={item.href} className="inline-flex items-center gap-1 font-medium text-primary-800 hover:underline">
            <Tr>Go to</Tr> <Tr>{item.screen}</Tr>
            <ArrowRight size={12} aria-hidden />
          </Link>
        </p>
        <div className="flex gap-2">
          <QuickActions action={action} role={role} />
        </div>
      </div>
    </li>
  );
}

type PanelProps = {
  actions: EpiAction[];
  asAt: string;
  role: DemoRole;
  insight: string | null;
  className?: string;
};

const GROUP_TONE: Record<AgingBucketId, string> = {
  overdue: "text-red-700",
  week: "text-amber-800",
  "two-weeks": "text-primary-800",
  later: "text-gray-800"
};

/** What is due and when: four figures that filter the list of actions under them. */
export function DueQueuePanel({ actions, asAt, role, insight, className }: PanelProps) {
  const t = useT();
  const groups = getDueGroups(actions, asAt);
  const [picked, setPicked] = useState<AgingBucketId | null>(null);
  const selected = groups.find((group) => group.id === picked) ?? groups.find((group) => group.count > 0) ?? groups[0];

  return (
    <FocusCard metricId="actionAging" help="Pick a due-date group, then start or close an action, or open the screen it comes from. Faded buttons belong to another role." insight={insight} className={className}>
      <ul className="grid grid-cols-2 gap-2 p-5 pb-0 sm:grid-cols-4" aria-label={t("Filter by due date")}>
        {groups.map((group) => {
          const active = group.id === selected?.id;
          return (
            <li key={group.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setPicked(group.id)}
                className={cn(
                  "flex h-full w-full cursor-pointer flex-col rounded-lg border p-3 text-left transition-colors",
                  active ? "border-primary-600 bg-primary-50 ring-1 ring-primary-600" : "border-border bg-background hover:bg-primary-50"
                )}
              >
                <span className={cn("text-4xl font-bold leading-none tabular-nums", group.count > 0 ? GROUP_TONE[group.id] : "text-gray-500")}>{group.count}</span>
                <span className="mt-2 text-xs font-medium text-gray-800">
                  <Tr>{group.label}</Tr>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected && selected.items.length > 0 ? (
        <ul className="max-h-[34rem] flex-1 space-y-2.5 overflow-y-auto p-5" aria-label={t(selected.label)}>
          {selected.items.map((item) => (
            <ActionItem key={item.action.id} item={item} role={role} showOwner />
          ))}
        </ul>
      ) : (
        <p className="m-5 flex flex-1 items-center justify-center rounded-lg border border-dashed border-primary-200 bg-primary-50/40 p-6 text-sm text-gray-800">
          <Tr>No action in this group.</Tr>
        </p>
      )}
    </FocusCard>
  );
}

/** Who has to act: one row per owner role, opening to that role's actions. */
export function OwnerLoadPanel({ actions, asAt, role, insight, className, onShowOwner }: PanelProps & { onShowOwner: (ownerRole: string) => void }) {
  const loads = getOwnerLoads(actions, asAt);
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const openOwner = picked === undefined ? loads[0]?.ownerRole : picked;

  return (
    <FocusCard metricId="actionsByOwner" help="Pick a role to see its next actions and act on them. Faded buttons belong to another role." insight={insight} className={className}>
      {loads.length === 0 ? (
        <p className="p-10 text-center text-sm text-gray-800">
          <Tr>No unfinished actions</Tr>
        </p>
      ) : (
        <ul className="max-h-[42rem] flex-1 space-y-2 overflow-y-auto p-5">
          {loads.map((load) => {
            const open = load.ownerRole === openOwner;
            return (
              <li key={load.ownerRole} className={cn("rounded-lg border", open ? "border-primary-300 bg-primary-50/50" : "border-border bg-background")}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setPicked(open ? null : load.ownerRole)}
                  className="w-full cursor-pointer space-y-2 rounded-lg p-3 text-left hover:bg-primary-50"
                >
                  <span className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-sm font-semibold text-gray-950">{load.ownerRole}</span>
                    <span className="text-xs text-gray-700">
                      {load.open} <Tr>open</Tr>, {load.inProgress} <Tr>in progress</Tr>
                    </span>
                    <span className="text-2xl font-bold leading-none tabular-nums text-primary-900">{load.total}</span>
                    <ChevronDown size={16} aria-hidden className={cn("shrink-0 text-gray-600 transition-transform", open && "rotate-180")} />
                  </span>
                  <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-gray-100">
                    <span className="block h-full rounded-full bg-primary-600" style={{ width: `${load.barPct}%` }} />
                  </span>
                </button>
                {open && (
                  <div className="space-y-2.5 px-3 pb-3">
                    <ul className="space-y-2.5">
                      {load.items.slice(0, OWNER_PREVIEW_COUNT).map((item) => (
                        <ActionItem key={item.action.id} item={item} role={role} showOwner={false} />
                      ))}
                    </ul>
                    <button type="button" onClick={() => onShowOwner(load.ownerRole)} className="cursor-pointer text-sm font-semibold text-primary-800 hover:underline">
                      <Tr>See all in the table below to assign or update</Tr> ({load.total})
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </FocusCard>
  );
}

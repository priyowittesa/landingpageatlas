"use client";

import type { ReactNode } from "react";
import { AlarmClock, Calendar, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusPill } from "../components/triage-badges";
import type { AiInsight, InsightType } from "../lib/types";
import { INSIGHT_TYPES } from "./insight-data";
import { useReopenInsight, useSnoozeInsight } from "./use-ai-insights";

export function InsightTypeBadge({ type }: { type: InsightType }) {
  const { label, icon: Icon, className } = INSIGHT_TYPES[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.06em]",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function InsightStatusBadge({ insight }: { insight: AiInsight }) {
  if (insight.status === "snoozed") {
    return (
      <StatusPill tone="muted" icon={AlarmClock}>
        Snoozed{insight.snoozedUntil ? ` until ${insight.snoozedUntil}` : ""}
      </StatusPill>
    );
  }
  if (insight.status === "accepted") return <StatusPill tone="green" icon={Check}>Accepted</StatusPill>;
  if (insight.status === "dismissed") return <StatusPill tone="muted" icon={X}>Dismissed</StatusPill>;
  return null;
}

const SNOOZE_OPTIONS = [
  { label: "Snooze until tomorrow", days: 1, icon: AlarmClock },
  { label: "Snooze for 7 days", days: 7, icon: Calendar },
];

/** 08:00 local time, `days` from today. */
function snoozeDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(8, 0, 0, 0);
  return date;
}

/** Snooze menu wrapping the given trigger button. */
export function SnoozeMenu({ insight, children }: { insight: AiInsight; children: ReactNode }) {
  const snooze = useSnoozeInsight();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={snooze.isPending} onClick={(event) => event.stopPropagation()}>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(event) => event.stopPropagation()}>
        {SNOOZE_OPTIONS.map((option) => (
          <DropdownMenuItem key={option.days} onSelect={() => snooze.mutate({ id: insight.id, until: snoozeDate(option.days) })}>
            <option.icon className="h-4 w-4" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function useReopen() {
  const reopen = useReopenInsight();
  return { reopen: (insight: AiInsight) => reopen.mutate(insight.id), isPending: reopen.isPending };
}

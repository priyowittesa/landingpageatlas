"use client";

import {
  ArrowUpRight,
  Ban,
  CalendarClock,
  Eye,
  History,
  MoreHorizontal,
  Pencil,
  Play,
  Reply,
  RotateCcw,
  StickyNote,
  Undo2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { QueueDialogKind } from "./queue-dialogs";
import { isOpenReport } from "./queue-helpers";
import type { QueueReport } from "./use-breakdown-reports";

export interface QueueActions {
  openDetail: (report: QueueReport) => void;
  openDialog: (kind: QueueDialogKind, report: QueueReport, caseId?: string) => void;
  escalate: (report: QueueReport) => void;
  start: (report: QueueReport) => void;
  restore: (report: QueueReport) => void;
  addNote: (report: QueueReport) => void;
  showHistory: (report: QueueReport) => void;
  busy: boolean;
}

type MenuItem = { icon: LucideIcon; label: string; onSelect: () => void; danger?: boolean } | "separator";

function menuItems(report: QueueReport, actions: QueueActions, inDrawer: boolean): MenuItem[] {
  const items: MenuItem[] = [];
  if (!inDrawer) items.push({ icon: Eye, label: "View details", onSelect: () => actions.openDetail(report) });
  if (report.state === "cancelled") {
    return [...items, "separator", { icon: Undo2, label: "Restore report", onSelect: () => actions.restore(report) }];
  }
  if (isOpenReport(report)) {
    items.push({
      icon: Pencil,
      label: "Change priority",
      onSelect: () => {
        actions.openDetail(report);
        actions.openDialog("override", report);
      },
    });
    if (report.override) items.push({ icon: RotateCcw, label: "Restore system priority", onSelect: () => actions.openDialog("revert", report) });
    items.push({ icon: UserPlus, label: "Reassign", onSelect: () => actions.openDialog("assign", report) });
    if (report.state === "new" || report.state === "scheduled") items.push({ icon: Play, label: "Start work", onSelect: () => actions.start(report) });
    items.push(
      report.state === "escalated"
        ? { icon: Reply, label: "Respond to escalation", onSelect: () => actions.openDialog("escalation", report) }
        : { icon: ArrowUpRight, label: "Escalate", onSelect: () => actions.escalate(report) }
    );
    items.push({
      icon: CalendarClock,
      label: report.state === "scheduled" ? "Reschedule" : "Schedule",
      onSelect: () => actions.openDialog("reschedule", report),
    });
  }
  items.push({ icon: StickyNote, label: "Add note", onSelect: () => actions.addNote(report) });
  items.push({ icon: History, label: "Change history", onSelect: () => actions.showHistory(report) });
  if (isOpenReport(report)) {
    items.push("separator", { icon: Ban, label: "Cancel report", onSelect: () => actions.openDialog("cancel", report), danger: true });
  }
  return items;
}

export function RowActionsMenu({
  report,
  actions,
  inDrawer = false,
}: {
  report: QueueReport;
  actions: QueueActions;
  inDrawer?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={inDrawer ? "outline" : "ghost"}
          size="icon"
          aria-label={inDrawer ? "More actions" : `Actions for ${report.code}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={(event) => event.stopPropagation()}>
        {menuItems(report, actions, inDrawer).map((item, index) =>
          item === "separator" ? (
            <DropdownMenuSeparator key={`separator-${index}`} />
          ) : (
            <DropdownMenuItem
              key={item.label}
              disabled={actions.busy}
              onSelect={item.onSelect}
              className={item.danger ? "text-red-600 focus:text-red-700" : undefined}
            >
              <item.icon className={item.danger ? "h-4 w-4 text-red-600" : "h-4 w-4"} />
              {item.label}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

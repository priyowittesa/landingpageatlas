"use client";

import {
  ChevronLeft,
  Download,
  FolderPlus,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDisplayValue } from "@/lib/format-display-value";
import type { Project } from "../../../master-data/projects/types";
import { RosteringPeriodControls } from "./rostering-period-controls";
import type { SchedulePeriod } from "./rostering-types";

export function RosteringHeader({ project }: { project: Project }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => history.back()}
        aria-label="Back"
      >
        <ChevronLeft />
      </Button>
      <div>
        <h1 className="text-xl font-semibold">Configure Active Project</h1>
        <p className="text-xs text-muted-foreground">
          {project.code} · {formatDisplayValue(project.title)}
        </p>
      </div>
    </div>
  );
}

export function RosteringActions({
  canDelete,
  onAddGroup,
  onAssignEmployee,
  onAssignRole,
  onDelete,
  onExport,
}: {
  canDelete: boolean;
  onAddGroup: () => void;
  onAssignEmployee: () => void;
  onAssignRole: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        className="bg-primary-700 hover:bg-primary-600"
        onClick={onAssignEmployee}
      >
        <UserPlus /> Assign Employee
      </Button>
      <Button
        size="sm"
        className="bg-primary-700 hover:bg-primary-600"
        onClick={onAssignRole}
      >
        <UsersRound /> Assign Role
      </Button>
      <Button
        size="sm"
        className="bg-primary-700 hover:bg-primary-600"
        onClick={onAddGroup}
      >
        <FolderPlus /> Add Group
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={!canDelete}
        onClick={onDelete}
      >
        <Trash2 /> Delete
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="ml-auto"
        onClick={onExport}
      >
        <Download /> Export
      </Button>
    </div>
  );
}

export function RosteringCalendarControls({
  employeeSearch,
  onEmployeeSearchChange,
  onGenerate,
  onMovePeriod,
  onPeriodChange,
  period,
  periodLabel,
}: {
  employeeSearch: string;
  onEmployeeSearchChange: (value: string) => void;
  onGenerate: () => void;
  onMovePeriod: (amount: number) => void;
  onPeriodChange: (period: SchedulePeriod) => void;
  period: SchedulePeriod;
  periodLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RosteringPeriodControls
        onMovePeriod={onMovePeriod}
        onPeriodChange={onPeriodChange}
        period={period}
        periodLabel={periodLabel}
      />

      <div className="relative min-w-56 flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={employeeSearch}
          onChange={(event) => onEmployeeSearchChange(event.target.value)}
          placeholder="Search employee..."
          className="h-8 pl-9 text-xs"
        />
      </div>

      <Button
        size="sm"
        className="ml-auto"
        onClick={onGenerate}
      >
        <Sparkles /> AI Generate Schedule
      </Button>
    </div>
  );
}

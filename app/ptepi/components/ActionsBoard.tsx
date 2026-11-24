"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CircleCheck, Clock, ListTodo, Plus, TriangleAlert, UserCheck, UserRound } from "lucide-react";
import { KpiCard } from "./KpiCard";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { TableColumn, TableFilter } from "@/types/type";
import {
  getActionsByOwnerChart,
  getAgingChart,
  AUTONOMY_LABELS,
  STATUS_LABELS,
  filterActions,
  getActionSummary,
  getProjectOptions,
  getSourceOptions,
  isOverdue,
  sortActions
} from "../store/action-helpers";
import { useActionsStore, type ActionStatus, type EpiAction } from "../store/actions-store";
import { useRoleStore } from "../store/role-store";
import { OWNER_ROLES, canPerform, getDemoRole, isRelevantTo, type DemoRole } from "../store/roles";
import { ActionsByOwnerCard, AgingCard } from "./charts/ScreenCharts";
import { AssignActionDialog, CreateActionDialog } from "./ActionDialogs";
import { EmptyState } from "./EmptyState";
import { StatusBadge } from "./StatusBadge";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

const ALL = "all";
const PAGE_SIZE_OPTIONS = [5, 10, 20];
const STATUSES = Object.keys(STATUS_LABELS) as ActionStatus[];

function StatusCell({ action, asAt }: { action: EpiAction; asAt: string }) {
  return (
    <div className="space-y-1">
      {action.status === "open" && <StatusBadge tone="watch" label="Open" />}
      {action.status === "in-progress" && (
        <Badge variant="secondary" className="gap-1.5">
          <Clock size={16} aria-hidden />
          In progress
        </Badge>
      )}
      {action.status === "done" && <StatusBadge tone="good" label="Done" />}
      {isOverdue(action, asAt) && (
        <div className="flex items-center gap-1 text-xs font-medium text-destructive">
          <TriangleAlert size={16} aria-hidden />
          Overdue
        </div>
      )}
    </div>
  );
}

type RowControlsProps = {
  action: EpiAction;
  role: DemoRole;
  onAssign: (action: EpiAction) => void;
};

function RowControls({ action, role, onAssign }: RowControlsProps) {
  const setStatus = useActionsStore((state) => state.setStatus);
  const canStatus = canPerform(role, "status", action);
  const canAssign = canPerform(role, "assign", action);
  const canClose = canPerform(role, "close", action);

  const change = (status: ActionStatus) => {
    setStatus(action.id, status);
    toast.success(
      status === "done" ? `${action.id} closed` : `${action.id} set to ${STATUS_LABELS[status].toLowerCase()}`
    );
  };

  return (
    <div className="flex min-w-40 flex-wrap items-center gap-2">
      <Select
        value={action.status}
        disabled={!canStatus}
        onValueChange={(value) => change(value as ActionStatus)}
      >
        <SelectTrigger
          aria-label={`Status of ${action.id}`}
          title={canStatus ? undefined : `${role.label} cannot change this action`}
          className="h-8 w-32"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!canAssign}
        title={canAssign ? undefined : `${role.label} cannot assign actions`}
        onClick={() => onAssign(action)}
      >
        Assign
      </Button>
      {action.status !== "done" && (
        <Button
          type="button"
          size="sm"
          disabled={!canClose}
          title={canClose ? undefined : `${role.label} cannot close this action`}
          className="bg-primary-700 text-white hover:bg-primary-800"
          onClick={() => change("done")}
        >
          Close
        </Button>
      )}
    </div>
  );
}

type ActionsBoardProps = {
  seeds: EpiAction[];
  asAt: string;
  projectOptions: string[];
};

export function ActionsBoard({ seeds, asAt, projectOptions }: ActionsBoardProps) {
  const actions = useActionsStore((state) => state.actions);
  const seed = useActionsStore((state) => state.seed);
  const seeded = useActionsStore((state) => state.seeded);
  const roleId = useRoleStore((state) => state.roleId);
  const role = getDemoRole(roleId);

  const [search, setSearch] = useState("");
  const [project, setProject] = useState(ALL);
  const [owner, setOwner] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [mineOnly, setMineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [creating, setCreating] = useState(false);
  const [assigning, setAssigning] = useState<EpiAction | null>(null);

  useEffect(() => seed(seeds), [seed, seeds]);

  const summary = useMemo(() => getActionSummary(actions, asAt), [actions, asAt]);
  const mine = useMemo(
    () => actions.filter((action) => action.status !== "done" && isRelevantTo(role, action)).length,
    [actions, role]
  );

  const ownerChart = useMemo(() => getActionsByOwnerChart(actions), [actions]);
  const agingChart = useMemo(() => getAgingChart(actions, asAt), [actions, asAt]);

  const rows = useMemo(() => {
    const filtered = filterActions(actions, { search, project, owner, status, source });
    return sortActions(mineOnly ? filtered.filter((a) => isRelevantTo(role, a)) : filtered);
  }, [actions, search, project, owner, status, source, mineOnly, role]);

  const reset = (apply: (value: string) => void) => (value: string) => {
    apply(value);
    setPage(1);
  };

  const filters: TableFilter[] = [
    {
      key: "project",
      placeholder: "Project",
      value: project,
      onChange: reset(setProject),
      options: [{ label: "All projects", value: ALL }, ...getProjectOptions(actions).map((id) => ({ label: id, value: id }))]
    },
    {
      key: "owner",
      placeholder: "Owner role",
      value: owner,
      onChange: reset(setOwner),
      options: [{ label: "All owner roles", value: ALL }, ...OWNER_ROLES.map((r) => ({ label: r, value: r }))]
    },
    {
      key: "status",
      placeholder: "Status",
      value: status,
      onChange: reset(setStatus),
      options: [{ label: "All statuses", value: ALL }, ...STATUSES.map((s) => ({ label: STATUS_LABELS[s], value: s }))]
    },
    {
      key: "source",
      placeholder: "Source screen",
      value: source,
      onChange: reset(setSource),
      options: [{ label: "All sources", value: ALL }, ...getSourceOptions(actions).map((s) => ({ label: s, value: s }))]
    }
  ];

  const rawColumns: TableColumn<EpiAction>[] = [
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <div className="min-w-52 max-w-72 whitespace-normal">
          <div className="text-xs font-semibold text-muted-foreground">{row.id}</div>
          <div className="font-medium">{row.title}</div>
        </div>
      )
    },
    { key: "projectId", header: "Project", render: (row) => <span className="font-semibold">{row.projectId}</span> },
    {
      key: "owner",
      header: "Owner role",
      render: (row) => (
        <div className="min-w-36 max-w-44 space-y-1 whitespace-normal">
          <div>{row.ownerRole}</div>
          {isRelevantTo(role, row) && (
            <Badge variant="outline" className="gap-1.5 border-primary-500 text-primary-700">
              <UserCheck size={16} aria-hidden />
              Yours
            </Badge>
          )}
        </div>
      )
    },
    { key: "dueDate", header: "Due", className: "whitespace-nowrap", render: (row) => row.dueDate },
    { key: "status", header: "Status", render: (row) => <StatusCell action={row} asAt={asAt} /> },
    {
      key: "source",
      header: "Source",
      render: (row) => <div className="max-w-40 whitespace-normal text-xs text-muted-foreground">{row.source}</div>
    },
    {
      key: "autonomy",
      header: "Autonomy",
      className: "max-w-28 whitespace-normal",
      render: (row) => AUTONOMY_LABELS[row.autonomy]
    },
    {
      key: "controls",
      header: "Update",
      render: (row) => <RowControls action={row} role={role} onAssign={setAssigning} />
    }
  ];
  const columns = rawColumns.map((column) => ({
    ...column,
    className: cn("px-2", column.className)
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Open" subtitle="Not started" value={summary.open} icon={ListTodo} />
        <KpiCard
          title="In progress"
          subtitle={`${summary.overdue} overdue`}
          value={summary.inProgress}
          icon={Clock}
        />
        <KpiCard title="Done" subtitle="Closed by an owner" value={summary.done} icon={CircleCheck} />
        <KpiCard
          title={`Waiting on ${role.label}`}
          subtitle="Unfinished actions of this role"
          value={mine}
          icon={UserRound}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <ActionsByOwnerCard chart={ownerChart} badge={<SyntheticDataBadge />} className="xl:col-span-3" />
        <AgingCard chart={agingChart} badge={<SyntheticDataBadge />} className="xl:col-span-2" />
      </div>

      <section className="ptepi-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-6">
          <div>
            <h2 className="text-base font-semibold">All actions</h2>
            <p className="text-sm text-muted-foreground">
              Raised by the agents from the seeded exceptions and by S4 and S7. Demo role: {role.label}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SyntheticDataBadge />
            <Button
              type="button"
              variant={mineOnly ? "default" : "outline"}
              aria-pressed={mineOnly}
              onClick={() => {
                setMineOnly((value) => !value);
                setPage(1);
              }}
            >
              <UserCheck size={16} aria-hidden />
              My role only
            </Button>
            <Button
              type="button"
              disabled={!canPerform(role, "create")}
              title={canPerform(role, "create") ? undefined : `${role.label} cannot create actions`}
              className="bg-primary-700 text-white hover:bg-primary-800"
              onClick={() => setCreating(true)}
            >
              <Plus size={16} aria-hidden />
              New action
            </Button>
          </div>
        </div>
        <div className="p-2">
          {!seeded ? (
            <p role="status" className="p-10 text-center text-sm text-muted-foreground">
              Loading actions
            </p>
          ) : actions.length === 0 ? (
            <EmptyState title="No actions yet" description="Actions appear here once the agents raise them." />
          ) : (
            <Table
              name="action"
              columns={columns}
              data={rows.slice((page - 1) * pageSize, page * pageSize)}
              getRowId={(row) => row.id}
              searchValue={search}
              onSearchChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              searchPlaceholder="Search action, project or owner"
              filters={filters}
              onResetFilters={() => {
                setProject(ALL);
                setOwner(ALL);
                setStatus(ALL);
                setSource(ALL);
                setPage(1);
              }}
              emptyState={{ description: "No action matches the current filters." }}
              pagination={{
                page,
                pageSize,
                totalEntries: rows.length,
                onPageChange: setPage,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                onPageSizeChange: (size) => {
                  setPageSize(size);
                  setPage(1);
                }
              }}
            />
          )}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        AI recommends, people decide. The role switcher in the top bar is a demo only: it changes what
        this screen enables and highlights, and is not real access control.
      </p>

      <CreateActionDialog
        open={creating}
        onOpenChange={setCreating}
        projectOptions={projectOptions}
        defaultOwnerRole={role.ownerRoles[0] ?? "Project Manager"}
        defaultDueDate={dueDateAfter(asAt, 7)}
      />
      <AssignActionDialog action={assigning} onClose={() => setAssigning(null)} />
    </div>
  );
}

function dueDateAfter(isoDate: string, days: number): string {
  return new Date(Date.parse(isoDate) + days * 86_400_000).toISOString().slice(0, 10);
}

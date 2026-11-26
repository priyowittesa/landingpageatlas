"use client";

import { Tr, useT } from "./Tr";
import { formatDate } from "../format";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { DueQueuePanel, OwnerLoadPanel } from "./ActionFocus";
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
          <Tr>In progress</Tr>
        </Badge>
      )}
      {action.status === "done" && <StatusBadge tone="good" label="Done" />}
      {isOverdue(action, asAt) && (
        <div className="flex items-center gap-1 text-xs font-medium text-destructive">
          <TriangleAlert size={16} aria-hidden />
          <Tr>Overdue</Tr>
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
  const t = useT();
  const canStatus = canPerform(role, "status", action);
  const canAssign = canPerform(role, "assign", action);
  const canClose = canPerform(role, "close", action);

  const change = (status: ActionStatus) => {
    setStatus(action.id, status);
    toast.success(
      status === "done" ? `${action.id} ${t("closed")}` : `${action.id}: ${t(STATUS_LABELS[status])}`
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
              {t(STATUS_LABELS[status])}
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
        <Tr>Assign</Tr>
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
          <Tr>Close</Tr>
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
  const t = useT();
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

  const tableRef = useRef<HTMLElement>(null);
  const showOwner = (ownerRole: string) => {
    setOwner(ownerRole);
    setPage(1);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
      options: [{ label: t("All projects"), value: ALL }, ...getProjectOptions(actions).map((id) => ({ label: id, value: id }))]
    },
    {
      key: "owner",
      placeholder: "Owner role",
      value: owner,
      onChange: reset(setOwner),
      options: [{ label: t("All owner roles"), value: ALL }, ...OWNER_ROLES.map((r) => ({ label: r, value: r }))]
    },
    {
      key: "status",
      placeholder: "Status",
      value: status,
      onChange: reset(setStatus),
      options: [{ label: t("All statuses"), value: ALL }, ...STATUSES.map((s) => ({ label: t(STATUS_LABELS[s]), value: s }))]
    },
    {
      key: "source",
      placeholder: "Source screen",
      value: source,
      onChange: reset(setSource),
      options: [{ label: t("All sources"), value: ALL }, ...getSourceOptions(actions).map((s) => ({ label: t(s), value: s }))]
    }
  ];

  const rawColumns: TableColumn<EpiAction>[] = [
    {
      key: "action",
      header: <Tr>Action</Tr>,
      render: (row) => (
        <div className="min-w-52 max-w-72 whitespace-normal">
          <div className="text-xs font-semibold text-muted-foreground">{row.id}</div>
          <div className="font-medium"><Tr>{row.title}</Tr></div>
        </div>
      )
    },
    { key: "projectId", header: <Tr>Project</Tr>, render: (row) => <span className="font-semibold">{row.projectId}</span> },
    {
      key: "owner",
      header: <Tr>Owner role</Tr>,
      render: (row) => (
        <div className="min-w-36 max-w-44 space-y-1 whitespace-normal">
          <div>{row.ownerRole}</div>
          {isRelevantTo(role, row) && (
            <Badge variant="outline" className="gap-1.5 border-primary-500 text-primary-700">
              <UserCheck size={16} aria-hidden />
              <Tr>Yours</Tr>
            </Badge>
          )}
        </div>
      )
    },
    { key: "dueDate", header: <Tr>Due</Tr>, className: "whitespace-nowrap", render: (row) => formatDate(row.dueDate) },
    { key: "status", header: <Tr>Status</Tr>, render: (row) => <StatusCell action={row} asAt={asAt} /> },
    {
      key: "source",
      header: <Tr>Source</Tr>,
      render: (row) => <div className="max-w-40 whitespace-normal text-xs text-muted-foreground"><Tr>{row.source}</Tr></div>
    },
    {
      key: "autonomy",
      header: <Tr>Autonomy</Tr>,
      className: "max-w-28 whitespace-normal",
      render: (row) => <Tr>{AUTONOMY_LABELS[row.autonomy]}</Tr>
    },
    {
      key: "controls",
      header: <Tr>Update</Tr>,
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

      <div className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2">
        <DueQueuePanel actions={actions} asAt={asAt} role={role} insight={agingChart.takeaway} />
        <OwnerLoadPanel actions={actions} asAt={asAt} role={role} insight={ownerChart.takeaway} onShowOwner={showOwner} />
      </div>

      <section ref={tableRef} className="ptepi-card scroll-mt-20 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-6">
          <div>
            <h2 className="text-base font-semibold"><Tr>All actions</Tr></h2>
            <p className="text-sm text-muted-foreground">
              Raised by the agents from the seeded exceptions and by the Evidence gate and Nexa Intelligence. Demo role: {role.label}.
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
              <Tr>My role only</Tr>
            </Button>
            <Button
              type="button"
              disabled={!canPerform(role, "create")}
              title={canPerform(role, "create") ? undefined : `${role.label} cannot create actions`}
              className="bg-primary-700 text-white hover:bg-primary-800"
              onClick={() => setCreating(true)}
            >
              <Plus size={16} aria-hidden />
              <Tr>New action</Tr>
            </Button>
          </div>
        </div>
        <div className="p-2">
          {!seeded ? (
            <p role="status" className="p-10 text-center text-sm text-muted-foreground">
              <Tr>Loading actions</Tr>
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
              searchPlaceholder={t("Search action, project or owner")}
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
        <Tr>AI recommends, people decide. The role switcher in the top bar is a demo only: it changes what this screen enables and highlights, and is not real access control.</Tr>
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

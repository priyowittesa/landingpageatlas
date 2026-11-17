"use client";

import {
  Box,
  ChevronDown,
  ChevronLeft,
  Download,
  Filter,
  MoreVertical,
  Search,
  UsersRound
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDisplayValue } from "@/lib/format-display-value";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { Employee } from "@/types/type-employee";
import { useEmployees } from "../../master-data/employee/use-employees";
import {
  useLabourMembers,
  useProjects,
  useRoles,
  type LabourRosterMember,
  type ReferenceOption
} from "../../master-data/projects/use-projects";
import type { Project } from "../../master-data/projects/types";
import { useShifts } from "../shifts/use-shifts";
import type { Shift } from "../shifts/types";
import {
  useLabourSchedules,
  type LabourSchedule
} from "../active-project/use-labour-schedules";
import {
  getPeriodEnd,
  getPeriodLabel,
  getPeriodStart,
  getScheduleDays,
  movePeriod
} from "../active-project/components/rostering-period";
import { RosteringPeriodControls } from "../active-project/components/rostering-period-controls";
import type { SchedulePeriod } from "../active-project/components/rostering-types";
import { SHIFT_COLORS } from "../active-project/components/shift-palette";

const EMPLOYEE_COLUMN_WIDTH = 220;
const DAY_COLUMN_WIDTH = 104;

function toggleSetValue(
  current: Set<string>,
  value: string,
  selected: boolean
) {
  const next = new Set(current);
  if (selected) next.add(value);
  else next.delete(value);
  return next;
}

export default function AllEmployeePage() {
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [period, setPeriod] = useState<SchedulePeriod>("monthly");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [search, setSearch] = useState("");
  const [selectedShiftIds, setSelectedShiftIds] = useState(
    () => new Set<string>()
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState(
    () => new Set<string>()
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState(
    () => new Set<string>()
  );
  const [collapsedProjectIds, setCollapsedProjectIds] = useState(
    () => new Set<string>()
  );

  const periodStart = useMemo(
    () => getPeriodStart(anchorDate, period),
    [anchorDate, period]
  );
  const periodEnd = useMemo(
    () => getPeriodEnd(anchorDate, period),
    [anchorDate, period]
  );
  const days = useMemo(
    () => getScheduleDays(periodStart, periodEnd),
    [periodEnd, periodStart]
  );
  const startDate = days[0]?.date ?? "";
  const endDate = days[days.length - 1]?.date ?? "";
  const serverProjectId =
    selectedProjectIds.size === 1 ? [...selectedProjectIds][0] : undefined;

  const membersQuery = useLabourMembers({
    endDate,
    pageSize: 1000,
    projectId: serverProjectId,
    startDate
  });
  const schedulesQuery = useLabourSchedules({
    endDate,
    pageSize: 1000,
    projectId: serverProjectId,
    startDate
  });
  const projectsQuery = useProjects();
  const employeesQuery = useEmployees();
  const rolesQuery = useRoles();
  const shiftsQuery = useShifts();

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Labour Rostering" },
      { title: "All Employee" }
    ]);
    return clearBreadcrumbs;
  }, [clearBreadcrumbs, setBreadcrumbItems]);

  const employeesById = useMemo(
    () =>
      new Map(
        (employeesQuery.data ?? []).map((employee) => [employee.id, employee])
      ),
    [employeesQuery.data]
  );
  const projectsById = useMemo(
    () =>
      new Map(
        (projectsQuery.data ?? []).map((project) => [project.id, project])
      ),
    [projectsQuery.data]
  );
  const rolesById = useMemo(
    () => new Map((rolesQuery.data ?? []).map((role) => [role.id, role.name])),
    [rolesQuery.data]
  );
  const shiftsById = useMemo(
    () =>
      new Map(
        (shiftsQuery.data ?? []).map((shift, index) => [
          shift.id,
          { index, shift }
        ])
      ),
    [shiftsQuery.data]
  );
  const schedulesByCell = useMemo(() => {
    const result = new Map<string, NonNullable<typeof schedulesQuery.data>>();
    (schedulesQuery.data ?? []).forEach((schedule) => {
      if (selectedShiftIds.size && !selectedShiftIds.has(schedule.shift_id)) {
        return;
      }
      const key = `${schedule.member_id}:${schedule.date}`;
      const schedules = result.get(key);
      if (schedules) schedules.push(schedule);
      else result.set(key, [schedule]);
    });
    return result;
  }, [schedulesQuery.data, selectedShiftIds]);

  const groupedMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const groups = new Map<string, LabourRosterMember[]>();

    (membersQuery.data?.members ?? []).forEach((member) => {
      if (!member.labour_id) return;
      if (
        selectedProjectIds.size &&
        !selectedProjectIds.has(member.project_id)
      ) {
        return;
      }
      const employee = employeesById.get(member.labour_id);
      const roleId =
        member.member_role_id ||
        member.role_in_project ||
        employee?.role_id ||
        "";
      if (selectedRoleIds.size && !selectedRoleIds.has(roleId)) return;

      const name =
        member.labour_name || employee?.full_name || "Unnamed Employee";
      const roleName =
        member.member_role_name ||
        rolesById.get(roleId) ||
        employee?.role_name ||
        "Unassigned Role";
      if (
        query &&
        ![name, roleName, employee?.code ?? ""].some((value) =>
          formatDisplayValue(value, "").toLowerCase().includes(query)
        )
      ) {
        return;
      }

      const projectMembers = groups.get(member.project_id);
      if (projectMembers) projectMembers.push(member);
      else groups.set(member.project_id, [member]);
    });

    return [...groups.entries()].sort(([leftId], [rightId]) => {
      const left = projectsById.get(leftId)?.title ?? leftId;
      const right = projectsById.get(rightId)?.title ?? rightId;
      return left.localeCompare(right);
    });
  }, [
    employeesById,
    membersQuery.data?.members,
    projectsById,
    rolesById,
    search,
    selectedProjectIds,
    selectedRoleIds
  ]);

  const activeFilterCount =
    selectedShiftIds.size + selectedProjectIds.size + selectedRoleIds.size;
  const periodLabel = getPeriodLabel(period, periodStart, periodEnd);
  const isLoading =
    membersQuery.isLoading ||
    schedulesQuery.isLoading ||
    projectsQuery.isLoading ||
    employeesQuery.isLoading ||
    rolesQuery.isLoading ||
    shiftsQuery.isLoading;
  const isError =
    membersQuery.isError ||
    schedulesQuery.isError ||
    projectsQuery.isError ||
    rolesQuery.isError ||
    shiftsQuery.isError;

  const downloadReport = () => {
    const rows = groupedMembers.flatMap(([projectId, members]) =>
      members.flatMap((member) => {
        const employee = employeesById.get(member.labour_id);
        const project = projectsById.get(projectId);
        return days.flatMap((day) =>
          (schedulesByCell.get(`${member.id}:${day.date}`) ?? []).map(
            (schedule) => {
              const shift = shiftsById.get(schedule.shift_id)?.shift;
              return [
                project?.code ?? "",
                project?.title ?? projectId,
                employee?.code ?? "",
                member.labour_name || employee?.full_name || "",
                member.member_role_name ||
                  rolesById.get(
                    member.member_role_id || member.role_in_project
                  ) ||
                  "",
                day.date,
                shift?.code ?? "",
                shift?.name ?? ""
              ];
            }
          )
        );
      })
    );
    const csv = [
      [
        "Project Code",
        "Project",
        "Employee Code",
        "Employee",
        "Role",
        "Date",
        "Shift Code",
        "Shift"
      ],
      ...rows
    ]
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `all-employee-${startDate}-${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-8">
      <header className="flex flex-wrap items-start gap-3">
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
          <h1 className="text-xl font-semibold">All Employee</h1>
          <p className="text-xs text-muted-foreground">
            View employee schedule and availability
          </p>
        </div>
        <Button className="ml-auto" onClick={downloadReport}>
          <Download />
          Download Report
        </Button>
      </header>

      <ShiftStatusPalette shifts={shiftsQuery.data ?? []} />

      <div className="flex w-full flex-wrap items-center gap-2">
        <RosteringPeriodControls
          onMovePeriod={(amount) =>
            setAnchorDate((date) => movePeriod(date, period, amount))
          }
          onPeriodChange={setPeriod}
          period={period}
          periodLabel={periodLabel}
        />

        <RosterFilters
          activeCount={activeFilterCount}
          projects={projectsQuery.data ?? []}
          roles={rolesQuery.data ?? []}
          selectedProjectIds={selectedProjectIds}
          selectedRoleIds={selectedRoleIds}
          selectedShiftIds={selectedShiftIds}
          setSelectedProjectIds={setSelectedProjectIds}
          setSelectedRoleIds={setSelectedRoleIds}
          setSelectedShiftIds={setSelectedShiftIds}
          shifts={shiftsQuery.data ?? []}
        />

        <div className="relative w-full sm:ml-auto sm:min-w-64 sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee..."
            className="h-9 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="max-h-[72vh] overflow-auto rounded-lg border bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
            Loading employee schedules...
          </div>
        ) : isError ? (
          <div className="flex min-h-80 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            Employee schedules could not be loaded.
            <Button
              variant="outline"
              onClick={() => {
                membersQuery.refetch();
                schedulesQuery.refetch();
                projectsQuery.refetch();
                rolesQuery.refetch();
                shiftsQuery.refetch();
              }}
            >
              Try Again
            </Button>
          </div>
        ) : !groupedMembers.length ? (
          <div className="flex min-h-80 flex-col items-center justify-center text-center">
            <UsersRound className="mb-3 h-10 w-10 text-primary-300" />
            <strong className="text-sm">No employees found</strong>
            <span className="mt-1 text-xs text-muted-foreground">
              Try changing the date range or filters.
            </span>
          </div>
        ) : (
          <div
            style={{
              minWidth: EMPLOYEE_COLUMN_WIDTH + days.length * DAY_COLUMN_WIDTH
            }}
          >
            <div className="sticky top-0 z-30 flex h-14 border-b bg-white text-xs">
              <div
                className="sticky left-0 z-40 flex shrink-0 items-center justify-center border-r bg-white font-semibold"
                style={{ width: EMPLOYEE_COLUMN_WIDTH }}
              >
                Employee
              </div>
              {days.map((day) => (
                <div
                  key={day.date}
                  className="flex shrink-0 flex-col items-center justify-center border-r text-center"
                  style={{ width: DAY_COLUMN_WIDTH }}
                >
                  <strong>{day.headerLabel}</strong>
                  <span className="text-[10px] text-muted-foreground">
                    {day.shortLabel}
                  </span>
                </div>
              ))}
            </div>

            {groupedMembers.map(([projectId, members]) => {
              const project = projectsById.get(projectId);
              const collapsed = collapsedProjectIds.has(projectId);
              return (
                <section key={projectId || "unassigned"}>
                  <button
                    type="button"
                    className="sticky left-0 flex h-10 w-full items-center gap-2 border-b bg-primary-50 px-3 text-left text-xs font-semibold text-primary-700"
                    onClick={() =>
                      setCollapsedProjectIds((current) =>
                        toggleSetValue(current, projectId, !collapsed)
                      )
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        collapsed && "-rotate-90"
                      )}
                    />
                    <span>
                      {project
                        ? `${project.code} - ${formatDisplayValue(project.title)}`
                        : projectId || "Unassigned Project"}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-normal text-primary-500">
                      {members.length} employee
                      {members.length === 1 ? "" : "s"}
                    </span>
                  </button>

                  {!collapsed &&
                    members.map((member) => (
                      <EmployeeScheduleRow
                        key={member.id}
                        days={days}
                        employee={employeesById.get(member.labour_id)}
                        member={member}
                        rolesById={rolesById}
                        schedulesByCell={schedulesByCell}
                        shiftsById={shiftsById}
                      />
                    ))}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ShiftStatusPalette({ shifts }: { shifts: Shift[] }) {
  return (
    <section className="rounded-lg border bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <Box className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold">Employee Status Palette</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {shifts.map((shift, index) => {
          const colors = SHIFT_COLORS[index % SHIFT_COLORS.length];
          return (
            <div
              key={shift.id}
              className={cn(
                "flex min-w-max overflow-hidden rounded-md border text-[11px]",
                colors.palette
              )}
            >
              <span className={cn("w-2", colors.handle)} />
              <span className="px-3 py-2 font-medium">
                {formatDisplayValue(shift.name)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RosterFilters({
  activeCount,
  projects,
  roles,
  selectedProjectIds,
  selectedRoleIds,
  selectedShiftIds,
  setSelectedProjectIds,
  setSelectedRoleIds,
  setSelectedShiftIds,
  shifts
}: {
  activeCount: number;
  projects: Project[];
  roles: ReferenceOption[];
  selectedProjectIds: Set<string>;
  selectedRoleIds: Set<string>;
  selectedShiftIds: Set<string>;
  setSelectedProjectIds: Dispatch<SetStateAction<Set<string>>>;
  setSelectedRoleIds: Dispatch<SetStateAction<Set<string>>>;
  setSelectedShiftIds: Dispatch<SetStateAction<Set<string>>>;
  shifts: Shift[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9">
          <Filter />
          Filter
          {activeCount > 0 && (
            <span className="rounded-full bg-primary-100 px-1.5 text-[10px] text-primary-700">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="max-h-[min(70vh,560px)] w-80 overflow-y-auto p-2"
      >
        <FilterSection
          label="Shift"
          items={shifts.map((shift) => ({
            id: shift.id,
            label: formatDisplayValue(shift.name)
          }))}
          selectedIds={selectedShiftIds}
          setSelectedIds={setSelectedShiftIds}
        />
        <FilterSection
          label="Project"
          items={projects.map((project) => ({
            id: project.id,
            label: `${project.code} - ${formatDisplayValue(project.title)}`
          }))}
          selectedIds={selectedProjectIds}
          setSelectedIds={setSelectedProjectIds}
        />
        <FilterSection
          label="Role"
          items={roles.map((role) => ({
            id: role.id,
            label: formatDisplayValue(role.name)
          }))}
          selectedIds={selectedRoleIds}
          setSelectedIds={setSelectedRoleIds}
        />
      </PopoverContent>
    </Popover>
  );
}

function FilterSection({
  items,
  label,
  selectedIds,
  setSelectedIds
}: {
  items: { id: string; label: string }[];
  label: string;
  selectedIds: Set<string>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? items.filter((item) => item.label.toLowerCase().includes(query))
      : items;
  }, [items, search]);

  return (
    <div className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left text-xs font-semibold hover:bg-slate-50"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {label}
          {selectedIds.size > 0 && (
            <span className="rounded-full bg-primary-100 px-1.5 py-0.5 text-[9px] text-primary-700">
              {selectedIds.size}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            !open && "-rotate-90"
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 px-2 pb-3">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="h-8 w-full bg-slate-50 pl-8 text-[11px]"
            />
          </div>

          <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <label
                key={item.id}
                className="flex min-h-8 cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-primary-50"
              >
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onCheckedChange={(checked) =>
                    setSelectedIds((current) =>
                      toggleSetValue(current, item.id, checked === true)
                    )
                  }
                  className="size-4 border-2 border-slate-400 bg-white data-[state=checked]:border-primary-600 data-[state=checked]:bg-primary-600"
                />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-700">
                  {item.label}
                </span>
              </label>
            ))}
            {!filteredItems.length && (
              <div className="rounded-md border border-dashed px-2 py-4 text-center text-[11px] text-muted-foreground">
                No {label.toLowerCase()} found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmployeeScheduleRow({
  days,
  employee,
  member,
  rolesById,
  schedulesByCell,
  shiftsById
}: {
  days: ReturnType<typeof getScheduleDays>;
  employee: Employee | undefined;
  member: LabourRosterMember;
  rolesById: Map<string, string>;
  schedulesByCell: Map<string, LabourSchedule[]>;
  shiftsById: Map<string, { index: number; shift: Shift }>;
}) {
  const roleId =
    member.member_role_id || member.role_in_project || employee?.role_id || "";
  const roleName =
    member.member_role_name ||
    rolesById.get(roleId) ||
    employee?.role_name ||
    "Unassigned Role";

  return (
    <div className="flex min-h-20 border-b text-xs">
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r bg-white px-3"
        style={{ width: EMPLOYEE_COLUMN_WIDTH }}
      >
        <span className="min-w-0 flex-1">
          <strong className="block truncate">
            {formatDisplayValue(
              member.labour_name || employee?.full_name || "Unnamed Employee"
            )}
          </strong>
          <span className="block truncate text-[10px] text-muted-foreground">
            {formatDisplayValue(roleName)}
          </span>
        </span>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {days.map((day) => {
        const schedules = schedulesByCell.get(`${member.id}:${day.date}`) ?? [];
        const visibleSchedules = schedules.slice(0, 1);
        const hiddenSchedules = schedules.slice(1);
        return (
          <div
            key={day.date}
            className="flex shrink-0 flex-col justify-center gap-1 border-r p-1.5"
            style={{ width: DAY_COLUMN_WIDTH }}
          >
            {visibleSchedules.map((schedule) => {
              const shiftData = shiftsById.get(schedule.shift_id);
              if (!shiftData) return null;
              const colors =
                SHIFT_COLORS[shiftData.index % SHIFT_COLORS.length];
              return (
                <div
                  key={schedule.id || `${schedule.shift_id}:${day.date}`}
                  className={cn(
                    "rounded-md border px-1.5 py-2 text-center",
                    colors.card
                  )}
                >
                  <strong className="block truncate text-[10px]">
                    {shiftData.shift.code}
                  </strong>
                  <span className="block truncate text-[9px]">
                    {formatDisplayValue(shiftData.shift.name)}
                  </span>
                </div>
              );
            })}
            {hiddenSchedules.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full rounded-md border border-dashed bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                    title={hiddenSchedules
                      .map((schedule) =>
                        formatDisplayValue(
                          shiftsById.get(schedule.shift_id)?.shift.name,
                          ""
                        )
                      )
                      .filter(Boolean)
                      .join(", ")}
                  >
                    +{hiddenSchedules.length}
                  </button>
                </PopoverTrigger>
                <PopoverContent align="center" className="w-64 space-y-2 p-3">
                  <div>
                    <strong className="block text-xs">
                      {formatDisplayValue(
                        member.labour_name || employee?.full_name || "Employee"
                      )}
                    </strong>
                    <span className="text-[10px] text-muted-foreground">
                      {day.headerLabel}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {schedules.map((schedule) => {
                      const shiftData = shiftsById.get(schedule.shift_id);
                      if (!shiftData) return null;
                      const colors =
                        SHIFT_COLORS[shiftData.index % SHIFT_COLORS.length];
                      return (
                        <div
                          key={
                            schedule.id || `${schedule.shift_id}:${day.date}`
                          }
                          className={cn(
                            "rounded-md border px-2 py-2 text-center",
                            colors.card
                          )}
                        >
                          <strong className="block text-[10px]">
                            {shiftData.shift.code}
                          </strong>
                          <span className="block text-[9px]">
                            {formatDisplayValue(shiftData.shift.name)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      })}
    </div>
  );
}

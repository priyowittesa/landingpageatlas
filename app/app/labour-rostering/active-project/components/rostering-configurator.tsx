"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState
} from "react";
import { LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { formatDisplayValue } from "@/lib/format-display-value";
import type { Employee } from "@/types/type-employee";
import {
  useBulkDeleteProjectMembers,
  useAddProjectMembers,
  useUpdateProjectMemberOrder,
  useUpdateProjectMembers,
  type LabourMemberPayload,
  type LabourRosterGroup,
  type LabourRosterMember,
  type ReferenceOption
} from "../../../master-data/projects/use-projects";
import type { Project } from "../../../master-data/projects/types";
import type { Shift } from "../../shifts/types";
import {
  useBulkDeleteLabourSchedules,
  useBulkSaveLabourSchedules,
  useDraftLabourSchedules,
  useGenerateLabourSchedulePreview,
  useLabourSchedules,
  type LabourSchedulePreviewSuggestion
} from "../use-labour-schedules";
import {
  useDeleteLabourGroup,
  useUpdateLabourGroupOrder
} from "../use-labour-groups";
import { AddGroupDialog } from "./add-group-dialog";
import {
  AiScheduleDialog,
  type AiScheduleRequest,
  type AiScheduleRoleOption
} from "./ai-schedule-dialog";
import { AiScheduleReviewDialog } from "./ai-schedule-review-dialog";
import { AssignEmployeeDialog } from "./assign-employee-dialog";
import { AssignMemberEmployeeDialog } from "./assign-member-employee-dialog";
import { AssignRoleDialog } from "./assign-role-dialog";
import {
  ChangeMemberDateDialog,
  type MemberDateTarget
} from "./change-member-date-dialog";
import { EditGroupDialog } from "./edit-group-dialog";
import {
  RosterCalendar,
  type MemberOrderChange,
  type RosterCalendarGroup
} from "./roster-calendar";
import {
  RosteringActions,
  RosteringCalendarControls,
  RosteringHeader
} from "./rostering-controls";
import {
  getPeriodEnd,
  getPeriodLabel,
  getPeriodStart,
  getScheduleDays,
  movePeriod
} from "./rostering-period";
import {
  assignmentCellKey,
  type Assignment,
  type SchedulePeriod
} from "./rostering-types";
import { ShiftPalette } from "./shift-palette";

type RosteringConfiguratorProps = {
  employees: Employee[];
  memberGroups: LabourRosterGroup[];
  members: LabourRosterMember[];
  onDateRangeChange: (startDate: string, endDate: string) => void;
  project: Project;
  roles: ReferenceOption[];
  shifts: Shift[];
};

const roleMemberRowId = (memberId: string) => `role-member:${memberId}`;
type GroupActionTarget = { id: string; name: string };

function expandIsoDateRange(fromDate?: string, toDate?: string): string[] {
  if (!fromDate || !toDate) return [];
  const start = new Date(`${fromDate}T00:00:00Z`);
  const end = new Date(`${toDate}T00:00:00Z`);
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return [];
  }

  const dates: string[] = [];
  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    dates.push(cursor.toISOString().slice(0, 10));
  }
  return dates;
}

export function RosteringConfigurator({
  project,
  employees,
  memberGroups,
  members,
  onDateRangeChange,
  roles,
  shifts
}: RosteringConfiguratorProps) {
  const [period, setPeriod] = useState<SchedulePeriod>("monthly");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [employeeSearch, setEmployeeSearch] = useState("");
  const deferredEmployeeSearch = useDeferredValue(employeeSearch);
  const [rosterEmployeeIds, setRosterEmployeeIds] = useState<string[]>([]);
  const [visibleRoleMemberIds, setVisibleRoleMemberIds] = useState<string[]>(
    []
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(
    () => new Set<string>()
  );
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [aiScheduleDialogOpen, setAiScheduleDialogOpen] = useState(false);
  const [aiReviewDialogOpen, setAiReviewDialogOpen] = useState(false);
  const [draftPreviewItems, setDraftPreviewItems] = useState<
    LabourSchedulePreviewSuggestion[]
  >([]);
  const [assignEmployeeGroup, setAssignEmployeeGroup] =
    useState<GroupActionTarget | null>(null);
  const [assigningMemberEmployee, setAssigningMemberEmployee] =
    useState<LabourRosterMember | null>(null);
  const [assignRoleDialogOpen, setAssignRoleDialogOpen] = useState(false);
  const [addGroupDialogOpen, setAddGroupDialogOpen] = useState(false);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [customGroups, setCustomGroups] = useState<LabourRosterGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<GroupActionTarget | null>(
    null
  );
  const [deletingGroup, setDeletingGroup] = useState<GroupActionTarget | null>(
    null
  );
  const [deletingMember, setDeletingMember] =
    useState<LabourRosterMember | null>(null);
  const [changingMemberDate, setChangingMemberDate] =
    useState<MemberDateTarget | null>(null);
  const generatePreview = useGenerateLabourSchedulePreview();
  const draftLabourSchedules = useDraftLabourSchedules();
  const bulkDeleteMembers = useBulkDeleteProjectMembers();
  const updateProjectMembers = useUpdateProjectMembers();
  const updateProjectMemberOrder = useUpdateProjectMemberOrder();
  const addProjectMembers = useAddProjectMembers();
  const queryClient = useQueryClient();
  const bulkDeleteLabourSchedules = useBulkDeleteLabourSchedules();
  const bulkSaveLabourSchedules = useBulkSaveLabourSchedules();
  const updateLabourGroupOrder = useUpdateLabourGroupOrder();
  const deleteLabourGroup = useDeleteLabourGroup();

  useEffect(() => {
    const projectEmployeeIds = new Set([
      ...project.project_team.map((member) => member.labour_id),
      ...members.map((member) => member.labour_id).filter(Boolean)
    ]);
    setRosterEmployeeIds((current) => [
      ...new Set([
        ...current,
        ...Array.from(projectEmployeeIds).filter(Boolean)
      ])
    ]);
    setVisibleRoleMemberIds((current) => [
      ...new Set([
        ...current,
        ...members
          .filter((member) => !member.labour_id)
          .map((member) => roleMemberRowId(member.id))
      ])
    ]);
    setAssignedRoleIds((current) => [
      ...new Set([
        ...current,
        ...members
          .filter((member) => !member.labour_id)
          .map((member) => member.member_role_id || member.role_in_project)
          .filter(Boolean)
      ])
    ]);
  }, [members, project.project_team]);

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
  const schedulesQuery = useLabourSchedules({
    endDate: days[days.length - 1]?.date ?? "",
    pageSize: 1000,
    projectId: project.id,
    startDate: days[0]?.date ?? ""
  });
  useEffect(() => {
    const startDate = days[0]?.date;
    const endDate = days[days.length - 1]?.date;
    if (startDate && endDate) {
      onDateRangeChange(startDate, endDate);
    }
  }, [days, onDateRangeChange]);
  const periodLabel = useMemo(
    () => getPeriodLabel(period, periodStart, periodEnd),
    [period, periodEnd, periodStart]
  );

  const rosterEmployeeIdSet = useMemo(
    () => new Set(rosterEmployeeIds),
    [rosterEmployeeIds]
  );
  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees]
  );
  const roleNameMap = useMemo(
    () => new Map(roles.map((role) => [role.id, role.name])),
    [roles]
  );
  const actualRosterEmployees = useMemo(() => {
    const result = employees.filter((employee) =>
      rosterEmployeeIdSet.has(employee.id)
    );
    const resolvedIds = new Set(result.map((employee) => employee.id));

    members.forEach((member) => {
      if (
        !member.labour_id ||
        !rosterEmployeeIdSet.has(member.labour_id) ||
        resolvedIds.has(member.labour_id)
      ) {
        return;
      }
      const roleId = member.member_role_id || member.role_in_project;
      const roleName =
        member.member_role_name || roleNameMap.get(roleId) || "Unassigned Role";
      result.push({
        id: member.labour_id,
        address: "",
        code: member.id,
        date_of_birth: "",
        department_id: member.department_id,
        department_name: member.department_name,
        email: "",
        full_name: member.labour_name || roleName,
        gender: "",
        phone_number: "",
        position_id: "",
        position_name: "",
        preferred_name: "",
        role_id: roleId,
        role_name: roleName,
        type: member.labour_name ? "employee" : "role",
        status: "",
        contract_end_date: member.end_date,
        rate_card_id: "",
        cost_rate: "",
        note: member.responsibility
      });
    });

    return result;
  }, [employees, members, roleNameMap, rosterEmployeeIdSet]);
  const visibleRoleMemberIdSet = useMemo(
    () => new Set(visibleRoleMemberIds),
    [visibleRoleMemberIds]
  );
  const roleRosterMembers = useMemo(
    () =>
      members
        .filter(
          (member) =>
            !member.labour_id &&
            visibleRoleMemberIdSet.has(roleMemberRowId(member.id))
        )
        .map((member): Employee => {
          const roleId = member.member_role_id || member.role_in_project;
          const roleName =
            member.member_role_name ||
            roleNameMap.get(roleId) ||
            "Unassigned Role";

          return {
            id: roleMemberRowId(member.id),
            address: "",
            code: member.responsibility || "Role",
            date_of_birth: "",
            department_id: member.department_id,
            department_name: member.department_name,
            email: "",
            full_name: roleName,
            gender: "",
            phone_number: "",
            position_id: "",
            position_name: "",
            preferred_name: "",
            role_id: roleId,
            role_name: roleName,
            type: "role",
            status: "",
            contract_end_date: member.end_date,
            rate_card_id: "",
            cost_rate: "",
            note: member.responsibility
          };
        }),
    [members, roleNameMap, visibleRoleMemberIdSet]
  );
  const allRosterEmployees = useMemo(() => {
    const draftSynthetics: Employee[] = [];
    const draftIds = new Set<string>();
    draftPreviewItems.forEach((item) => {
      const draftId = `draft:${item.employee_id}`;
      if (draftIds.has(draftId)) return;
      draftIds.add(draftId);
      const roleId = item.role_id;
      const roleName =
        item.role_name || roleNameMap.get(roleId) || "Unassigned Role";
      draftSynthetics.push({
        id: draftId,
        address: "",
        code: item.employee_id,
        date_of_birth: "",
        department_id: "",
        department_name: "",
        email: "",
        full_name: item.employee_name || "Draft Employee",
        gender: "",
        phone_number: "",
        position_id: "",
        position_name: item.position_name || "",
        preferred_name: "",
        role_id: roleId,
        role_name: roleName,
        type: "employee",
        status: "",
        contract_end_date: "",
        rate_card_id: "",
        cost_rate: "",
        note: ""
      });
    });
    return [...actualRosterEmployees, ...roleRosterMembers, ...draftSynthetics];
  }, [
    actualRosterEmployees,
    draftPreviewItems,
    roleNameMap,
    roleRosterMembers
  ]);
  const groupNameByRosterId = useMemo(() => {
    const result = new Map<string, string>();
    members.forEach((member) => {
      const groupName = member.group_name || "Ungrouped";
      if (member.labour_id) result.set(member.labour_id, groupName);
      else result.set(roleMemberRowId(member.id), groupName);
    });
    draftPreviewItems.forEach((item) => {
      result.set(`draft:${item.employee_id}`, "Ungrouped");
    });
    return result;
  }, [draftPreviewItems, members]);
  const memberPositionByRosterId = useMemo(
    () =>
      new Map(
        members.map((member, index) => [
          member.labour_id || roleMemberRowId(member.id),
          member.position ?? index
        ])
      ),
    [members]
  );
  const memberRoleNameByRosterId = useMemo(
    () =>
      new Map(
        members.map((member) => [
          member.labour_id || roleMemberRowId(member.id),
          member.member_role_name
        ])
      ),
    [members]
  );
  const memberDateRangeByRosterId = useMemo(() => {
    const result = new Map<string, { endDate: string; startDate: string }>();
    members.forEach((member) => {
      result.set(member.labour_id || roleMemberRowId(member.id), {
        endDate: member.end_date,
        startDate: member.start_date
      });
    });
    draftPreviewItems.forEach((item) => {
      const startDate =
        item.start_date ?? item.from_date ?? item.dates?.[0] ?? item.date;
      const endDate =
        item.end_date ?? item.to_date ?? item.dates?.at(-1) ?? item.date;
      if (!startDate || !endDate) return;
      const employeeId = `draft:${item.employee_id}`;
      const current = result.get(employeeId);
      result.set(employeeId, {
        startDate:
          !current?.startDate || startDate < current.startDate
            ? startDate
            : current.startDate,
        endDate:
          !current?.endDate || endDate > current.endDate
            ? endDate
            : current.endDate
      });
    });
    assignments.forEach((assignment) => {
      if (!assignment.isDraft) return;
      const current = result.get(assignment.employeeId);
      result.set(assignment.employeeId, {
        startDate:
          !current?.startDate || assignment.date < current.startDate
            ? assignment.date
            : current.startDate,
        endDate:
          !current?.endDate || assignment.date > current.endDate
            ? assignment.date
            : current.endDate
      });
    });
    return result;
  }, [assignments, draftPreviewItems, members]);
  const rosterEmployees = useMemo(() => {
    const query = deferredEmployeeSearch.trim().toLowerCase();
    if (!query) return allRosterEmployees;

    return allRosterEmployees.filter(
      (employee) =>
        formatDisplayValue(employee.full_name, "")
          .toLowerCase()
          .includes(query) ||
        formatDisplayValue(employee.role_name, "")
          .toLowerCase()
          .includes(query) ||
        employee.code.toLowerCase().includes(query)
    );
  }, [allRosterEmployees, deferredEmployeeSearch]);
  const calendarGroups = useMemo<RosterCalendarGroup[]>(() => {
    const employeesByGroup = new Map<string, Employee[]>();
    memberGroups.forEach((group) => {
      employeesByGroup.set(group.group_name || "Ungrouped", []);
    });
    rosterEmployees.forEach((employee) => {
      const groupName = groupNameByRosterId.get(employee.id) || "Ungrouped";
      const group = employeesByGroup.get(groupName);
      if (group) group.push(employee);
      else employeesByGroup.set(groupName, [employee]);
    });
    employeesByGroup.forEach((employees) => {
      employees.sort(
        (left, right) =>
          (memberPositionByRosterId.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
          (memberPositionByRosterId.get(right.id) ?? Number.MAX_SAFE_INTEGER)
      );
    });

    const knownGroupNames = new Set<string>();
    const groups = memberGroups.map((group) => {
      const name = group.group_name || "Ungrouped";
      knownGroupNames.add(name);
      return {
        employees: employeesByGroup.get(name) ?? [],
        id: group.group_id,
        isCustom: false,
        name
      };
    });
    employeesByGroup.forEach((employees, name) => {
      if (!knownGroupNames.has(name)) {
        groups.push({ employees, id: "", isCustom: false, name });
      }
    });
    customGroups.forEach((group) => {
      const name = group.group_name || "Ungrouped";
      if (!knownGroupNames.has(name)) {
        groups.push({
          employees: [],
          id: group.group_id,
          isCustom: true,
          name
        });
        knownGroupNames.add(name);
      }
    });
    return groups;
  }, [
    customGroups,
    groupNameByRosterId,
    memberGroups,
    memberPositionByRosterId,
    rosterEmployees
  ]);

  const updateGroupOrder = useCallback(
    async (groupIds: string[]) => {
      const startDate = days[0]?.date;
      const endDate = days[days.length - 1]?.date;
      if (!startDate || !endDate || !groupIds.length) return;

      await updateLabourGroupOrder.mutateAsync({
        end_date: endDate,
        items: groupIds.map((groupId, position) => ({
          group_id: groupId,
          position
        })),
        project_id: project.id,
        start_date: startDate
      });
    },
    [days, project.id, updateLabourGroupOrder]
  );

  const shiftMap = useMemo(
    () => new Map(shifts.map((shift, index) => [shift.id, { shift, index }])),
    [shifts]
  );
  const assignmentsByCell = useMemo(() => {
    const result = new Map<string, Assignment[]>();
    assignments.forEach((assignment) => {
      const key = assignmentCellKey(assignment.employeeId, assignment.date);
      const cellAssignments = result.get(key);
      if (cellAssignments) cellAssignments.push(assignment);
      else result.set(key, [assignment]);
    });
    return result;
  }, [assignments]);
  const draftAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.isDraft),
    [assignments]
  );
  const draftRecommendedEmployeeCount = useMemo(
    () =>
      new Set(
        draftAssignments
          .map((assignment) => assignment.employeeId.replace(/^draft:/, ""))
          .filter(Boolean)
      ).size,
    [draftAssignments]
  );

  const memberIdByRosterId = useMemo(() => {
    const result = new Map<string, string>();
    project.project_team.forEach((member) => {
      if (member.member_id) {
        result.set(member.labour_id, member.member_id);
      }
    });
    members.forEach((member) => {
      result.set(member.labour_id || roleMemberRowId(member.id), member.id);
    });
    draftPreviewItems.forEach((item) => {
      result.set(`draft:${item.employee_id}`, item.employee_id);
    });
    return result;
  }, [draftPreviewItems, members, project.project_team]);
  const rosterIdByMemberId = useMemo(
    () =>
      new Map(
        [...memberIdByRosterId.entries()].map(([rosterId, memberId]) => [
          memberId,
          rosterId
        ])
      ),
    [memberIdByRosterId]
  );
  const memberByRosterId = useMemo(
    () =>
      new Map(
        members.map((member) => [
          member.labour_id || roleMemberRowId(member.id),
          member
        ])
      ),
    [members]
  );

  const updateMemberOrder = useCallback(
    async ({ items, rosterId, targetGroupId }: MemberOrderChange) => {
      const startDate = days[0]?.date;
      const endDate = days[days.length - 1]?.date;
      const orderItems = items.flatMap(({ position, rosterId: itemId }) => {
        const memberId = memberIdByRosterId.get(itemId);
        return memberId ? [{ memberId, position }] : [];
      });
      if (!startDate || !endDate || !orderItems.length) return;

      const member = memberByRosterId.get(rosterId);
      if (member && member.group_id !== targetGroupId) {
        const payload: LabourMemberPayload = {
          group_id: targetGroupId,
          project_id: project.id,
          responsibility: member.responsibility,
          role_in_project: member.member_role_id || member.role_in_project,
          ...(member.department_id
            ? { department_id: member.department_id }
            : {}),
          ...(member.end_date ? { end_date: member.end_date } : {}),
          ...(member.labour_id ? { labour_id: member.labour_id } : {}),
          ...(member.start_date ? { start_date: member.start_date } : {})
        };
        await updateProjectMembers.mutateAsync([{ id: member.id, payload }]);
      } else if (!member && targetGroupId) {
        toast.error("Unable to move member", {
          description: "The selected roster member could not be resolved."
        });
        throw new Error("Roster member could not be resolved");
      }

      await updateProjectMemberOrder.mutateAsync({
        end_date: endDate,
        items: orderItems.map((item) => ({
          member_id: item.memberId,
          position: item.position
        })),
        project_id: project.id,
        start_date: startDate
      });
    },
    [
      days,
      memberByRosterId,
      memberIdByRosterId,
      project.id,
      updateProjectMemberOrder,
      updateProjectMembers
    ]
  );

  useEffect(() => {
    if (!schedulesQuery.data?.length) return;

    const fetchedAssignments = schedulesQuery.data.flatMap(
      (schedule): Assignment[] => {
        const employeeId = rosterIdByMemberId.get(schedule.member_id);
        return employeeId
          ? [
              {
                date: schedule.date,
                employeeId,
                scheduleId: schedule.id || undefined,
                shiftId: schedule.shift_id
              }
            ]
          : [];
      }
    );
    if (!fetchedAssignments.length) return;

    setAssignments((current) => {
      const next = [...current];
      const assignmentIndex = new Map(
        next.map((assignment, index) => [
          `${assignmentCellKey(
            assignment.employeeId,
            assignment.date
          )}:${assignment.shiftId}`,
          index
        ])
      );
      let changed = false;

      fetchedAssignments.forEach((assignment) => {
        const key = `${assignmentCellKey(
          assignment.employeeId,
          assignment.date
        )}:${assignment.shiftId}`;
        const existingIndex = assignmentIndex.get(key);
        if (existingIndex !== undefined) {
          if (
            assignment.scheduleId &&
            next[existingIndex].scheduleId !== assignment.scheduleId
          ) {
            next[existingIndex] = {
              ...next[existingIndex],
              scheduleId: assignment.scheduleId
            };
            changed = true;
          }
          return;
        }
        assignmentIndex.set(key, next.length);
        next.push(assignment);
        changed = true;
      });
      return changed ? next : current;
    });
  }, [rosterIdByMemberId, schedulesQuery.data]);

  const dropShift = useCallback(
    async (
      shiftId: string,
      targets: { date: string; employeeId: string }[]
    ) => {
      if (!shiftMap.has(shiftId)) return;

      const uniqueTargets = new Map(
        targets.map((target) => [
          assignmentCellKey(target.employeeId, target.date),
          target
        ])
      );
      const newTargets = [...uniqueTargets.values()].filter(
        ({ date, employeeId }) =>
          !assignmentsByCell
            .get(assignmentCellKey(employeeId, date))
            ?.some((assignment) => assignment.shiftId === shiftId)
      );
      const draftTargets = newTargets.filter((target) =>
        target.employeeId.startsWith("draft:")
      );
      if (draftTargets.length) {
        const draftCellKeys = new Set(
          draftTargets.map((target) =>
            assignmentCellKey(target.employeeId, target.date)
          )
        );
        setAssignments((current) => [
          ...current.filter(
            (assignment) =>
              !(
                assignment.isDraft &&
                draftCellKeys.has(
                  assignmentCellKey(assignment.employeeId, assignment.date)
                )
              )
          ),
          ...draftTargets.map((target) => ({
            ...target,
            isDraft: true,
            shiftId
          }))
        ]);
      }

      const regularTargets = newTargets.filter(
        (target) => !target.employeeId.startsWith("draft:")
      );
      const savableTargets = regularTargets.flatMap((target) => {
        const memberId = memberIdByRosterId.get(target.employeeId);
        return memberId ? [{ memberId, target }] : [];
      });
      if (!savableTargets.length) {
        if (regularTargets.length) {
          toast.error("Unable to assign shift", {
            description: "The selected roster member does not have a member ID."
          });
        }
        return;
      }

      const optimisticKeys = new Set(
        savableTargets.map(
          ({ target }) =>
            `${assignmentCellKey(target.employeeId, target.date)}:${shiftId}`
        )
      );
      setAssignments((current) => [
        ...current,
        ...savableTargets.map(({ target }) => ({ ...target, shiftId }))
      ]);

      try {
        await bulkSaveLabourSchedules.mutateAsync(
          savableTargets.map(({ memberId, target }) => ({
            date: target.date,
            member_id: memberId,
            shift_id: shiftId
          }))
        );
        await schedulesQuery.refetch();
      } catch {
        setAssignments((current) =>
          current.filter(
            (assignment) =>
              !optimisticKeys.has(
                `${assignmentCellKey(
                  assignment.employeeId,
                  assignment.date
                )}:${assignment.shiftId}`
              )
          )
        );
      }
    },
    [
      assignmentsByCell,
      bulkSaveLabourSchedules,
      memberIdByRosterId,
      schedulesQuery,
      shiftMap
    ]
  );

  const removeAssignments = useCallback(
    async (targets: Pick<Assignment, "date" | "employeeId" | "shiftId">[]) => {
      const targetKeys = new Set(
        targets.map(
          (target) =>
            `${assignmentCellKey(
              target.employeeId,
              target.date
            )}:${target.shiftId}`
        )
      );
      const matchesAssignment = (assignment: Assignment) =>
        targetKeys.has(
          `${assignmentCellKey(
            assignment.employeeId,
            assignment.date
          )}:${assignment.shiftId}`
        );
      const removedAssignments = assignments.filter(matchesAssignment);
      const draftAssignmentsToRemove = removedAssignments.filter(
        (assignment) => assignment.isDraft
      );
      const savedAssignmentsToRemove = removedAssignments.filter(
        (assignment) => !assignment.isDraft
      );
      if (draftAssignmentsToRemove.length) {
        setAssignments((current) =>
          current.filter(
            (assignment) =>
              !(assignment.isDraft && matchesAssignment(assignment))
          )
        );
      }
      if (!savedAssignmentsToRemove.length) return;

      const apiTargetKeys = new Set(
        targets.flatMap((target) => {
          const memberId = memberIdByRosterId.get(target.employeeId);
          return memberId
            ? [`${memberId}:${target.date}:${target.shiftId}`]
            : [];
        })
      );
      const scheduleIds = [
        ...new Set([
          ...savedAssignmentsToRemove
            .map((assignment) => assignment.scheduleId)
            .filter((id): id is string => Boolean(id)),
          ...(schedulesQuery.data ?? [])
            .filter((schedule) =>
              apiTargetKeys.has(
                `${schedule.member_id}:${schedule.date}:${schedule.shift_id}`
              )
            )
            .map((schedule) => schedule.id)
            .filter(Boolean)
        ])
      ];

      if (!scheduleIds.length) {
        toast.error("Unable to delete shift", {
          description: "The schedule ID has not been loaded yet."
        });
        return;
      }

      setAssignments((current) =>
        current.filter(
          (assignment) => assignment.isDraft || !matchesAssignment(assignment)
        )
      );

      try {
        await bulkDeleteLabourSchedules.mutateAsync(scheduleIds);
        await schedulesQuery.refetch();
      } catch {
        setAssignments((current) => {
          const keys = new Set(
            current.map(
              (assignment) =>
                `${assignmentCellKey(
                  assignment.employeeId,
                  assignment.date
                )}:${assignment.shiftId}`
            )
          );
          return [
            ...current,
            ...removedAssignments.filter(
              (assignment) =>
                !assignment.isDraft &&
                !keys.has(
                  `${assignmentCellKey(
                    assignment.employeeId,
                    assignment.date
                  )}:${assignment.shiftId}`
                )
            )
          ];
        });
      }
    },
    [assignments, bulkDeleteLabourSchedules, memberIdByRosterId, schedulesQuery]
  );
  const removeAssignment = useCallback(
    (employeeId: string, date: string, shiftId: string) =>
      removeAssignments([{ date, employeeId, shiftId }]),
    [removeAssignments]
  );

  const selectEmployee = useCallback(
    (employeeId: string, selected: boolean) => {
      setSelectedEmployeeIds((current) => {
        const next = new Set(current);
        if (selected) next.add(employeeId);
        else next.delete(employeeId);
        return next;
      });
    },
    []
  );

  const selectAllVisibleEmployees = useCallback(
    (selected: boolean) => {
      setSelectedEmployeeIds((current) => {
        const next = new Set(current);
        rosterEmployees.forEach((employee) => {
          if (selected) next.add(employee.id);
          else next.delete(employee.id);
        });
        return next;
      });
    },
    [rosterEmployees]
  );

  const selectedMembers = useMemo(
    () =>
      members.filter((member) =>
        selectedEmployeeIds.has(member.labour_id || roleMemberRowId(member.id))
      ),
    [members, selectedEmployeeIds]
  );

  const aiScheduleRoles = useMemo<AiScheduleRoleOption[]>(() => {
    const memberCountByRoleId = new Map<string, number>();
    allRosterEmployees.forEach((employee) => {
      const roleName =
        formatDisplayValue(employee.role_name, "") || "Unassigned Role";
      const roleId = employee.role_id || `role:${roleName.toLowerCase()}`;
      memberCountByRoleId.set(
        roleId,
        (memberCountByRoleId.get(roleId) ?? 0) + 1
      );
    });

    const fallbackNameToId = new Map<string, string>();
    allRosterEmployees.forEach((employee) => {
      const roleName =
        formatDisplayValue(employee.role_name, "") || "Unassigned Role";
      fallbackNameToId.set(
        roleName.toLowerCase(),
        employee.role_id || `role:${roleName.toLowerCase()}`
      );
    });

    return roles.map((role): AiScheduleRoleOption => {
      const id = fallbackNameToId.get(role.name.toLowerCase()) ?? `${role.id}`;
      const code =
        role.name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .map((word) => word[0])
          .join("")
          .toUpperCase() || "UR";
      return {
        code,
        id,
        memberCount: memberCountByRoleId.get(id) ?? 0,
        name: role.name
      };
    });
  }, [allRosterEmployees, roles]);

  const deleteSelected = useCallback(async () => {
    if (!selectedMembers.length || bulkDeleteMembers.isPending) return;

    const memberIds = [...new Set(selectedMembers.map((member) => member.id))];
    const rosterIds = new Set(
      selectedMembers.map(
        (member) => member.labour_id || roleMemberRowId(member.id)
      )
    );
    const roleIds = new Set(
      selectedMembers
        .filter((member) => !member.labour_id)
        .map((member) => member.member_role_id || member.role_in_project)
        .filter(Boolean)
    );

    try {
      await bulkDeleteMembers.mutateAsync({
        ids: memberIds,
        projectId: project.id
      });
      setRosterEmployeeIds((current) =>
        current.filter((id) => !rosterIds.has(id))
      );
      setVisibleRoleMemberIds((current) =>
        current.filter((id) => !rosterIds.has(id))
      );
      setAssignedRoleIds((current) => current.filter((id) => !roleIds.has(id)));
      setAssignments((current) =>
        current.filter((assignment) => !rosterIds.has(assignment.employeeId))
      );
      setSelectedEmployeeIds((current) => {
        const next = new Set(current);
        rosterIds.forEach((id) => next.delete(id));
        return next;
      });
    } catch {
      // The shared mutation handler displays the API error and keeps the
      // selected members visible so the user can retry.
    }
  }, [bulkDeleteMembers, project.id, selectedMembers]);

  const generateSchedule = useCallback(
    (request: AiScheduleRequest) => {
      generatePreview.mutate(
        {
          end_date: request.endDate,
          project_id: request.projectId,
          roles: request.roles.map((role) => ({
            role_id: role.roleId,
            total_employee: role.totalEmployee
          })),
          rules: {
            cost_efficiency: request.rules.costEfficiency,
            employee_availability: request.rules.employeeAvailability,
            location_preference: request.rules.locationPreference,
            workload_overtime_balance: request.rules.workloadOvertimeBalance
          },
          start_date: request.startDate
        },
        {
          onSuccess: (response) => {
            setAiScheduleDialogOpen(false);
            setDraftPreviewItems(response.suggestions);
            setAiReviewDialogOpen(true);
          }
        }
      );
    },
    [generatePreview]
  );

  const applyReviewSuggestions = useCallback(
    async (
      selected: LabourSchedulePreviewSuggestion[],
      options?: { startDate?: string; endDate?: string }
    ) => {
      if (!selected.length) return;
      const employeeIds = Array.from(
        new Set(
          selected.map((suggestion) => suggestion.employee_id).filter(Boolean)
        )
      );
      if (!employeeIds.length) return;

      const isUuid = (value: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          value
        );

      const firstShiftByEmployee = new Map<string, string>();
      [...selected]
        .sort((left, right) =>
          (
            left.dates?.[0] ??
            left.date ??
            left.start_date ??
            left.from_date ??
            ""
          ).localeCompare(
            right.dates?.[0] ??
              right.date ??
              right.start_date ??
              right.from_date ??
              ""
          )
        )
        .forEach((suggestion) => {
          if (!suggestion.shift_id || !isUuid(suggestion.shift_id)) return;
          if (firstShiftByEmployee.has(suggestion.employee_id)) return;
          firstShiftByEmployee.set(suggestion.employee_id, suggestion.shift_id);
        });

      try {
        const draftItems = selected.flatMap((suggestion) => {
          const shift_id = firstShiftByEmployee.get(suggestion.employee_id);
          if (!shift_id) return [];
          const rangeDates = expandIsoDateRange(
            suggestion.start_date ?? suggestion.from_date,
            suggestion.end_date ?? suggestion.to_date
          );
          const dates = rangeDates.length
            ? rangeDates
            : suggestion.dates?.length
              ? suggestion.dates
              : [
                  suggestion.date ??
                    suggestion.start_date ??
                    suggestion.from_date ??
                    ""
                ];

          return Array.from(new Set(dates)).flatMap((date) => {
            if (!date) return [];
            if (options?.startDate && date < options.startDate) return [];
            if (options?.endDate && date > options.endDate) return [];
            return [{ date, employee_id: suggestion.employee_id, shift_id }];
          });
        });

        const response = await draftLabourSchedules.mutateAsync({
          items: draftItems,
          project_id: project.id
        });
        const items = response.items ?? [];
        setDraftPreviewItems(selected);

        setAssignments((current) => {
          const savedAssignments = current.filter(
            (assignment) => !assignment.isDraft
          );
          const occupiedCells = new Set(
            savedAssignments.map((assignment) =>
              assignmentCellKey(assignment.employeeId, assignment.date)
            )
          );
          const nextDrafts: Assignment[] = [];
          items.forEach((item) => {
            if (!item.date) return;
            const draftId = `draft:${item.employee_id}`;
            const cellKey = assignmentCellKey(draftId, item.date);
            if (occupiedCells.has(cellKey)) return;
            occupiedCells.add(cellKey);
            nextDrafts.push({
              date: item.date,
              employeeId: draftId,
              isDraft: true,
              shiftId: item.shift_id
            });
          });
          return [...savedAssignments, ...nextDrafts];
        });
        setAiReviewDialogOpen(false);
      } catch {
        // Toast error already handled by mutation meta.
      }
    },
    [draftLabourSchedules, project.id]
  );

  const reopenAiScheduleDialog = useCallback(() => {
    setAiReviewDialogOpen(false);
    setAiScheduleDialogOpen(true);
  }, []);

  const cancelDraftSchedule = useCallback(() => {
    setAssignments((current) =>
      current.filter((assignment) => !assignment.isDraft)
    );
    setDraftPreviewItems([]);
  }, []);

  const assignDraftSchedule = useCallback(async () => {
    if (!draftAssignments.length || bulkSaveLabourSchedules.isPending) return;

    const labourIds = Array.from(
      new Set(
        draftAssignments
          .map((assignment) => assignment.employeeId.replace(/^draft:/, ""))
          .filter(Boolean)
      )
    );

    const labourToMemberId = new Map<string, string>();

    if (labourIds.length) {
      const datesByLabourId = new Map<
        string,
        { end?: string; start?: string }
      >();
      draftAssignments.forEach((assignment) => {
        const labourId = assignment.employeeId.replace(/^draft:/, "");
        if (!labourIds.includes(labourId)) return;
        const range = datesByLabourId.get(labourId) ?? {};
        if (!range.start || assignment.date < range.start) {
          range.start = assignment.date;
        }
        if (!range.end || assignment.date > range.end) {
          range.end = assignment.date;
        }
        datesByLabourId.set(labourId, range);
      });

      const roleByLabourId = new Map<string, string>();
      draftPreviewItems.forEach((item) => {
        if (!labourIds.includes(item.employee_id)) return;
        if (!item.role_id) return;
        if (roleByLabourId.has(item.employee_id)) return;
        roleByLabourId.set(item.employee_id, item.role_id);
      });

      const payloads: LabourMemberPayload[] = labourIds.map((labourId) => ({
        end_date: datesByLabourId.get(labourId)?.end,
        labour_id: labourId,
        project_id: project.id,
        role_in_project: roleByLabourId.get(labourId) ?? "",
        start_date: datesByLabourId.get(labourId)?.start
      }));

      try {
        const response = await addProjectMembers.mutateAsync(payloads);
        (response as unknown[]).forEach((item) => {
          if (!item || typeof item !== "object") return;
          const record = item as Record<string, unknown>;
          const memberId = String(
            record.id ?? record.member_id ?? record._id ?? ""
          );
          const labourId = String(record.labour_id ?? record.labourId ?? "");
          if (memberId && labourId) {
            labourToMemberId.set(labourId, memberId);
          }
        });
        await queryClient.invalidateQueries({
          queryKey: ["construction-labour-members", project.id]
        });
        await queryClient.invalidateQueries({
          queryKey: ["construction-labour-roster-members", project.id]
        });
      } catch {
        return;
      }
    }

    const savableDrafts = draftAssignments.flatMap((assignment) => {
      const labourId = assignment.employeeId.replace(/^draft:/, "");
      const memberId =
        labourToMemberId.get(labourId) ??
        memberIdByRosterId.get(assignment.employeeId);
      return memberId ? [{ assignment, memberId }] : [];
    });
    if (savableDrafts.length !== draftAssignments.length) {
      toast.error("Unable to assign draft schedule", {
        description:
          "One or more selected employees do not have a roster member ID."
      });
      return;
    }

    try {
      await bulkSaveLabourSchedules.mutateAsync(
        savableDrafts.map(({ assignment, memberId }) => ({
          date: assignment.date,
          member_id: memberId,
          shift_id: assignment.shiftId
        }))
      );
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.isDraft
            ? { ...assignment, isDraft: undefined }
            : assignment
        )
      );
      setDraftPreviewItems([]);
      await schedulesQuery.refetch();
    } catch {
      // Keep the generated shifts as drafts so the user can retry.
    }
  }, [
    addProjectMembers,
    bulkSaveLabourSchedules,
    draftAssignments,
    draftPreviewItems,
    memberIdByRosterId,
    project.id,
    queryClient,
    schedulesQuery
  ]);

  const exportSchedule = useCallback(() => {
    const rows = assignments.map((assignment) => {
      const employee = employeeMap.get(assignment.employeeId);
      const shift = shiftMap.get(assignment.shiftId)?.shift;
      return [
        employee?.code ?? "",
        employee?.full_name ?? "",
        employee?.role_name ?? "",
        assignment.date,
        shift?.name ?? "",
        shift?.start_time ?? "",
        shift?.end_time ?? ""
      ];
    });
    const csv = [
      ["Employee Code", "Employee", "Role", "Date", "Shift", "Start", "End"],
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
    link.download = `${project.code || "project"}-rostering.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [assignments, employeeMap, project.code, shiftMap]);

  return (
    <div className="space-y-4 pb-8">
      <RosteringHeader project={project} />

      <ShiftPalette shifts={shifts} />

      <RosteringActions
        canDelete={selectedMembers.length > 0 && !bulkDeleteMembers.isPending}
        onAddGroup={() => setAddGroupDialogOpen(true)}
        onAssignEmployee={() => {
          setAssignEmployeeGroup(null);
          setAssignDialogOpen(true);
        }}
        onAssignRole={() => setAssignRoleDialogOpen(true)}
        onDelete={deleteSelected}
        onExport={exportSchedule}
      />

      <RosteringCalendarControls
        employeeSearch={employeeSearch}
        onEmployeeSearchChange={setEmployeeSearch}
        onGenerate={() => setAiScheduleDialogOpen(true)}
        onMovePeriod={(amount) =>
          setAnchorDate((date) => movePeriod(date, period, amount))
        }
        onPeriodChange={setPeriod}
        period={period}
        periodLabel={periodLabel}
      />

      {draftAssignments.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary-300 bg-primary-50/50 px-4 py-3 text-primary-700">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-100">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">
              {draftRecommendedEmployeeCount} recommended employee
              {draftRecommendedEmployeeCount === 1 ? "" : "s"}
            </p>
            <p className="text-[10px] text-slate-500">
              Review the draft recommendations, then assign them to save the
              schedule.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkSaveLabourSchedules.isPending}
            onClick={cancelDraftSchedule}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={bulkSaveLabourSchedules.isPending}
            onClick={assignDraftSchedule}
            className="bg-neutral-900 hover:bg-neutral-800"
          >
            {bulkSaveLabourSchedules.isPending && (
              <LoaderCircle className="animate-spin" />
            )}
            Assign
          </Button>
        </div>
      )}

      <RosterCalendar
        assignmentsByCell={assignmentsByCell}
        days={days}
        groups={calendarGroups}
        memberDateRangeByRosterId={memberDateRangeByRosterId}
        memberRoleNameByRosterId={memberRoleNameByRosterId}
        onAssignGroupEmployee={(group) => {
          setAssignEmployeeGroup(group);
          setAssignDialogOpen(true);
        }}
        onAssignMemberEmployee={(rosterId) => {
          const member = memberByRosterId.get(rosterId);
          if (!member) {
            toast.error("Unable to assign employee", {
              description: "The selected roster member could not be resolved."
            });
            return;
          }
          setAssigningMemberEmployee(member);
        }}
        onChangeMemberDate={(rosterId) => {
          const member = memberByRosterId.get(rosterId);
          if (!member) {
            toast.error("Unable to change member date", {
              description: "The selected roster member could not be resolved."
            });
            return;
          }
          setChangingMemberDate({
            endDate: member.end_date,
            groupId: member.group_id || undefined,
            id: member.id,
            name: member.labour_name || member.member_role_name || "Member",
            startDate: member.start_date
          });
        }}
        onDeleteGroup={setDeletingGroup}
        onDeleteMember={(rosterId) => {
          const member = memberByRosterId.get(rosterId);
          if (!member) {
            toast.error("Unable to delete member", {
              description: "The selected roster member could not be resolved."
            });
            return;
          }
          setDeletingMember(member);
        }}
        onDropShift={dropShift}
        onEditGroup={setEditingGroup}
        onGroupOrderChange={updateGroupOrder}
        onMemberOrderChange={updateMemberOrder}
        onRemoveAssignment={removeAssignment}
        onRemoveAssignments={removeAssignments}
        onSelectAll={selectAllVisibleEmployees}
        onSelectEmployee={selectEmployee}
        selectedEmployeeIds={selectedEmployeeIds}
        shiftMap={shiftMap}
      />

      <AiScheduleDialog
        endDate={days[days.length - 1]?.date ?? ""}
        isGenerating={generatePreview.isPending}
        onGenerate={generateSchedule}
        onOpenChange={setAiScheduleDialogOpen}
        open={aiScheduleDialogOpen}
        projectId={project.id}
        projectLabel={`${project.code} - ${formatDisplayValue(project.title)}`}
        roles={aiScheduleRoles}
        startDate={days[0]?.date ?? ""}
      />

      <AiScheduleReviewDialog
        employeeMap={employeeMap}
        isAssigning={generatePreview.isPending}
        memberByRosterId={memberByRosterId}
        onAdjustPreferences={reopenAiScheduleDialog}
        onAssign={applyReviewSuggestions}
        onOpenChange={setAiReviewDialogOpen}
        open={aiReviewDialogOpen}
        rosterIdByMemberId={rosterIdByMemberId}
        shiftMap={shiftMap}
        suggestions={draftPreviewItems}
      />

      <AssignEmployeeDialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setAssignEmployeeGroup(null);
        }}
        project={project}
        employees={employees}
        groupId={assignEmployeeGroup?.id}
        groupName={assignEmployeeGroup?.name}
        assignedEmployeeIds={rosterEmployeeIds}
        onAssigned={(employeeIds) =>
          setRosterEmployeeIds((current) => [
            ...new Set([...current, ...employeeIds])
          ])
        }
      />

      <AddGroupDialog
        open={addGroupDialogOpen}
        onOpenChange={setAddGroupDialogOpen}
        projectId={project.id}
        onCreated={(group) =>
          setCustomGroups((current) => [
            ...current,
            {
              group_id: group.id ?? "",
              group_name: group.name
            }
          ])
        }
      />

      <AssignRoleDialog
        open={assignRoleDialogOpen}
        onOpenChange={setAssignRoleDialogOpen}
        project={project}
        assignedRoleIds={assignedRoleIds}
        onAssigned={(roles) => {
          setAssignedRoleIds((current) => [
            ...new Set([...current, ...roles.map((role) => role.id)])
          ]);
        }}
      />

      <AssignMemberEmployeeDialog
        assignedEmployeeIds={rosterEmployeeIds}
        employees={employees}
        member={assigningMemberEmployee}
        open={assigningMemberEmployee !== null}
        onOpenChange={(open) => {
          if (!open) setAssigningMemberEmployee(null);
        }}
        onAssigned={(employeeId) => {
          if (!assigningMemberEmployee) return;
          const previousRosterId =
            assigningMemberEmployee.labour_id ||
            roleMemberRowId(assigningMemberEmployee.id);
          setRosterEmployeeIds((current) => [
            ...new Set([
              ...current.filter((id) => id !== previousRosterId),
              employeeId
            ])
          ]);
          setVisibleRoleMemberIds((current) =>
            current.filter((id) => id !== previousRosterId)
          );
        }}
        projectId={project.id}
      />

      <EditGroupDialog
        group={editingGroup}
        open={editingGroup !== null}
        onOpenChange={(open) => {
          if (!open) setEditingGroup(null);
        }}
        projectId={project.id}
        onUpdated={(group) =>
          setCustomGroups((current) =>
            current.map((item) =>
              item.group_id === group.id
                ? { ...item, group_name: group.name }
                : item
            )
          )
        }
      />

      <ChangeMemberDateDialog
        member={changingMemberDate}
        open={changingMemberDate !== null}
        onOpenChange={(open) => {
          if (!open) setChangingMemberDate(null);
        }}
        projectId={project.id}
      />

      <ConfirmationModal
        open={deletingMember !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingMember(null);
        }}
        title="Delete member?"
        description={`Are you sure you want to delete ${formatDisplayValue(deletingMember?.labour_name || deletingMember?.member_role_name, "this member")}? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={bulkDeleteMembers.isPending}
        onConfirm={async () => {
          if (!deletingMember) return;
          const member = deletingMember;
          const rosterId = member.labour_id || roleMemberRowId(member.id);
          const roleId = member.member_role_id || member.role_in_project;
          try {
            await bulkDeleteMembers.mutateAsync({
              ids: [member.id],
              projectId: project.id
            });
            setRosterEmployeeIds((current) =>
              current.filter((id) => id !== rosterId)
            );
            setVisibleRoleMemberIds((current) =>
              current.filter((id) => id !== rosterId)
            );
            if (!member.labour_id && roleId) {
              setAssignedRoleIds((current) =>
                current.filter((id) => id !== roleId)
              );
            }
            setAssignments((current) =>
              current.filter((assignment) => assignment.employeeId !== rosterId)
            );
            setSelectedEmployeeIds((current) => {
              const next = new Set(current);
              next.delete(rosterId);
              return next;
            });
            setDeletingMember(null);
          } catch {
            // The shared mutation handler displays the API error.
          }
        }}
      />

      <ConfirmationModal
        open={deletingGroup !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingGroup(null);
        }}
        title="Delete group?"
        description={`Are you sure you want to delete ${formatDisplayValue(deletingGroup?.name, "this group")}? This action cannot be undone.`}
        confirmLabel="Delete Group"
        isLoading={deleteLabourGroup.isPending}
        onConfirm={async () => {
          if (!deletingGroup) return;
          const groupId = deletingGroup.id;
          try {
            await deleteLabourGroup.mutateAsync({
              id: groupId,
              projectId: project.id
            });
            setCustomGroups((current) =>
              current.filter((group) => group.group_id !== groupId)
            );
            setDeletingGroup(null);
          } catch {
            // The shared mutation handler displays the API error.
          }
        }}
      />
    </div>
  );
}

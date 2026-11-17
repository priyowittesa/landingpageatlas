"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  GripVertical,
  Pencil,
  Trash2,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type UIEvent,
} from "react";

import { cn } from "@/lib/utils";
import { formatDisplayValue } from "@/lib/format-display-value";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Employee } from "@/types/type-employee";
import { EmployeeDetailsPopover } from "./employee-details-popover";
import { RosterCellDialog } from "./roster-cell-dialog";
import { SHIFT_COLORS } from "./shift-palette";
import {
  assignmentCellKey,
  type Assignment,
  type ScheduleDay,
  type ShiftMap,
} from "./rostering-types";

const EMPLOYEE_COLUMN_WIDTH = 240;
const DAY_COLUMN_MIN_WIDTH = 96;
const EMPLOYEE_ROW_HEIGHT = 112;
const GROUP_ROW_HEIGHT = 44;
const HEADER_HEIGHT = 58;
const OVERSCAN_PX = EMPLOYEE_ROW_HEIGHT * 5;
const MAX_VISIBLE_SHIFTS = 2;

function normalizeRosterDate(value?: string) {
  if (!value) return "";
  const isoDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];

  const slashDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    return `${slashDate[3]}-${slashDate[1].padStart(2, "0")}-${slashDate[2].padStart(2, "0")}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

type CalendarRow =
  | {
      employee: Employee;
      groupId: string;
      groupKey: string;
      key: string;
      size: typeof EMPLOYEE_ROW_HEIGHT;
      type: "employee";
    }
  | {
      employeeCount: number;
      groupId: string;
      groupKey: string;
      isCustom: boolean;
      key: string;
      label: string;
      size: typeof GROUP_ROW_HEIGHT;
      type: "group";
    };

type CalendarGroup = {
  employees: Employee[];
  id: string;
  isCustom: boolean;
  key: string;
  label: string;
};

export type RosterCalendarGroup = {
  employees: Employee[];
  id: string;
  isCustom: boolean;
  name: string;
};

export type MemberOrderChange = {
  items: {
    position: number;
    rosterId: string;
  }[];
  rosterId: string;
  targetGroupId: string;
};

type RosterCalendarProps = {
  assignmentsByCell: Map<string, Assignment[]>;
  days: ScheduleDay[];
  groups: RosterCalendarGroup[];
  memberDateRangeByRosterId: Map<
    string,
    { endDate: string; startDate: string }
  >;
  memberRoleNameByRosterId: Map<string, string>;
  onAssignGroupEmployee: (group: { id: string; name: string }) => void;
  onAssignMemberEmployee: (rosterId: string) => void;
  onChangeMemberDate: (rosterId: string) => void;
  onDeleteMember: (rosterId: string) => void;
  onDeleteGroup: (group: { id: string; name: string }) => void;
  onDropShift: (
    shiftId: string,
    targets: { date: string; employeeId: string }[],
  ) => void | Promise<void>;
  onEditGroup: (group: { id: string; name: string }) => void;
  onGroupOrderChange: (groupIds: string[]) => void | Promise<void>;
  onMemberOrderChange: (
    change: MemberOrderChange,
  ) => void | Promise<void>;
  onRemoveAssignment: (
    employeeId: string,
    date: string,
    shiftId: string,
  ) => void;
  onRemoveAssignments: (
    assignments: Pick<
      Assignment,
      "date" | "employeeId" | "shiftId"
    >[],
  ) => void;
  onSelectAll: (selected: boolean) => void;
  onSelectEmployee: (employeeId: string, selected: boolean) => void;
  selectedEmployeeIds: Set<string>;
  shiftMap: ShiftMap;
};

function flattenRows(
  groups: CalendarGroup[],
  collapsedGroupKeys: Set<string>,
) {
  const rows: CalendarRow[] = [];

  groups.forEach((group) => {
    rows.push({
      employeeCount: group.employees.length,
      groupId: group.id,
      groupKey: group.key,
      isCustom: group.isCustom,
      key: group.key,
      label: group.label,
      size: GROUP_ROW_HEIGHT,
      type: "group",
    });
    if (collapsedGroupKeys.has(group.key)) return;

    group.employees.forEach((employee) => {
      rows.push({
        employee,
        groupId: group.id,
        groupKey: group.key,
        key: `employee:${employee.id}`,
        size: EMPLOYEE_ROW_HEIGHT,
        type: "employee",
      });
    });
  });

  return rows;
}

function findFirstVisibleRow(offsets: number[], minimumOffset: number) {
  let low = 0;
  let high = offsets.length - 1;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (offsets[middle + 1] < minimumOffset) low = middle + 1;
    else high = middle;
  }

  return low;
}

function findLastVisibleRow(offsets: number[], maximumOffset: number) {
  let low = 0;
  let high = offsets.length - 1;

  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (offsets[middle] <= maximumOffset) low = middle;
    else high = middle - 1;
  }

  return Math.min(offsets.length - 1, low + 1);
}

export function RosterCalendar({
  assignmentsByCell,
  days,
  groups,
  memberDateRangeByRosterId,
  memberRoleNameByRosterId,
  onAssignGroupEmployee,
  onAssignMemberEmployee,
  onChangeMemberDate,
  onDeleteMember,
  onDeleteGroup,
  onDropShift,
  onEditGroup,
  onGroupOrderChange,
  onMemberOrderChange,
  onRemoveAssignment,
  onRemoveAssignments,
  onSelectAll,
  onSelectEmployee,
  selectedEmployeeIds,
  shiftMap,
}: RosterCalendarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const latestScrollTopRef = useRef(0);
  const selectionAnchorRef = useRef<{
    date: string;
    employeeId: string;
  } | null>(null);
  const selectionDraggingRef = useRef(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);
  const [selectedCell, setSelectedCell] = useState<{
    date: string;
    employee: Employee;
  } | null>(null);
  const [selectedCellKeys, setSelectedCellKeys] = useState(
    () => new Set<string>(),
  );
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  const [memberOrder, setMemberOrder] = useState<string[]>([]);
  const [memberGroupOverrides, setMemberGroupOverrides] = useState(
    () => new Map<string, string>(),
  );
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState(
    () => new Set<string>(),
  );
  const todayDate = useMemo(() => localDateKey(), []);

  const calendarGroups = useMemo<CalendarGroup[]>(
    () => {
      const result = groups.map((group) => ({
        employees: group.employees,
        id: group.id,
        isCustom: group.isCustom,
        key: group.id
          ? `group:${group.id}`
          : `group-name:${group.name}`,
        label: group.name,
      }));
      const groupByKey = new Map(
        result.map((group) => [
          group.key,
          { ...group, employees: [] as Employee[] },
        ]),
      );

      result.forEach((group) => {
        group.employees.forEach((employee) => {
          const targetKey = memberGroupOverrides.get(employee.id);
          const targetGroup = targetKey
            ? groupByKey.get(targetKey)
            : undefined;
          (targetGroup ?? groupByKey.get(group.key))?.employees.push(
            employee,
          );
        });
      });

      const orderIndex = new Map(
        memberOrder.map((employeeId, index) => [employeeId, index]),
      );
      groupByKey.forEach((group) => {
        group.employees.sort((left, right) => {
          const leftIndex = orderIndex.get(left.id);
          const rightIndex = orderIndex.get(right.id);
          if (leftIndex === undefined && rightIndex === undefined) return 0;
          if (leftIndex === undefined) return 1;
          if (rightIndex === undefined) return -1;
          return leftIndex - rightIndex;
        });
      });

      return [...groupByKey.values()];
    },
    [groups, memberGroupOverrides, memberOrder],
  );
  const orderedGroups = useMemo(() => {
    const groupMap = new Map(
      calendarGroups.map((group) => [group.key, group]),
    );
    const ordered = groupOrder.flatMap((key) => {
      const group = groupMap.get(key);
      if (!group) return [];
      groupMap.delete(key);
      return [group];
    });
    return [...ordered, ...groupMap.values()];
  }, [calendarGroups, groupOrder]);
  const rows = useMemo(
    () => flattenRows(orderedGroups, collapsedGroupKeys),
    [collapsedGroupKeys, orderedGroups],
  );
  const offsets = useMemo(() => {
    const result = [0];
    rows.forEach((row) => result.push(result[result.length - 1] + row.size));
    return result;
  }, [rows]);

  const totalHeight = offsets[offsets.length - 1] ?? 0;
  const minimumOffset = Math.max(
    0,
    scrollTop - HEADER_HEIGHT - OVERSCAN_PX,
  );
  const maximumOffset = Math.min(
    totalHeight,
    scrollTop + viewportHeight + OVERSCAN_PX,
  );
  const startIndex = rows.length
    ? findFirstVisibleRow(offsets, minimumOffset)
    : 0;
  const endIndex = rows.length
    ? findLastVisibleRow(offsets, maximumOffset)
    : 0;
  const visibleRows = rows.slice(startIndex, endIndex);
  const topSpacerHeight = offsets[startIndex] ?? 0;
  const bottomSpacerHeight = totalHeight - (offsets[endIndex] ?? totalHeight);
  const calendarMinWidth =
    EMPLOYEE_COLUMN_WIDTH + days.length * DAY_COLUMN_MIN_WIDTH;

  const employeeCount = useMemo(
    () =>
      groups.reduce(
        (total, group) => total + group.employees.length,
        0,
      ),
    [groups],
  );
  const visibleEmployeeIds = useMemo(
    () =>
      groups.flatMap((group) =>
        group.employees.map((employee) => employee.id),
      ),
    [groups],
  );
  const isCellSelectable = useCallback(
    (employeeId: string, date: string) => {
      const memberDateRange = memberDateRangeByRosterId.get(employeeId);
      const startDate = normalizeRosterDate(memberDateRange?.startDate);
      const endDate = normalizeRosterDate(memberDateRange?.endDate);

      return Boolean(
        startDate &&
          endDate &&
          date >= startDate &&
          date <= endDate,
      );
    },
    [memberDateRangeByRosterId],
  );
  const selectedTargets = useMemo(
    () =>
      visibleEmployeeIds.flatMap((employeeId) =>
        days.flatMap((day) =>
          isCellSelectable(employeeId, day.date) &&
          selectedCellKeys.has(assignmentCellKey(employeeId, day.date))
            ? [{ date: day.date, employeeId }]
            : [],
        ),
      ),
    [days, isCellSelectable, selectedCellKeys, visibleEmployeeIds],
  );
  const selectedAssignments = useMemo(
    () =>
      selectedTargets.flatMap(
        ({ date, employeeId }) =>
          assignmentsByCell.get(
            assignmentCellKey(employeeId, date),
          ) ?? [],
      ),
    [assignmentsByCell, selectedTargets],
  );
  const selectedVisibleCount = useMemo(
    () =>
      groups.reduce(
        (total, group) =>
          total +
          group.employees.filter((employee) =>
            selectedEmployeeIds.has(employee.id),
          ).length,
        0,
      ),
    [groups, selectedEmployeeIds],
  );
  const allSelected =
    employeeCount > 0 && selectedVisibleCount === employeeCount;
  const partiallySelected =
    selectedVisibleCount > 0 && selectedVisibleCount < employeeCount;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateHeight = () => setViewportHeight(container.clientHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const validCellKeys = new Set(
      visibleEmployeeIds.flatMap((employeeId) =>
        days.flatMap((day) =>
          isCellSelectable(employeeId, day.date)
            ? [assignmentCellKey(employeeId, day.date)]
            : [],
        ),
      ),
    );
    setSelectedCellKeys((current) => {
      const next = new Set(
        [...current].filter((key) => validCellKeys.has(key)),
      );
      return next.size === current.size ? current : next;
    });
  }, [days, isCellSelectable, visibleEmployeeIds]);

  useEffect(() => {
    const stopSelecting = () => {
      selectionDraggingRef.current = false;
      selectionAnchorRef.current = null;
    };
    window.addEventListener("pointerup", stopSelecting);
    window.addEventListener("pointercancel", stopSelecting);
    return () => {
      window.removeEventListener("pointerup", stopSelecting);
      window.removeEventListener("pointercancel", stopSelecting);
    };
  }, []);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    latestScrollTopRef.current = event.currentTarget.scrollTop;
    if (animationFrameRef.current !== null) return;

    animationFrameRef.current = requestAnimationFrame(() => {
      setScrollTop(latestScrollTopRef.current);
      animationFrameRef.current = null;
    });
  }, []);

  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroupKeys((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  const saveGroupOrder = useCallback(
    async (nextKeys: string[], previousKeys: string[]) => {
      setGroupOrder(nextKeys);
      const groupByKey = new Map(
        calendarGroups.map((group) => [group.key, group]),
      );
      const groupIds = nextKeys.flatMap((key) => {
        const groupId = groupByKey.get(key)?.id;
        return groupId ? [groupId] : [];
      });

      try {
        await onGroupOrderChange(groupIds);
      } catch {
        setGroupOrder(previousKeys);
      }
    },
    [calendarGroups, onGroupOrderChange],
  );

  const reorderGroup = useCallback(
    (sourceKey: string, targetKey: string) => {
      if (sourceKey === targetKey) return;
      const keys = orderedGroups.map((group) => group.key);
      const previousKeys = [...keys];
      const sourceIndex = keys.indexOf(sourceKey);
      const targetIndex = keys.indexOf(targetKey);
      if (sourceIndex < 0 || targetIndex < 0) return;

      keys.splice(sourceIndex, 1);
      keys.splice(targetIndex, 0, sourceKey);
      void saveGroupOrder(keys, previousKeys);
    },
    [orderedGroups, saveGroupOrder],
  );

  const moveGroup = useCallback(
    (groupKey: string, direction: -1 | 1) => {
      const keys = orderedGroups.map((group) => group.key);
      const previousKeys = [...keys];
      const currentIndex = keys.indexOf(groupKey);
      const targetIndex = currentIndex + direction;
      if (
        currentIndex < 0 ||
        targetIndex < 0 ||
        targetIndex >= keys.length
      ) {
        return;
      }
      [keys[currentIndex], keys[targetIndex]] = [
        keys[targetIndex],
        keys[currentIndex],
      ];
      void saveGroupOrder(keys, previousKeys);
    },
    [orderedGroups, saveGroupOrder],
  );

  const moveMember = useCallback(
    async (
      rosterId: string,
      targetGroupKey: string,
      targetRosterId?: string,
    ) => {
      if (rosterId === targetRosterId) return;
      const layout = orderedGroups.map((group) => ({
        ...group,
        employees: [...group.employees],
      }));
      const sourceGroup = layout.find((group) =>
        group.employees.some((employee) => employee.id === rosterId),
      );
      const targetGroup = layout.find(
        (group) => group.key === targetGroupKey,
      );
      if (!sourceGroup || !targetGroup) return;

      const previousOrder = orderedGroups.flatMap((group) =>
        group.employees.map((employee) => employee.id),
      );
      const previousOverrides = new Map(memberGroupOverrides);
      const sourceIndex = sourceGroup.employees.findIndex(
        (employee) => employee.id === rosterId,
      );
      const [employee] = sourceGroup.employees.splice(sourceIndex, 1);
      if (!employee) return;

      const targetIndex = targetRosterId
        ? targetGroup.employees.findIndex(
            (target) => target.id === targetRosterId,
          )
        : targetGroup.employees.length;
      targetGroup.employees.splice(
        targetIndex < 0 ? targetGroup.employees.length : targetIndex,
        0,
        employee,
      );
      const nextOrder = layout.flatMap((group) =>
        group.employees.map((item) => item.id),
      );
      const groupChanged = sourceGroup.key !== targetGroup.key;
      if (
        !groupChanged &&
        nextOrder.length === previousOrder.length &&
        nextOrder.every((id, index) => id === previousOrder[index])
      ) {
        return;
      }

      setMemberOrder(nextOrder);
      setMemberGroupOverrides((current) => {
        const next = new Map(current);
        next.set(rosterId, targetGroupKey);
        return next;
      });

      try {
        await onMemberOrderChange({
          items: layout.flatMap((group) =>
            group.employees.map((item, position) => ({
              position,
              rosterId: item.id,
            })),
          ),
          rosterId,
          targetGroupId: targetGroup.id,
        });
      } catch {
        setMemberOrder(previousOrder);
        setMemberGroupOverrides(previousOverrides);
      }
    },
    [memberGroupOverrides, onMemberOrderChange, orderedGroups],
  );

  const startCellSelection = useCallback(
    (employeeId: string, date: string) => {
      if (!isCellSelectable(employeeId, date)) return;
      scrollContainerRef.current?.focus({ preventScroll: true });
      selectionAnchorRef.current = { date, employeeId };
      selectionDraggingRef.current = true;
      setSelectedCellKeys(new Set());
    },
    [isCellSelectable],
  );

  const extendCellSelection = useCallback(
    (employeeId: string, date: string) => {
      const anchor = selectionAnchorRef.current;
      if (!selectionDraggingRef.current || !anchor) return;

      const anchorEmployeeIndex = visibleEmployeeIds.indexOf(
        anchor.employeeId,
      );
      const employeeIndex = visibleEmployeeIds.indexOf(employeeId);
      const anchorDateIndex = days.findIndex(
        (day) => day.date === anchor.date,
      );
      const dateIndex = days.findIndex((day) => day.date === date);
      if (
        anchorEmployeeIndex < 0 ||
        employeeIndex < 0 ||
        anchorDateIndex < 0 ||
        dateIndex < 0
      ) {
        return;
      }

      const employeeStart = Math.min(anchorEmployeeIndex, employeeIndex);
      const employeeEnd = Math.max(anchorEmployeeIndex, employeeIndex);
      const dateStart = Math.min(anchorDateIndex, dateIndex);
      const dateEnd = Math.max(anchorDateIndex, dateIndex);
      const next = new Set<string>();

      for (
        let currentEmployee = employeeStart;
        currentEmployee <= employeeEnd;
        currentEmployee += 1
      ) {
        for (
          let currentDate = dateStart;
          currentDate <= dateEnd;
          currentDate += 1
        ) {
          const currentEmployeeId =
            visibleEmployeeIds[currentEmployee];
          const currentDay = days[currentDate].date;
          if (!isCellSelectable(currentEmployeeId, currentDay)) {
            continue;
          }
          next.add(
            assignmentCellKey(
              currentEmployeeId,
              currentDay,
            ),
          );
        }
      }
      setSelectedCellKeys(next);
    },
    [days, isCellSelectable, visibleEmployeeIds],
  );

  const handleDropShift = useCallback(
    (
      event: DragEvent<HTMLDivElement>,
      employeeId: string,
      date: string,
    ) => {
      event.preventDefault();
      const shiftId =
        event.dataTransfer.getData("application/x-shift-id") ||
        event.dataTransfer.getData("text/plain");
      if (!shiftId) return;

      const targetKey = assignmentCellKey(employeeId, date);
      void onDropShift(
        shiftId,
        selectedCellKeys.has(targetKey) && selectedTargets.length
          ? selectedTargets
          : [{ date, employeeId }],
      );
    },
    [onDropShift, selectedCellKeys, selectedTargets],
  );

  return (
    <>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        onKeyDown={(event) => {
          if (
            event.repeat ||
            (event.key !== "Delete" && event.key !== "Backspace") ||
            !selectedAssignments.length ||
            (event.target as HTMLElement).closest(
              "input, textarea, select, button, [contenteditable=true], [data-shift-card]",
            )
          ) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          onRemoveAssignments(selectedAssignments);
        }}
        tabIndex={-1}
        className="w-full max-h-[70vh] min-h-80 overflow-auto rounded-lg border bg-white shadow-sm outline-none"
        role="grid"
        aria-colcount={days.length + 1}
        aria-rowcount={rows.length + 1}
      >
        <div
          className="w-full"
          style={{ minWidth: `${calendarMinWidth}px` }}
        >
          <div
            className="sticky top-0 z-30 flex border-b bg-white text-xs shadow-sm"
            style={{ height: HEADER_HEIGHT }}
            role="row"
          >
            <div
              className="sticky left-0 z-40 flex shrink-0 items-center bg-white px-3"
              style={{ width: EMPLOYEE_COLUMN_WIDTH }}
              role="columnheader"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = partiallySelected;
                  }}
                  onChange={(event) => onSelectAll(event.target.checked)}
                  aria-label="Select all visible employees"
                />
                <span className="text-sm font-semibold">
                  Employee ({employeeCount})
                </span>
              </div>
            </div>
            {days.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center px-2 text-center",
                  day.date === todayDate &&
                    "bg-primary-100 text-primary-800 ring-1 ring-inset ring-primary-300",
                )}
                style={{ flex: `1 0 ${DAY_COLUMN_MIN_WIDTH}px` }}
                role="columnheader"
              >
                <span className="block font-semibold">{day.headerLabel}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {day.date === todayDate
                    ? `Today · ${day.shortLabel}`
                    : day.shortLabel}
                </span>
              </div>
            ))}
          </div>

          {topSpacerHeight > 0 && (
            <div style={{ height: topSpacerHeight }} aria-hidden="true" />
          )}

          {visibleRows.map((row) => {
            if (row.type === "employee") {
              return (
                <EmployeeCalendarRow
                  key={row.key}
                  assignmentsByCell={assignmentsByCell}
                  days={days}
                  employee={row.employee}
                  memberDateRange={memberDateRangeByRosterId.get(
                    row.employee.id,
                  )}
                  memberRoleName={memberRoleNameByRosterId.get(
                    row.employee.id,
                  )}
                  todayDate={todayDate}
                  onDropMember={(rosterId) =>
                    moveMember(rosterId, row.groupKey, row.employee.id)
                  }
                  onChangeMemberDate={onChangeMemberDate}
                  onAssignMemberEmployee={onAssignMemberEmployee}
                  onDeleteMember={onDeleteMember}
                  onDropShift={handleDropShift}
                  onRemoveAssignment={onRemoveAssignment}
                  onSelectEmployee={onSelectEmployee}
                  onShowAllAssignments={(employee, date) =>
                    setSelectedCell({ employee, date })
                  }
                  selected={selectedEmployeeIds.has(row.employee.id)}
                  selectedCellKeys={selectedCellKeys}
                  shiftMap={shiftMap}
                  onExtendCellSelection={extendCellSelection}
                  onStartCellSelection={startCellSelection}
                />
              );
            }

            return (
              <GroupCalendarRow
                key={row.key}
                collapsed={collapsedGroupKeys.has(row.groupKey)}
                daysCount={days.length}
                employeeCount={row.employeeCount}
                groupKey={row.groupKey}
                isCustom={row.isCustom}
                isFirst={orderedGroups[0]?.key === row.groupKey}
                isLast={
                  orderedGroups[orderedGroups.length - 1]?.key ===
                  row.groupKey
                }
                label={row.label}
                onAssignEmployee={() =>
                  onAssignGroupEmployee({
                    id: row.groupId,
                    name: row.label,
                  })
                }
                onDelete={() =>
                  onDeleteGroup({ id: row.groupId, name: row.label })
                }
                onDropGroup={reorderGroup}
                onDropMember={(rosterId) =>
                  moveMember(rosterId, row.groupKey)
                }
                onEdit={() =>
                  onEditGroup({ id: row.groupId, name: row.label })
                }
                onMoveDown={() => moveGroup(row.groupKey, 1)}
                onMoveUp={() => moveGroup(row.groupKey, -1)}
                onToggle={() => toggleGroup(row.groupKey)}
              />
            );
          })}

          {bottomSpacerHeight > 0 && (
            <div style={{ height: bottomSpacerHeight }} aria-hidden="true" />
          )}

          {!rows.length && (
            <div className="flex h-48 items-center justify-center text-xs text-muted-foreground">
              Assign employees to start configuring the roster.
            </div>
          )}
        </div>
      </div>

      <RosterCellDialog
        assignments={
          selectedCell
            ? assignmentsByCell.get(
                assignmentCellKey(
                  selectedCell.employee.id,
                  selectedCell.date,
                ),
              ) ?? []
            : []
        }
        date={selectedCell?.date ?? ""}
        employee={selectedCell?.employee ?? null}
        onOpenChange={(open) => {
          if (!open) setSelectedCell(null);
        }}
        onRemoveAssignment={onRemoveAssignment}
        open={selectedCell !== null}
        shiftMap={shiftMap}
      />
    </>
  );
}

const GroupCalendarRow = memo(function GroupCalendarRow({
  collapsed,
  daysCount,
  employeeCount,
  groupKey,
  isCustom,
  isFirst,
  isLast,
  label,
  onAssignEmployee,
  onDelete,
  onDropGroup,
  onDropMember,
  onEdit,
  onMoveDown,
  onMoveUp,
  onToggle,
}: {
  collapsed: boolean;
  daysCount: number;
  employeeCount: number;
  groupKey: string;
  isCustom: boolean;
  isFirst: boolean;
  isLast: boolean;
  label: string;
  onAssignEmployee: () => void;
  onDelete: () => void;
  onDropGroup: (sourceKey: string, targetKey: string) => void;
  onDropMember: (rosterId: string) => void;
  onEdit: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onToggle: () => void;
}) {
  const displayLabel = formatDisplayValue(label);

  return (
    <div
      className="flex w-full border-b bg-neutral-900 text-xs text-white transition-colors data-[drag-over=true]:bg-primary-800"
      style={{
        height: GROUP_ROW_HEIGHT,
        minWidth:
          EMPLOYEE_COLUMN_WIDTH + daysCount * DAY_COLUMN_MIN_WIDTH,
      }}
      onDragOver={(event) => {
        if (
          !event.dataTransfer.types.includes(
            "application/x-roster-group",
          ) &&
          !event.dataTransfer.types.includes(
            "application/x-roster-member",
          )
        ) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        event.currentTarget.dataset.dragOver = "true";
      }}
      onDragLeave={(event) => {
        delete event.currentTarget.dataset.dragOver;
      }}
      onDrop={(event) => {
        event.preventDefault();
        delete event.currentTarget.dataset.dragOver;
        const memberId = event.dataTransfer.getData(
          "application/x-roster-member",
        );
        if (memberId) {
          onDropMember(memberId);
          return;
        }
        const sourceKey = event.dataTransfer.getData(
          "application/x-roster-group",
        );
        if (sourceKey) onDropGroup(sourceKey, groupKey);
      }}
      role="row"
    >
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center gap-1 bg-neutral-900 px-2"
        style={{ width: EMPLOYEE_COLUMN_WIDTH }}
        role="rowheader"
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded hover:bg-white/10"
          aria-label={`${collapsed ? "Expand" : "Collapse"} ${displayLabel}`}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "-rotate-90",
            )}
          />
        </button>
        {!isCustom && (
          <UsersRound className="h-4 w-4 shrink-0 text-neutral-300" />
        )}
        <span className="min-w-0 flex-1 leading-tight">
          <strong className="block truncate">{displayLabel}</strong>
          <span className="block truncate text-[9px] font-normal text-neutral-400">
            {employeeCount} member{employeeCount === 1 ? "" : "s"}
          </span>
        </span>
        <button
          type="button"
          disabled={isFirst}
          onClick={onMoveUp}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Move ${label} up`}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={onMoveDown}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Move ${label} down`}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.setData(
              "application/x-roster-group",
              groupKey,
            );
            event.dataTransfer.effectAllowed = "move";
          }}
          className="flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded hover:bg-white/10 active:cursor-grabbing"
          aria-label={`Drag to reorder ${label}`}
          title="Drag to reorder"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      </div>
      {groupKey.startsWith("group:") && (
        <div className="sticky right-0 ml-auto flex shrink-0 items-center gap-1 bg-neutral-900 px-2">
          <button
            type="button"
            onClick={onAssignEmployee}
            className="flex h-7 items-center gap-1 rounded border border-neutral-600 px-2 text-[10px] font-medium hover:bg-white/10"
          >
            <UserPlus className="h-3 w-3" />
            Assign Employee
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex h-7 items-center gap-1 rounded border border-neutral-600 px-2 text-[10px] font-medium hover:bg-white/10"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex h-7 items-center gap-1 rounded border border-red-700 px-2 text-[10px] font-medium text-red-300 hover:bg-red-950"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
});

const EmployeeCalendarRow = memo(function EmployeeCalendarRow({
  assignmentsByCell,
  days,
  employee,
  memberDateRange,
  memberRoleName,
  onAssignMemberEmployee,
  onChangeMemberDate,
  onDeleteMember,
  todayDate,
  onDropMember,
  onDropShift,
  onRemoveAssignment,
  onSelectEmployee,
  onShowAllAssignments,
  onExtendCellSelection,
  onStartCellSelection,
  selected,
  selectedCellKeys,
  shiftMap,
}: {
  assignmentsByCell: Map<string, Assignment[]>;
  days: ScheduleDay[];
  employee: Employee;
  memberDateRange?: { endDate: string; startDate: string };
  memberRoleName?: string;
  onAssignMemberEmployee: (rosterId: string) => void;
  onChangeMemberDate: (rosterId: string) => void;
  onDeleteMember: (rosterId: string) => void;
  todayDate: string;
  onDropMember: (rosterId: string) => void;
  onDropShift: (
    event: DragEvent<HTMLDivElement>,
    employeeId: string,
    date: string,
  ) => void;
  onRemoveAssignment: RosterCalendarProps["onRemoveAssignment"];
  onSelectEmployee: RosterCalendarProps["onSelectEmployee"];
  onShowAllAssignments: (employee: Employee, date: string) => void;
  onExtendCellSelection: (employeeId: string, date: string) => void;
  onStartCellSelection: (employeeId: string, date: string) => void;
  selected: boolean;
  selectedCellKeys: Set<string>;
  shiftMap: ShiftMap;
}) {
  const displayEmployeeName = formatDisplayValue(employee.full_name);
  const displayRoleName = formatDisplayValue(memberRoleName);

  return (
    <div
      className="flex w-full border-b text-xs transition-colors data-[member-drag-over=true]:bg-primary-50"
      style={{
        height: EMPLOYEE_ROW_HEIGHT,
        minWidth:
          EMPLOYEE_COLUMN_WIDTH + days.length * DAY_COLUMN_MIN_WIDTH,
      }}
      onDragOver={(event) => {
        if (
          event.dataTransfer.types.includes(
            "application/x-roster-member",
          )
        ) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          event.currentTarget.dataset.memberDragOver = "true";
        }
      }}
      onDragLeave={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        ) {
          return;
        }
        delete event.currentTarget.dataset.memberDragOver;
      }}
      onDrop={(event) => {
        delete event.currentTarget.dataset.memberDragOver;
        const rosterId = event.dataTransfer.getData(
          "application/x-roster-member",
        );
        if (!rosterId) return;
        event.preventDefault();
        onDropMember(rosterId);
      }}
      role="row"
    >
      <div
        className="sticky left-0 z-10 flex shrink-0 items-center bg-white px-3 py-3"
        style={{ width: EMPLOYEE_COLUMN_WIDTH }}
        role="rowheader"
      >
        <div className="flex w-full items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) =>
              onSelectEmployee(employee.id, event.target.checked)
            }
            aria-label={`Select ${displayEmployeeName}`}
          />
          <TooltipProvider delayDuration={250}>
            <div className="min-w-0 flex-1 justify-center items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <strong
                    tabIndex={0}
                    className="block truncate rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    {displayEmployeeName}
                  </strong>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  {displayEmployeeName}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    tabIndex={0}
                    className="block truncate rounded-sm text-[10px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                  >
                    {displayRoleName}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  {displayRoleName}
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
          <EmployeeDetailsPopover
            employee={employee}
            memberRoleName={memberRoleName}
            onAssignEmployee={() =>
              onAssignMemberEmployee(employee.id)
            }
            onChangeDate={() => onChangeMemberDate(employee.id)}
            onDelete={() => onDeleteMember(employee.id)}
          />
          <button
            type="button"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "application/x-roster-member",
                employee.id,
              );
              event.dataTransfer.effectAllowed = "move";
            }}
            className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded hover:bg-slate-100 active:cursor-grabbing"
            aria-label={`Move ${formatDisplayValue(employee.full_name)}`}
            title="Drag to reorder or move group"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {days.map((day) => {
        const cellKey = assignmentCellKey(employee.id, day.date);
        const cellAssignments = assignmentsByCell.get(cellKey) ?? [];
        const visibleAssignments = cellAssignments.slice(
          0,
          MAX_VISIBLE_SHIFTS,
        );
        const hiddenAssignments = cellAssignments.slice(MAX_VISIBLE_SHIFTS);
        const hiddenShiftNames = hiddenAssignments
          .map(
            (assignment) =>
              formatDisplayValue(
                shiftMap.get(assignment.shiftId)?.shift.name,
                "",
              ),
          )
          .filter(Boolean)
          .join(", ");
        const cellSelected = selectedCellKeys.has(cellKey);
        const startDate = normalizeRosterDate(memberDateRange?.startDate);
        const endDate = normalizeRosterDate(memberDateRange?.endDate);
        const outsideMemberScope =
          !startDate ||
          !endDate ||
          day.date < startDate ||
          day.date > endDate;
        const isToday = day.date === todayDate;

        return (
          <div
            key={day.date}
            className={cn(
              "h-full min-w-0 select-none overflow-hidden border-l p-1.5 transition-colors",
              isToday && "bg-primary-50/80",
              outsideMemberScope && "cursor-not-allowed bg-slate-100/80",
              !outsideMemberScope &&
                cellSelected &&
                "bg-primary-50 ring-2 ring-inset ring-primary-400",
              !outsideMemberScope &&
                "data-[drag-active=true]:bg-primary-50 data-[drag-active=true]:ring-1 data-[drag-active=true]:ring-inset data-[drag-active=true]:ring-primary-300",
            )}
            style={{ flex: `1 0 ${DAY_COLUMN_MIN_WIDTH}px` }}
            onPointerDown={(event) => {
              if (
                outsideMemberScope ||
                event.button !== 0 ||
                (event.target as HTMLElement).closest(
                  "button, [data-shift-card]",
                )
              ) {
                return;
              }
              event.preventDefault();
              onStartCellSelection(employee.id, day.date);
            }}
            onPointerEnter={(event) => {
              if (outsideMemberScope) return;
              if ((event.buttons & 1) !== 1) return;
              onExtendCellSelection(employee.id, day.date);
            }}
            onDragOver={(event) => {
              if (
                outsideMemberScope ||
                !event.dataTransfer.types.includes(
                  "application/x-shift-id",
                )
              ) {
                return;
              }
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              event.currentTarget.dataset.dragActive = "true";
            }}
            onDragLeave={(event) => {
              delete event.currentTarget.dataset.dragActive;
            }}
            onDrop={(event) => {
              if (
                outsideMemberScope ||
                !event.dataTransfer.types.includes(
                  "application/x-shift-id",
                )
              ) {
                return;
              }
              event.stopPropagation();
              delete event.currentTarget.dataset.dragActive;
              onDropShift(event, employee.id, day.date);
            }}
            role="gridcell"
            aria-disabled={outsideMemberScope}
            aria-selected={!outsideMemberScope && cellSelected}
            aria-label={`${formatDisplayValue(employee.full_name)}, ${day.headerLabel}${outsideMemberScope ? ", outside assignment period" : ""}${cellSelected ? ", selected" : ""}`}
            title={
              outsideMemberScope
                ? startDate && endDate
                  ? "Outside member assignment period"
                  : "Member assignment period is not set"
                : undefined
            }
          >
            <div className="space-y-1">
              {visibleAssignments.map((assignment) => {
                const shiftData = shiftMap.get(assignment.shiftId);
                const colors = shiftData
                  ? SHIFT_COLORS[shiftData.index % SHIFT_COLORS.length]
                  : SHIFT_COLORS[0];
                const displayShiftName = shiftData
                  ? formatDisplayValue(shiftData.shift.name)
                  : formatDisplayValue(assignment.shiftId);
                const titleText = shiftData
                  ? `${shiftData.shift.start_time} - ${shiftData.shift.end_time}. Press Delete or Backspace to remove`
                  : `Shift ${assignment.shiftId}. Press Delete or Backspace to remove`;

                return (
                  <div
                    key={assignment.shiftId}
                    data-shift-card
                    tabIndex={0}
                    className={cn(
                      "group relative truncate rounded-md border px-2 py-2 text-center font-medium outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1",
                      colors.card,
                      assignment.isDraft && "border-dashed",
                      !shiftData && "border-amber-400 bg-amber-50 text-amber-700",
                    )}
                    onKeyDown={(event) => {
                      if (
                        event.repeat ||
                        (event.key !== "Delete" &&
                          event.key !== "Backspace")
                      ) {
                        return;
                      }
                      event.preventDefault();
                      event.stopPropagation();
                      onRemoveAssignment(
                        employee.id,
                        day.date,
                        assignment.shiftId,
                      );
                    }}
                    aria-label={`${displayShiftName}. Press Delete or Backspace to remove`}
                    title={titleText}
                  >
                    <span className="block truncate">{displayShiftName}</span>
                    {assignment.isDraft && (
                      <span className="mt-0.5 block text-[9px] font-normal">
                        Draft
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${displayShiftName}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveAssignment(
                          employee.id,
                          day.date,
                          assignment.shiftId,
                        );
                      }}
                      className="absolute right-0.5 top-0.5 hidden rounded bg-white/80 p-0.5 group-hover:block"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {hiddenAssignments.length > 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onShowAllAssignments(employee, day.date);
                  }}
                  className="w-full rounded-md border border-dashed bg-slate-50 px-2 py-1 text-center text-xs font-semibold text-slate-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  title={hiddenShiftNames || undefined}
                  aria-label={`${hiddenAssignments.length} more shifts${hiddenShiftNames ? `: ${hiddenShiftNames}` : ""}`}
                >
                  +{hiddenAssignments.length}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

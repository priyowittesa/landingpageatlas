import type { Shift } from "../../shifts/types";

export type Assignment = {
  employeeId: string;
  date: string;
  isDraft?: boolean;
  scheduleId?: string;
  shiftId: string;
};

export type SchedulePeriod = "weekly" | "monthly" | "quarter";

export type ScheduleDay = {
  date: string;
  headerLabel: string;
  isSunday: boolean;
  shortLabel: string;
};

export type ShiftMap = Map<
  string,
  {
    index: number;
    shift: Shift;
  }
>;

export const assignmentCellKey = (employeeId: string, date: string) =>
  `${employeeId}:${date}`;

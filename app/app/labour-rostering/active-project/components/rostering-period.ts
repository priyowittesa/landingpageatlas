import {
  addMonths,
  addQuarters,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  format,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from "date-fns";

import type { ScheduleDay, SchedulePeriod } from "./rostering-types";

export const PERIOD_OPTIONS: {
  label: string;
  value: SchedulePeriod;
}[] = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarter", value: "quarter" },
];

export function getPeriodStart(date: Date, period: SchedulePeriod) {
  if (period === "monthly") return startOfMonth(date);
  if (period === "quarter") return startOfQuarter(date);
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getPeriodEnd(date: Date, period: SchedulePeriod) {
  if (period === "monthly") return endOfMonth(date);
  if (period === "quarter") return endOfQuarter(date);
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function movePeriod(
  date: Date,
  period: SchedulePeriod,
  amount: number,
) {
  if (period === "monthly") return addMonths(date, amount);
  if (period === "quarter") return addQuarters(date, amount);
  return addWeeks(date, amount);
}

export function getPeriodLabel(
  period: SchedulePeriod,
  periodStart: Date,
  periodEnd: Date,
) {
  if (period === "monthly") return format(periodStart, "MMMM yyyy");
  if (period === "quarter") {
    const quarter = Math.floor(periodStart.getMonth() / 3) + 1;
    return `Q${quarter} ${format(periodStart, "yyyy")} (${format(periodStart, "MMM")} - ${format(periodEnd, "MMM")})`;
  }
  return `${format(periodStart, "dd MMM")} - ${format(periodEnd, "dd MMM yyyy")}`;
}

export function getScheduleDays(
  periodStart: Date,
  periodEnd: Date,
): ScheduleDay[] {
  return eachDayOfInterval({ start: periodStart, end: periodEnd }).map(
    (day) => ({
      date: format(day, "yyyy-MM-dd"),
      headerLabel: format(day, "EEE, dd MMM"),
      isSunday: day.getDay() === 0,
      shortLabel: format(day, "dd/MM"),
    }),
  );
}

import {
  addDays,
  addMonths,
  eachDayOfInterval,
  isAfter,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths
} from "date-fns";
import { ChevronLeft, ChevronRight, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiaryStatus } from "../../types";
import { DailyDiariesStatus, statusStyles } from "../diary-styles";
import { DailyDiariesItem } from "@/types/type-daily-diaries";

const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const legend: DiaryStatus[] = [
  "Approved",
  "Submitted",
  "Draft Saved",
  "Rejected",
  "Not Started"
];

export function CalendarFilter({
  month,
  selectedDate,
  records,
  onMonthChange,
  onDateChange,
  className
}: {
  month: Date;
  selectedDate: Date;
  records: DailyDiariesItem[];
  onMonthChange: (date: Date) => void;
  onDateChange: (date: Date) => void;
  className?: string;
}) {
  const calendarStart = startOfWeek(startOfMonth(month));
  const days = eachDayOfInterval({
    start: calendarStart,
    end: addDays(calendarStart, 41)
  });
  const statusByDate = new Map(
    records.map((record) => [record.diary_date, record.status])
  );

  return (
    <aside
      className={cn(
        "min-w-90 rounded-xl border border-gray-200 bg-white p-3 lg:sticky lg:top-20",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(subMonths(month, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <h2 className="text-sm font-medium text-gray-800">
          {format(month, "MMMM yyyy")}
        </h2>
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50"
          aria-label="Next month"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center">
        {weekDays.map((day) => (
          <span key={day} className="py-1 text-xs text-muted-foreground">
            {day}
          </span>
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const status = statusByDate.get(key);
          const selected = isSameDay(day, selectedDate);
          const isFutureDay = isAfter(day, new Date());

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDateChange(day)}
              className={cn(
                "relative border-2 border-white flex h-12 w-12 flex-col items-center justify-center rounded-lg text-sm transition-colors hover:bg-primary-50",
                !isSameMonth(day, month) && "text-gray-300",
                isSameMonth(day, month) && "text-gray-700",
                selected && "bg-primary-50",
                "disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
              )}
              aria-label={format(day, "PPPP")}
              aria-pressed={selected}
              disabled={isFutureDay}
            >
              {format(day, "d")}
              {status && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full mt-1",
                    statusStyles[
                      DailyDiariesStatus[
                        status as keyof typeof DailyDiariesStatus
                      ] ?? "Not Started"
                    ]?.dot ?? "bg-gray-300"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-between bg-gray-50 px-3.5 py-2.5 border-t">
        {legend.map((status) => (
          <div
            key={status}
            className="flex items-center gap-1 text-[14px] text-gray-500"
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full mb-0.5",
                statusStyles[status].dot
              )}
            />
            {status === "Draft Saved" ? "Draft" : status}
          </div>
        ))}
      </div>
    </aside>
  );
}

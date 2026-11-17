import { z } from "zod";
import type { OnboardingScanSchedule } from "./onboarding-schedule-api";

export const SCHEDULE_TYPES = {
  hourly: { label: "Hourly", interval: "Hours", max: 23 },
  daily: { label: "Daily", interval: "Days", max: 31 },
  weekly: { label: "Weekly", interval: "", max: 1 },
  monthly: { label: "Monthly", interval: "Months", max: 12 }
} as const;
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type SignalSchedule = {
  type: keyof typeof SCHEDULE_TYPES;
  interval: number;
  hour: number;
  minute: number;
  end: "never" | "runs" | "date";
  runs: number;
  date: string;
  daysOfWeek: number[];
  dayOfMonth: number;
  timeZone: string;
};

export const INITIAL_SIGNAL_SCHEDULE: SignalSchedule = {
  type: "hourly",
  interval: 1,
  hour: 19,
  minute: 1,
  end: "never",
  runs: 1,
  date: "",
  daysOfWeek: [],
  dayOfMonth: 1,
  timeZone: "Asia/Jakarta"
};

function validTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function scheduleToday(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  return ["year", "month", "day"].map((type) =>
    parts.find((part) => part.type === type)?.value
  ).join("-");
}

export const schedulePayloadSchema = z.object({
  schedule_type: z.enum(["hourly", "daily", "weekly", "monthly"]),
  interval: z.number().int().min(1),
  trigger_hour: z.number().int().min(0).max(23),
  trigger_minute: z.number().int().min(0).max(59),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  timezone: z.string().min(1).refine(validTimeZone, "Enter a valid IANA timezone."),
  end_type: z.enum(["never", "after_runs", "on_date"]),
  end_after_runs: z.number().int().min(1).optional(),
  end_date: z.string().date().optional()
}).superRefine((value, context) => {
  const issue = (path: string, message: string) =>
    context.addIssue({ code: "custom", path: [path], message });
  const maximum = SCHEDULE_TYPES[value.schedule_type].max;
  if (value.interval > maximum) {
    issue("interval", `Must be between 1 and ${maximum} for ${value.schedule_type}.`);
  }
  if (value.schedule_type === "weekly" && !value.days_of_week?.length) {
    issue("days_of_week", "Choose at least one day.");
  }
  if (value.end_type === "after_runs" && !value.end_after_runs) {
    issue("end_after_runs", "Enter at least one run.");
  }
  if (value.end_type === "on_date") {
    if (!value.end_date) issue("end_date", "Choose an end date.");
    else if (validTimeZone(value.timezone) && value.end_date < scheduleToday(value.timezone)) {
      issue("end_date", "End date must not be in the past in the schedule timezone.");
    }
  }
});
export type SchedulePayload = z.infer<typeof schedulePayloadSchema>;

export function schedulePayload(draft: SignalSchedule): SchedulePayload {
  return {
    schedule_type: draft.type,
    interval: draft.type === "weekly" ? 1 : draft.interval,
    trigger_hour: draft.hour,
    trigger_minute: draft.minute,
    timezone: draft.timeZone,
    ...(draft.type === "weekly"
      ? { days_of_week: [...new Set(draft.daysOfWeek)].sort((a, b) => a - b) }
      : {}),
    ...(draft.type === "monthly" ? { day_of_month: draft.dayOfMonth } : {}),
    end_type: draft.end === "runs" ? "after_runs" : draft.end === "date" ? "on_date" : "never",
    ...(draft.end === "runs" ? { end_after_runs: draft.runs } : {}),
    ...(draft.end === "date" ? { end_date: draft.date } : {})
  };
}

export function scheduleDraft(schedule: OnboardingScanSchedule): SignalSchedule {
  return {
    type: schedule.schedule_type,
    interval: schedule.interval,
    hour: schedule.trigger_hour,
    minute: schedule.trigger_minute,
    timeZone: schedule.timezone,
    daysOfWeek: schedule.days_of_week,
    dayOfMonth: schedule.day_of_month ?? 1,
    end: schedule.end_type === "after_runs" ? "runs" : schedule.end_type === "on_date" ? "date" : "never",
    runs: schedule.end_after_runs ?? 1,
    date: schedule.end_date ?? ""
  };
}

export function scheduleHour(hour: number) {
  return `${hour % 12 || 12}${hour < 12 ? "AM" : "PM"}`;
}

export function scheduleSummary(schedule: SignalSchedule, runCount = 0) {
  const end =
    schedule.end === "runs"
      ? `Ends after ${schedule.runs} runs (${runCount} done)`
      : schedule.end === "date"
        ? `Ends on ${schedule.date}`
        : "No end date";

  return [
    ["Schedule Type", SCHEDULE_TYPES[schedule.type].label],
    ...(schedule.type === "weekly"
      ? [["Days", schedule.daysOfWeek.map((day) => WEEKDAYS[day]).join(", ")]]
      : [[`${SCHEDULE_TYPES[schedule.type].interval} Between Triggers`, String(schedule.interval)]]),
    ...(schedule.type === "monthly" ? [["Day of month", String(schedule.dayOfMonth)]] : []),
    ["Trigger at Hour", scheduleHour(schedule.hour)],
    ["Trigger at Minute", String(schedule.minute)],
    ["", end]
  ];
}

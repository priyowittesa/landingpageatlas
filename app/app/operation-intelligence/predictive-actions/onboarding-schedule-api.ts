import { z } from "zod";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { engineError } from "./onboarding-api";
import { schedulePayloadSchema, type SchedulePayload } from "./signal-schedule-data";

const axios = axiosConfig(env.apiBaseUrl);
const timestamp = z.string().datetime({ offset: true });
const scheduleSchema = z.object({
  onboarding_id: z.string().min(1),
  schedule_type: z.enum(["hourly", "daily", "weekly", "monthly"]),
  interval: z.number().int().positive(),
  trigger_hour: z.number().int().min(0).max(23),
  trigger_minute: z.number().int().min(0).max(59),
  days_of_week: z.array(z.number().int().min(0).max(6)),
  day_of_month: z.number().int().min(1).max(31).nullable(),
  timezone: schedulePayloadSchema.shape.timezone,
  end_type: z.enum(["never", "after_runs", "on_date"]),
  end_after_runs: z.number().int().positive().nullable(),
  end_date: z.string().date().nullable(),
  status: z.enum(["active", "stopped", "completed"]),
  cron_expression: z.string(),
  run_count: z.number().int().nonnegative(),
  last_run_at: timestamp.nullable(),
  next_run_at: timestamp.nullable()
}).superRefine((value, context) => {
  if (value.schedule_type === "weekly" && !value.days_of_week.length) {
    context.addIssue({ code: "custom", path: ["days_of_week"], message: "Missing weekly days." });
  }
  if ((value.schedule_type === "monthly" && value.day_of_month === null) ||
      (value.end_type === "after_runs" && value.end_after_runs === null) ||
      (value.end_type === "on_date" && value.end_date === null)) {
    context.addIssue({ code: "custom", message: "Incomplete schedule response." });
  }
});
export type OnboardingScanSchedule = z.infer<typeof scheduleSchema>;

function scheduleUrl(id: string) {
  return `/v1/ai-engine/onboardings/${encodeURIComponent(id)}/schedule`;
}

function readSchedule(body: unknown, id: string) {
  const schedule = z.object({ data: scheduleSchema }).parse(body).data;
  if (schedule.onboarding_id !== id) {
    throw new Error("The schedule response does not match the requested onboarding.");
  }
  return schedule;
}

export async function getOnboardingSchedule(id: string, signal?: AbortSignal) {
  try {
    const response = await axios.get(scheduleUrl(id), { signal });
    return readSchedule(response.data, id);
  } catch (error) {
    if (engineError(error).status === 404) return null;
    throw error;
  }
}

export async function updateOnboardingSchedule(id: string, payload: SchedulePayload) {
  // Explicit schema parsing strips tenant and output-only fields before sending.
  const response = await axios.put(scheduleUrl(id), schedulePayloadSchema.parse(payload));
  const schedule = readSchedule(response.data, id);
  if (schedule.status !== "active") throw new Error("The schedule update was not confirmed.");
  return schedule;
}

export async function stopOnboardingSchedule(id: string) {
  const response = await axios.post(`${scheduleUrl(id)}/stop`);
  const schedule = readSchedule(response.data, id);
  if (schedule.status !== "stopped" || schedule.next_run_at !== null) {
    throw new Error("Stopping the schedule was not confirmed.");
  }
  return schedule;
}

export function scheduleFieldErrors(error: unknown): Record<string, string> {
  const details = error instanceof z.ZodError
    ? error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    : engineError(error).details ?? [];
  return Object.fromEntries(details.filter((detail) => detail.path && detail.message)
    .map((detail) => [detail.path!, detail.message!]));
}

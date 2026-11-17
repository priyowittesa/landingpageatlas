import type { OnboardingScanSchedule } from "./onboarding-schedule-api";

export const scheduleRecord: OnboardingScanSchedule = {
  onboarding_id: "onboarding-1",
  schedule_type: "hourly",
  interval: 1,
  trigger_hour: 19,
  trigger_minute: 1,
  days_of_week: [],
  day_of_month: null,
  timezone: "Asia/Jakarta",
  end_type: "never",
  end_after_runs: null,
  end_date: null,
  status: "active",
  cron_expression: "1 * * * *",
  run_count: 2,
  last_run_at: "2026-11-06T07:01:00Z",
  next_run_at: "2026-11-06T08:01:00Z"
};

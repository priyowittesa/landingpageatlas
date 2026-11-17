import { readFileSync } from "node:fs";
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  INITIAL_SIGNAL_SCHEDULE,
  scheduleHour,
  scheduleSummary,
  schedulePayload,
  schedulePayloadSchema,
  scheduleDraft,
  scheduleToday
} from "./signal-schedule-data";
import { SignalScheduleForm } from "./signal-schedule-form";
import { SignalSchedulePanel } from "./signal-schedule";
import { scheduleRecord } from "./schedule-test-fixtures";

const formProps = {
  canStop: true, canManage: true, busy: false, fieldErrors: {},
  onEdit: vi.fn(), onUpdate: vi.fn(), onStop: vi.fn()
};
function panel(overrides: Partial<ComponentProps<typeof SignalSchedulePanel>> = {}) {
  return renderToStaticMarkup(
    <SignalSchedulePanel
      schedule={scheduleRecord} loading={false} error={null} actionError={null}
      busy={false} canManage onRetry={vi.fn()} onResetError={vi.fn()}
      onUpdate={vi.fn()} onStop={vi.fn()} {...overrides}
    />
  );
}

describe("signal schedule panel", () => {
  it.each([
    [0, "12AM"], [7, "7AM"], [12, "12PM"], [19, "7PM"], [23, "11PM"]
  ])("formats hour %i as %s", (hour, expected) => {
    expect(scheduleHour(hour)).toBe(expected);
  });

  it("uses server values and status instead of preview state", () => {
    const html = panel();
    expect(html).not.toContain("UI preview");
    expect(html).toContain("Active");
    expect(html).toContain("Next run:");
    expect(html).toContain("Asia/Jakarta");
    expect(html).toContain("Schedule Type:");
    expect(html).toContain("Hourly");
    expect(html).toContain("Hours Between Triggers:");
    expect(html).toContain("7PM");
    expect(html).toContain("No end date");
    expect(html).toContain("View Schedule");
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain("Schedule settings");
  });

  it("distinguishes missing schedules, loading, and API failures", () => {
    expect(panel({ schedule: null })).toContain("No schedule configured.");
    expect(panel({ schedule: undefined, loading: true })).toContain("Loading schedule...");
    const error = panel({ schedule: undefined, error: new Error("Unavailable") });
    expect(error).toContain("Unavailable");
    expect(error).toContain("Retry schedule");
    expect(error).not.toContain("No schedule configured.");
  });

  it.each([["stopped", "Stopped"], ["completed", "Finished"]] as const)(
    "renders %s schedules without an invented next run",
    (status, label) => {
      const html = panel({ schedule: { ...scheduleRecord, status, next_run_at: null } });
      expect(html).toContain(label);
      expect(html).not.toContain("Next run:");
    }
  );

  it("summarizes daily intervals and each end condition", () => {
    expect(scheduleSummary({
      ...INITIAL_SIGNAL_SCHEDULE, type: "daily", interval: 2, end: "runs", runs: 1
    })).toContainEqual(["Days Between Triggers", "2"]);
    expect(scheduleSummary({
      ...INITIAL_SIGNAL_SCHEDULE, end: "runs", runs: 1
    })).toContainEqual(["", "Ends after 1 runs (0 done)"]);
    expect(scheduleSummary({
      ...INITIAL_SIGNAL_SCHEDULE, end: "runs", runs: 3
    }, 2)).toContainEqual(["", "Ends after 3 runs (2 done)"]);
    expect(scheduleSummary({
      ...INITIAL_SIGNAL_SCHEDULE, end: "date", date: "2026-12-01"
    })).toContainEqual(["", "Ends on 2026-12-01"]);
  });

  it("provides required integer fields and constrains minutes to 0-59", () => {
    const html = renderToStaticMarkup(
      <SignalScheduleForm
        {...formProps}
        schedule={INITIAL_SIGNAL_SCHEDULE}
      />
    );
    expect(html).toContain("Hours Between Triggers");
    expect(html).toContain('required="" min="1" max="23" step="1"');
    expect(html).toContain('required="" min="0" max="59" step="1"');
    expect(html).toMatch(/aria-label="Number of runs"[^>]*disabled=""/);
    expect(html).toMatch(/aria-label="End date"[^>]*disabled=""/);
    expect(html).toContain("Updating restarts the schedule");
    expect(html).toContain('type="submit"');
    expect(html).toContain("Stop Now");
  });

  it.each(["runs", "date"] as const)(
    "requires only the selected %s end condition",
    (end) => {
      const html = renderToStaticMarkup(
        <SignalScheduleForm
          {...formProps}
          schedule={{ ...INITIAL_SIGNAL_SCHEDULE, end }}
        />
      );
      const enabled = end === "runs" ? "Number of runs" : "End date";
      const disabled = end === "runs" ? "End date" : "Number of runs";
      expect(html).toMatch(new RegExp(`aria-label="${enabled}"[^>]*required=""`));
      expect(html).not.toMatch(new RegExp(`aria-label="${enabled}"[^>]*disabled=""`));
      expect(html).toMatch(new RegExp(`aria-label="${disabled}"[^>]*disabled=""`));
    }
  );

  it("disables Stop Now unless the backend schedule is active", () => {
    const html = renderToStaticMarkup(
      <SignalScheduleForm
        {...formProps}
        schedule={INITIAL_SIGNAL_SCHEDULE}
        canStop={false}
      />
    );
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Stop Now<\/button>/);
  });

  it("disables editing for viewers and while a mutation is pending", () => {
    for (const overrides of [{ canManage: false }, { busy: true }]) {
      const html = renderToStaticMarkup(
        <SignalScheduleForm {...formProps} {...overrides} schedule={INITIAL_SIGNAL_SCHEDULE} />
      );
      expect(html).toContain('<fieldset disabled=""');
      expect(html).toMatch(/role="combobox"[^>]*disabled=""/);
    }
  });

  it("places backend validation errors under their named fields", () => {
    const html = renderToStaticMarkup(
      <SignalScheduleForm
        {...formProps}
        schedule={{ ...INITIAL_SIGNAL_SCHEDULE, end: "date" }}
        fieldErrors={{ interval: "Invalid interval", end_date: "Date is in the past", timezone: "Unknown timezone" }}
      />
    );
    for (const message of ["Invalid interval", "Date is in the past", "Unknown timezone"]) {
      expect(html).toContain(message);
    }
    expect(html).toContain('aria-invalid="true"');
  });

  it("maps all schedule and end types without sending irrelevant fields", () => {
    const weekly = schedulePayload({
      ...INITIAL_SIGNAL_SCHEDULE, type: "weekly", interval: 3, daysOfWeek: [5, 1, 5],
      end: "runs", runs: 5
    });
    expect(weekly).toMatchObject({
      schedule_type: "weekly", interval: 1, days_of_week: [1, 5],
      end_type: "after_runs", end_after_runs: 5, timezone: "Asia/Jakarta"
    });
    expect(weekly).not.toHaveProperty("day_of_month");
    expect(weekly).not.toHaveProperty("end_date");
    const monthly = schedulePayload({ ...INITIAL_SIGNAL_SCHEDULE, type: "monthly", dayOfMonth: 31 });
    expect(monthly.day_of_month).toBe(31);
    expect(monthly).not.toHaveProperty("days_of_week");
    expect(scheduleDraft(scheduleRecord)).toMatchObject(INITIAL_SIGNAL_SCHEDULE);
  });

  it("validates type-specific limits, weekly days, and timezones", () => {
    for (const [type, interval] of [["hourly", 24], ["daily", 32], ["monthly", 13], ["weekly", 2]] as const) {
      expect(schedulePayloadSchema.safeParse({
        ...schedulePayload(INITIAL_SIGNAL_SCHEDULE), schedule_type: type, interval
      }).success).toBe(false);
    }
    expect(schedulePayloadSchema.safeParse(schedulePayload({
      ...INITIAL_SIGNAL_SCHEDULE, type: "weekly"
    })).success).toBe(false);
    expect(schedulePayloadSchema.safeParse(schedulePayload({
      ...INITIAL_SIGNAL_SCHEDULE, timeZone: "Not/AZone"
    })).success).toBe(false);
  });

  it("validates end dates against the schedule timezone rather than the browser day", () => {
    const instant = new Date("2026-11-06T20:00:00Z");
    expect(scheduleToday("Asia/Jakarta", instant)).toBe("2026-11-07");
    expect(scheduleToday("America/Los_Angeles", instant)).toBe("2026-11-06");
    expect(schedulePayloadSchema.safeParse(schedulePayload({
      ...INITIAL_SIGNAL_SCHEDULE, end: "date", date: "2000-01-01"
    })).success).toBe(false);
  });

  it.each([
    ["calendar-white.svg", 16],
    ["calendar.svg", 16],
    ["circle-help.svg", 24]
  ])("includes the local Figma asset %s at its original dimensions", (name, size) => {
    const svg = readFileSync(
      new URL(`../../../../public/images/operations-intelligence/schedule/${name}`, import.meta.url),
      "utf8"
    );
    expect(svg.length).toBeGreaterThan(100);
    expect(svg).toContain(`width="${size}" height="${size}"`);
  });
});

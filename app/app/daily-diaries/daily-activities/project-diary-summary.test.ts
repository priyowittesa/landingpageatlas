import { describe, expect, it } from "vitest";
import { EMPTY_PROJECT } from "@/app/app/master-data/projects/types";
import type { DailyDiariesItem } from "@/types/type-daily-diaries";
import { formatDiaryDate, summarizeProjectDiaries } from "./project-diary-summary";

const project = {
  ...EMPTY_PROJECT,
  id: "project-1",
  start_date: "2026-01-01",
  end_date: "2026-01-10"
};

function diary(
  day: string,
  status: DailyDiariesItem["status"],
  overrides: Partial<DailyDiariesItem> = {}
): DailyDiariesItem {
  return {
    id: day,
    project_id: project.id,
    diary_date: `2026-01-${day}`,
    status,
    created_at: "2026-01-10T00:00:00Z",
    updated_at: "2026-01-10T00:00:00Z",
    site_conditions_notes: "",
    weather_condition: "",
    weather_humidity_pct: 0,
    weather_impact_on_work: "",
    weather_temperature_c: 0,
    weather_wind_kmh: 0,
    ...overrides
  };
}

describe("project diary summaries", () => {
  it("counts each workflow status and includes days without a diary", () => {
    expect(summarizeProjectDiaries(project, [
      diary("01", "DIARY_STATUS_APPROVED"),
      diary("02", "DIARY_STATUS_SUBMITTED"),
      diary("03", "DIARY_STATUS_DRAFT"),
      diary("04", "DIARY_STATUS_REJECTED"),
      diary("05", "DIARY_STATUS_NOT_STARTED"),
      diary("06", "DIARY_STATUS_UNSPECIFIED")
    ])).toEqual({
      approved: 1,
      submitted: 1,
      drafted: 1,
      rejected: 1,
      notStarted: 6,
      totalDays: 10,
      progress: 40,
      lastSubmitted: "2026-01-04"
    });
  });

  it("shows zero progress and no submission for an untouched project", () => {
    expect(summarizeProjectDiaries(project, [])).toMatchObject({
      notStarted: 10,
      progress: 0,
      lastSubmitted: null
    });
  });

  it("uses inclusive calendar dates, including leap days and one-day projects", () => {
    expect(summarizeProjectDiaries({
      ...project, start_date: "2024-01-01", end_date: "2024-12-31"
    }, []).totalDays).toBe(366);
    expect(summarizeProjectDiaries({
      ...project, end_date: project.start_date
    }, [diary("01", "DIARY_STATUS_APPROVED")])).toMatchObject({
      totalDays: 1, notStarted: 0, progress: 100
    });
  });

  it("excludes other projects and diaries outside the project date range", () => {
    expect(summarizeProjectDiaries(project, [
      diary("01", "DIARY_STATUS_APPROVED", { project_id: "other" }),
      diary("11", "DIARY_STATUS_SUBMITTED"),
      diary("01", "DIARY_STATUS_DRAFT", { diary_date: "2025-12-31" }),
      diary("02", "DIARY_STATUS_APPROVED", { diary_date: "invalid" })
    ])).toMatchObject({ notStarted: 10, progress: 0, lastSubmitted: null });
  });

  it("deduplicates calendar days using the newest revision", () => {
    expect(summarizeProjectDiaries(project, [
      diary("01", "DIARY_STATUS_APPROVED", { updated_at: "2026-01-12T00:00:00Z" }),
      diary("01", "DIARY_STATUS_DRAFT"),
      diary("01", "DIARY_STATUS_SUBMITTED", { updated_at: "2026-01-11T00:00:00Z" })
    ])).toMatchObject({
      approved: 1, submitted: 0, drafted: 0, notStarted: 9, progress: 10
    });
  });

  it("does not treat a newer draft or approval edit as a submission date", () => {
    expect(summarizeProjectDiaries(project, [
      diary("01", "DIARY_STATUS_APPROVED", { updated_at: "2026-03-01T00:00:00Z" }),
      diary("03", "DIARY_STATUS_SUBMITTED"),
      diary("08", "DIARY_STATUS_DRAFT")
    ]).lastSubmitted).toBe("2026-01-03");
  });

  it.each(["", "not-a-date", "2025-01-01"])(
    "handles missing, invalid or reversed end dates (%s)",
    (end_date) => {
      const summary = summarizeProjectDiaries({ ...project, end_date }, [
        diary("01", "DIARY_STATUS_APPROVED")
      ]);
      expect(summary).toMatchObject({ totalDays: null, notStarted: 0, progress: 0 });
    }
  );

  it.each([[34.4, 34], [-5, 0], [120, 100], [Number.NaN, 0]])(
    "preserves and bounds API progress (%s)",
    (progress, expected) => {
      expect(summarizeProjectDiaries({ ...project, progress }, []).progress)
        .toBe(expected);
    }
  );

  it("formats dates safely without manufacturing missing dates", () => {
    expect(formatDiaryDate("2026-10-18")).toBe("18 Oct 2026");
    expect(formatDiaryDate("invalid")).toBe("Not set");
    expect(formatDiaryDate(null)).toBe("Not set");
  });
});

import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import type { Project } from "@/app/app/master-data/projects/types";
import type { DailyDiariesItem } from "@/types/type-daily-diaries";

export type ProjectDiarySummary = {
  approved: number;
  submitted: number;
  drafted: number;
  rejected: number;
  notStarted: number;
  totalDays: number | null;
  progress: number;
  lastSubmitted: string | null;
};

export function formatDiaryDate(value: string | null | undefined) {
  const date = value ? parseISO(value) : null;
  return date && isValid(date) ? format(date, "d MMM yyyy") : "Not set";
}

export function summarizeProjectDiaries(
  project: Project,
  diaries: DailyDiariesItem[]
): ProjectDiarySummary {
  const start = parseISO(project.start_date);
  const end = parseISO(project.end_date);
  const totalDays =
    isValid(start) && isValid(end) && end >= start
      ? differenceInCalendarDays(end, start) + 1
      : null;
  const summary: ProjectDiarySummary = {
    approved: 0,
    submitted: 0,
    drafted: 0,
    rejected: 0,
    notStarted: 0,
    totalDays,
    progress: 0,
    lastSubmitted: null
  };

  // One diary is expected per calendar day; retain the newest revision.
  const days = new Map<string, DailyDiariesItem>();
  for (const diary of diaries) {
    if (diary.project_id !== project.id) continue;
    const date = parseISO(diary.diary_date);
    if (!isValid(date)) continue;
    if (
      totalDays !== null &&
      (differenceInCalendarDays(date, start) < 0 ||
        differenceInCalendarDays(end, date) < 0)
    ) {
      continue;
    }
    const key = format(date, "yyyy-MM-dd");
    const previous = days.get(key);
    if (!previous || diary.updated_at > previous.updated_at) {
      days.set(key, diary);
    }
  }

  for (const [date, diary] of days) {
    switch (diary.status) {
      case "DIARY_STATUS_APPROVED":
        summary.approved += 1;
        break;
      case "DIARY_STATUS_SUBMITTED":
        summary.submitted += 1;
        break;
      case "DIARY_STATUS_DRAFT":
        summary.drafted += 1;
        break;
      case "DIARY_STATUS_REJECTED":
        summary.rejected += 1;
        break;
    }
    // The API exposes diary dates, not submission timestamps.
    if (
      ["DIARY_STATUS_SUBMITTED", "DIARY_STATUS_APPROVED", "DIARY_STATUS_REJECTED"]
        .includes(diary.status) &&
      (!summary.lastSubmitted || date > summary.lastSubmitted)
    ) {
      summary.lastSubmitted = date;
    }
  }

  const started =
    summary.approved + summary.submitted + summary.drafted + summary.rejected;
  summary.notStarted = Math.max(0, (totalDays ?? days.size) - started);
  const progress =
    project.progress ?? (totalDays ? (started / totalDays) * 100 : 0);
  summary.progress = Number.isFinite(progress)
    ? Math.min(100, Math.max(0, Math.round(progress)))
    : 0;
  return summary;
}

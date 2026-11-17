import Image from "next/image";
import type { Project } from "@/app/app/master-data/projects/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatDiaryDate,
  type ProjectDiarySummary
} from "../project-diary-summary";
import { OpenProjectButton } from "./OpenProjectButton";
import { ProjectProgress } from "./ProjectProgress";

const diaryBadges = [
  {
    key: "approved",
    label: "Approved",
    className: "bg-success/10 text-success"
  },
  { key: "submitted", label: "Submitted", className: "bg-info/10 text-info" },
  { key: "drafted", label: "Drafted", className: "bg-warning/10 text-warning" },
  {
    key: "rejected",
    label: "Rejected",
    className: "bg-red-600/10 text-red-600"
  },
  {
    key: "notStarted",
    label: "Not Started",
    className: "bg-neutral-100/60 text-neutral-950"
  }
] as const;

export function ProjectRow({
  project,
  summary
}: {
  project: Project;
  summary: ProjectDiarySummary;
}) {
  return (
    <article
      className={cn(
        "@container border border-neutral-200 bg-card p-4",
        summary.progress === 0 ? "rounded-[10px]" : "rounded-2xl"
      )}
    >
      <div className="flex flex-col gap-4 @min-[64rem]:flex-row @min-[64rem]:items-center @min-[64rem]:gap-10">
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            className="break-words text-base leading-6 font-semibold text-neutral-900"
            title={`${project.code} - ${project.title}`}
          >
            {project.code} - {project.title}
          </h2>
          <div className="flex flex-col gap-2 @min-[64rem]:flex-row @min-[64rem]:items-center @min-[64rem]:gap-1">
            <p className="flex min-w-0 flex-1 items-start gap-1 text-xs leading-4 font-medium text-neutral-500">
              <Image
                src="/images/daily-diaries/calendar.svg"
                alt=""
                width={14}
                height={14}
                className="mt-px shrink-0"
              />
              <span>
                Start &amp; End Date: {formatDiaryDate(project.start_date)} -{" "}
                {formatDiaryDate(project.end_date)}{" "}
                {summary.totalDays !== null && (
                  <strong className="font-semibold">
                    ({summary.totalDays}{" "}
                    {summary.totalDays === 1 ? "Day" : "Days"})
                  </strong>
                )}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {diaryBadges.map(({ key, label, className }) => (
                <Badge
                  key={key}
                  variant="outline"
                  className={`rounded-full border-0 px-1.5 py-0.5 text-xs leading-4 font-medium ${className}`}
                >
                  {summary[key]} {label}
                </Badge>
              ))}
            </div>
          </div>
          <ProjectProgress progress={summary.progress} />
          <p className="flex items-center gap-1 text-xs leading-4 font-medium text-info">
            <Image
              src="/images/daily-diaries/submitted.svg"
              alt=""
              width={14}
              height={14}
              className="shrink-0"
            />
            <span title="Diary date of the latest submitted, approved or rejected entry">
              Last Submitted:{" "}
              {summary.lastSubmitted
                ? formatDiaryDate(summary.lastSubmitted)
                : "Not submitted yet"}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 @min-[64rem]:justify-end">
          <OpenProjectButton projectId={project.id} compact />
        </div>
      </div>
    </article>
  );
}

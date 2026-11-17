"use client";

import { cn } from "@/lib/utils";
import type {
  DailyDiariesItem,
  DiaryAttachmentItem,
  DiaryExecutionItem,
  DiaryIssueItem
} from "@/types/type-daily-diaries";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  CloudSun,
  FileText,
  Image as ImageIcon,
  TriangleAlert,
  Wrench
} from "lucide-react";
import { useState } from "react";

type SectionProps = {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  emptyLabel?: string;
};

function PreviewSection({
  title,
  icon,
  children,
  defaultOpen = true,
  emptyLabel
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span className="text-gray-500">{icon}</span>
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-700">
          {children ?? <p className="text-gray-400">{emptyLabel}</p>}
        </div>
      )}
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (typeof value === "string" && value.trim() === "");
  return (
    <div className="space-y-0.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </dt>
      <dd
        className={cn("text-xs", isEmpty ? "text-gray-400" : "text-gray-800")}
      >
        {isEmpty ? "-" : value}
      </dd>
    </div>
  );
}

function SiteInfoPreview({ diary }: { diary?: DailyDiariesItem | null }) {
  if (!diary) {
    return <p className="text-gray-400">No site info recorded yet.</p>;
  }
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Condition" value={diary.weather_condition} />
      <Field label="Temperature (°C)" value={diary.weather_temperature_c} />
      <Field label="Humidity (%)" value={diary.weather_humidity_pct} />
      <Field label="Wind (km/h)" value={diary.weather_wind_kmh} />
      <div className="sm:col-span-2 lg:col-span-4">
        <Field label="Impact on Work" value={diary.weather_impact_on_work} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <Field
          label="Site Conditions & Observations"
          value={diary.site_conditions_notes}
        />
      </div>
    </dl>
  );
}

function ExecutionPreview({
  execution
}: {
  execution?: DiaryExecutionItem | null;
}) {
  if (!execution) {
    return <p className="text-gray-400">No execution details recorded yet.</p>;
  }
  const employees = execution.employee ?? [];

  console.log("employees:", employees);
  return (
    <div className="space-y-3">
      <Field label="Description" value={execution.description} />
      {employees.length === 0 ? (
        <p className="text-gray-400">No employees recorded.</p>
      ) : (
        <div className="space-y-2">
          {employees.map((employee) => {
            const activityHours = (employee.activity ?? []).reduce(
              (total, activity) => total + (Number(activity.hours) || 0),
              0
            );
            return (
              <div
                key={employee.id}
                className="rounded-md border border-gray-100 p-2.5"
              >
                <div className="grid gap-2 sm:grid-cols-3">
                  <Field label="Labour Name" value={employee.labour_name} />
                  <Field label="Total Hours" value={employee.total_hours} />
                  <Field label="Break Hours" value={employee.break_hours} />
                </div>
                {(employee.activity ?? []).length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Activities ({activityHours}h)
                    </p>
                    <ul className="space-y-1">
                      {employee.activity.map((activity) => (
                        <li
                          key={activity.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate text-gray-700">
                            {activity.activity_name}
                          </span>
                          <span className="shrink-0 text-gray-500">
                            {activity.hours}h
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(employee.equipment ?? []).length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      Equipment
                    </p>
                    <ul className="space-y-1">
                      {employee.equipment.map((equipment) => (
                        <li
                          key={equipment.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="truncate text-gray-700">
                            {equipment.work_type}
                          </span>
                          <span className="shrink-0 text-gray-500">
                            {equipment.used_hours}h
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function IssuesPreview({ issues }: { issues: DiaryIssueItem[] }) {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <TriangleAlert className="h-4 w-4" />
        <span>No issues or delays recorded.</span>
      </div>
    );
  }
  const totalDelay = issues.reduce(
    (total, issue) => total + (Number(issue.delay_hours) || 0),
    0
  );
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 rounded-md bg-rose-50 px-3 py-2 text-red-700">
        <div>
          <span className="block font-extrabold">{issues.length}</span>
          <span className="text-[10px]">Issues Logged</span>
        </div>
        <div>
          <span className="block font-extrabold">{totalDelay}h</span>
          <span className="text-[10px]">Total Delay</span>
        </div>
        <div>
          <span className="block font-extrabold">
            {issues.filter((issue) => issue.status !== "closed").length}
          </span>
          <span className="text-[10px]">Open Issues</span>
        </div>
      </div>
      {issues.map((issue, index) => (
        <div key={issue.id} className="rounded-md border border-gray-100 p-2.5">
          <div className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-red-700">
              {index + 1}
            </span>
            <div className="grid w-full gap-2 sm:grid-cols-3">
              <Field label="Issue Type" value={issue.issue_type} />
              <Field label="Delay Hours" value={issue.delay_hours} />
              <Field label="Status" value={issue.status} />
              <div className="sm:col-span-3">
                <Field label="Description" value={issue.description} />
              </div>
              <Field
                label="Responsible Party"
                value={issue.responsible_party}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Corrective Action"
                  value={issue.corrective_action}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttachmentsPreview({
  attachments
}: {
  attachments: DiaryAttachmentItem[];
}) {
  if (attachments.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <FileText className="h-4 w-4" />
        <span>No attachments uploaded.</span>
      </div>
    );
  }
  const photos = attachments.filter(
    (item) => item.category === "DIARY_ATTACHMENT_CATEGORY_PHOTO"
  );
  const documents = attachments.filter(
    (item) => item.category === "DIARY_ATTACHMENT_CATEGORY_DOCUMENT"
  );
  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            <Camera className="h-3 w-3" /> Photos ({photos.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-primary-200 px-2 py-1 text-[10px] text-primary-700 hover:bg-primary-50"
              >
                <ImageIcon className="h-3 w-3" />
                <span className="max-w-32 truncate">{photo.file_name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
      {documents.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            <FileText className="h-3 w-3" /> Documents ({documents.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-gray-200 px-2 py-1 text-[10px] text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-3 w-3" />
                <span className="max-w-32 truncate">{doc.file_name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DiaryPreview({
  diary,
  execution,
  issues,
  attachments
}: {
  diary?: DailyDiariesItem | null;
  execution?: DiaryExecutionItem | null;
  issues?: DiaryIssueItem[];
  attachments?: DiaryAttachmentItem[];
}) {
  const hasAny =
    diary ||
    execution ||
    (issues && issues.length > 0) ||
    (attachments && attachments.length > 0);
  if (!hasAny) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500">
        Diary Preview
      </h4>
      <PreviewSection
        title="Site Info & Weather"
        icon={<CloudSun className="h-4 w-4" />}
        emptyLabel="No site info recorded yet."
      >
        <SiteInfoPreview diary={diary} />
      </PreviewSection>
      <PreviewSection
        title="Execution"
        icon={<Wrench className="h-4 w-4" />}
        emptyLabel="No execution details recorded yet."
      >
        <ExecutionPreview execution={execution} />
      </PreviewSection>
      <PreviewSection
        title="Issues & Delays"
        icon={<TriangleAlert className="h-4 w-4" />}
        emptyLabel="No issues or delays recorded."
      >
        <IssuesPreview issues={issues ?? []} />
      </PreviewSection>
      <PreviewSection
        title="Attachments"
        icon={<FileText className="h-4 w-4" />}
        emptyLabel="No attachments uploaded."
      >
        <AttachmentsPreview attachments={attachments ?? []} />
      </PreviewSection>
    </div>
  );
}

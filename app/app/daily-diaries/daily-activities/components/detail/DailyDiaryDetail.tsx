"use client";

import { useProject } from "@/app/app/master-data/projects/use-projects";
import { useAuthMe } from "@/hooks/useAuthMe";
import { Spinner } from "@/components/ui/spinner";
import type { DailyDiariesItem } from "@/types/type-daily-diaries";
import { format, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  useGetDailyDiaries,
  useGetDailyDiary,
  useGetDiaryAttachments,
  useGetDiaryExecution,
  useGetDiaryIssues
} from "../../hooks/useDailyDiaries";
import { ApprovalQueuePanel } from "./ApprovalQueuePanel";
import { CalendarFilter } from "./CalendarFilter";
import { DetailTabs, type DetailTab } from "./DetailTabs";
import { DiaryActionsPanel } from "./DiaryActionsPanel";
import { ProjectBanner } from "./ProjectBanner";

export function DailyDiaryDetail() {
  const params = useParams<{ projectId: string }>();

  // Endpoint Integration
  const { data, isLoading } = useGetDailyDiaries({
    project_id: params.projectId ?? ""
  });
  const { data: submittedDiaries, isLoading: submittedDiariesLoading } =
    useGetDailyDiaries({
      project_id: params.projectId ?? "",
      status: "DIARY_STATUS_SUBMITTED"
    });
  const { data: project, isLoading: projectLoading } = useProject(
    params.projectId
  );

  // The Approval Queue tab is restricted to users with full_access on the
  // daily-diaries module (or any of its sub-modules).
  const { data: me } = useAuthMe();
  const canApprove = useMemo(() => {
    const modules = me?.rbac?.modules ?? [];
    const hasFullAccess = (key: string) =>
      modules.some(
        (module) =>
          (module.key === key && module.access_level === "full_access") ||
          module.sub_modules?.some(
            (sub) => sub.key === key && sub.access_level === "full_access"
          )
      );
    return hasFullAccess("daily-diaries") || hasFullAccess("daily-activities");
  }, [me?.rbac?.modules]);

  const initialDate = new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(initialDate);
  const [activeTab, setActiveTab] = useState<DetailTab>("actions");

  const selectedKey = format(selectedDate, "yyyy-MM-dd");
  const recordsForDate = useMemo(
    () => data?.items?.filter((record) => record.diary_date === selectedKey),
    [data, selectedKey]
  );
  const selectedDiaryId = recordsForDate?.[0]?.id;

  // Warm the cache for the diary the user is about to open, so the guided
  // workflow can pre-fill its steps without waiting on a second round-trip.
  // The returned data also feeds the read-only preview in the actions panel.
  const { data: selectedDiary } = useGetDailyDiary(selectedDiaryId);
  const { data: executionData } = useGetDiaryExecution({
    diary_id: selectedDiaryId
  });
  const { data: issuesData } = useGetDiaryIssues({ diary_id: selectedDiaryId });
  const { data: attachmentsData } = useGetDiaryAttachments({
    diary_id: selectedDiaryId
  });

  function handleDateChange(date: Date) {
    setSelectedDate(date);
    setMonth(date);
  }

  function handleReview(item: DailyDiariesItem) {
    handleDateChange(parseISO(item.diary_date));
    setActiveTab("actions");
  }

  if (isLoading || projectLoading || submittedDiariesLoading)
    return (
      <div className="flex items-center justify-center h-[80dvh]">
        <Spinner className="size-10 text-primary" />
      </div>
    );

  return (
    <div className="pb-8 space-y-5">
      <header>
        <Link
          href="/app/daily-diaries/daily-activities"
          className="inline-flex items-center gap-2 text-xl font-semibold text-gray-900 hover:text-primary-700"
        >
          <ChevronLeft size={20} />
          {project?.code} - {project?.title}
        </Link>
      </header>

      {project && <ProjectBanner project={project} />}

      <div className="mt-5 flex gap-5">
        <div>
          {" "}
          <CalendarFilter
            month={month}
            selectedDate={selectedDate}
            records={data?.items ?? []}
            onMonthChange={setMonth}
            onDateChange={handleDateChange}
          />
        </div>

        <div className="w-full">
          <DetailTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            showApprovalTab={canApprove}
          />
          <div className="mt-5">
            {activeTab === "actions" && (
              <DiaryActionsPanel
                date={selectedDate}
                projectId={project?.id}
                record={recordsForDate?.[0]}
                diaryId={selectedDiaryId}
                diary={selectedDiary}
                execution={executionData?.items?.[0]}
                issues={issuesData?.items ?? []}
                attachments={attachmentsData?.items ?? []}
                records={data?.items ?? []}
              />
            )}
            {activeTab === "approval" && canApprove && (
              <ApprovalQueuePanel
                items={submittedDiaries?.items ?? []}
                onReview={handleReview}
              />
            )}
            {/* {activeTab === "history" && (
              <DiaryHistoryPanel records={recordsForDate ?? []} />
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}

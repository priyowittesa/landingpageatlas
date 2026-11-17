"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DailyDiariesItem,
  DiaryAttachmentItem,
  DiaryExecutionItem,
  DiaryIssueItem
} from "@/types/type-daily-diaries";
import { format } from "date-fns";
import { Calendar, Copy, Download, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "../StatusBadge";
import { DailyDiariesStatus } from "../diary-styles";
import { useDownloadDiaryPdf } from "../../hooks/useDailyDiaries";
import { DiaryPreview } from "./DiaryPreview";
import { DuplicateDataDialog } from "./DuplicateDataDialog";

export function DiaryActionsPanel({
  date,
  projectId,
  record,
  diaryId,
  diary,
  execution,
  issues,
  attachments,
  records = []
}: {
  date: Date;
  projectId?: string;
  record?: DailyDiariesItem;
  diaryId?: string;
  diary?: DailyDiariesItem | null;
  execution?: DiaryExecutionItem | null;
  issues?: DiaryIssueItem[];
  attachments?: DiaryAttachmentItem[];
  records?: DailyDiariesItem[];
}) {
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const status = record?.status ?? "";
  const displayStatus = status ? DailyDiariesStatus[status] : undefined;
  // A diary counts as started once a record exists for the selected date.
  const hasNotStarted = !record;
  // PDF export is available once the diary has moved past the "not started"
  // states (i.e. a draft has been saved or it has been submitted/approved).
  const isNotStartedStatus =
    status === "DIARY_STATUS_UNSPECIFIED" ||
    status === "DIARY_STATUS_NOT_STARTED";
  const pdfExportDisabled = hasNotStarted || isNotStartedStatus;

  const { mutateAsync: downloadPdf, isPending: isPdfDownloading } =
    useDownloadDiaryPdf();

  async function handleExportPdf() {
    const id = record?.id ?? diaryId;
    if (!id) return;
    const fileName = `daily-diary-${format(date, "yyyy-MM-dd")}.pdf`;
    await downloadPdf({ id, fileName });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <Calendar size={16} className="text-primary" />
        <h3 className="font-bold text-gray-900">
          {format(date, "EEEE, d MMMM yyyy")}
        </h3>
        {displayStatus && <StatusBadge status={displayStatus} />}
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-50">
            <PlayCircle size={20} className="text-gray-600" />
          </span>
          <p className="font-bold text-gray-900">
            Diary: {displayStatus ? displayStatus : "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/app/daily-diaries/daily-activities/${projectId?.toLowerCase()}/new?date=${format(date, "yyyy-MM-dd")}${diaryId ? `&diaryId=${diaryId}` : ""}`}
          className="flex min-h-16 items-center gap-3 rounded-lg bg-primary-700 px-4 text-left text-white shadow-sm hover:bg-primary-800 hover:shadow-sm"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
            <PlayCircle size={20} />
          </span>
          <span>
            <strong className="block text-sm">
              {hasNotStarted ? "Begin Daily Diary" : "Open Daily Diary"}
            </strong>
            <span className="block text-xs text-white/75">
              Start the 5-step guided workflow
            </span>
          </span>
        </Link>

        <button
          type="button"
          disabled={pdfExportDisabled || isPdfDownloading}
          onClick={handleExportPdf}
          className="flex min-h-16 items-center gap-3 rounded-lg border border-gray-200 px-4 text-left  disabled:bg-gray-50 hover:bg-primary-50/30 hover:shadow-sm disabled:cursor-not-allowed"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
            <Download size={20} />
          </span>
          <span>
            <strong className="block text-sm">Export PDF</strong>
            <span className="block text-xs">
              Available after diary submission
            </span>
          </span>
        </button>
      </div>

      <Button
        variant="outline"
        className={cn(
          "flex min-h-16 justify-start gap-3 rounded-lg border border-gray-200 px-4 text-left w-full",
          "hover:bg-primary-50/30 hover:shadow-sm"
        )}
        onClick={() => setDuplicateDialogOpen(true)}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
          <Copy size={20} className="text-primary" />
        </span>
        <span>
          <strong className="block text-sm">Duplicate Data</strong>
          <span className="block text-xs">
            Duplicate data from previous date
          </span>
        </span>
      </Button>

      <DuplicateDataDialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
        targetDate={date}
        records={records}
        hasExistingDiary={Boolean(record)}
        projectId={projectId}
      />

      <div className="rounded-lg border border-gray-200 px-4 py-3">
        <div className="flex items-start gap-3">
          <Sparkles size={16} className="h-4 w-4 text-primary" />

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-700">
              AI Insight — {format(date, "EEE d MMM")}
            </p>
            <p className="text-xs text-gray-600">
              {hasNotStarted
                ? "No diary started for this date. Begin immediately to avoid a missing diary flag on your compliance record."
                : "Diary in progress. Review the captured details below before submitting."}
            </p>
          </div>
        </div>
      </div>

      {!hasNotStarted && (
        <DiaryPreview
          diary={diary}
          execution={execution}
          issues={issues}
          attachments={attachments}
        />
      )}
    </section>
  );
}

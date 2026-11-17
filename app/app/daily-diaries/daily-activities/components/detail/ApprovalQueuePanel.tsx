"use client";

import { Button } from "@/components/ui/button";
import type { DailyDiariesItem } from "@/types/type-daily-diaries";
import { format, parseISO } from "date-fns";
import { Check, ClipboardCheck, Eye, RotateCcw } from "lucide-react";
import { useUpdateDiaryStatus } from "../../hooks/useDailyDiaries";
import { StatusBadge } from "../StatusBadge";
import { DailyDiariesStatus } from "../diary-styles";

export function ApprovalQueuePanel({
  items,
  onReview
}: {
  items: DailyDiariesItem[];
  onReview: (item: DailyDiariesItem) => void;
}) {
  const { mutateAsync: updateStatus, isPending } = useUpdateDiaryStatus();

  async function handleStatusChange(
    id: string,
    status: "DIARY_STATUS_APPROVED" | "DIARY_STATUS_REJECTED"
  ) {
    await updateStatus({ id, status });
  }

  return (
    <section>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <ClipboardCheck className="h-4 w-4" />
        Approval Queue
        {items.length > 0 && (
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] text-primary-700">
            {items.length} pending
          </span>
        )}
      </h3>
      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-gray-900">
                    {format(parseISO(item.diary_date), "EEEE, d MMMM yyyy")}
                  </p>
                  <StatusBadge status={DailyDiariesStatus[item.status]} />
                </div>
                <p className="mt-1 text-[10px] text-gray-500">
                  Submitted {format(parseISO(item.updated_at), "d MMM yyyy")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onReview(item)}
                >
                  <Eye /> Review
                </Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    handleStatusChange(item.id, "DIARY_STATUS_APPROVED")
                  }
                >
                  Approve <Check />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    handleStatusChange(item.id, "DIARY_STATUS_REJECTED")
                  }
                >
                  Return <RotateCcw />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
          <ClipboardCheck className="h-6 w-6 text-gray-300" />
          <p className="mt-2 text-xs font-medium text-gray-400">
            No pending approvals
          </p>
          <p className="text-[9px] text-gray-400">
            All submitted diaries have been reviewed.
          </p>
        </div>
      )}
    </section>
  );
}

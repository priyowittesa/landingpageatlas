import { format, parseISO } from "date-fns";
import { CheckCircle2, Clock3, History } from "lucide-react";
import type { DiaryRecord } from "../../types";
import { StatusBadge } from "../StatusBadge";

export function DiaryHistoryPanel({ records }: { records: DiaryRecord[] }) {
  return (
    <section>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <History className="h-4 w-4" />
        Diary History
      </h3>
      {records.length ? (
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.date}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-4"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                {record.status === "Approved" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Clock3 className="h-4 w-4 text-sky-500" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900">
                  {format(parseISO(record.date), "EEEE, d MMMM yyyy")}
                </p>
                <p className="truncate text-[9px] text-gray-500">
                  {record.preparedBy
                    ? `Prepared by ${record.preparedBy}${record.submittedAt ? ` · Submitted ${record.submittedAt}` : ""}`
                    : "No Diary"}
                </p>
              </div>
              <StatusBadge status={record.status} />
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center">
          <History className="mx-auto h-6 w-6 text-gray-300" />
          <p className="mt-2 text-xs text-gray-400">
            No diary history for this date.
          </p>
        </div>
      )}
    </section>
  );
}

import { cn } from "@/lib/utils";
// import type { DiaryStatus } from "../types";
import { statusStyles, type DailyDiariesStatus } from "./diary-styles";
import { ProjectStatus } from "@/app/app/master-data/projects/types";

export function StatusBadge({
  status
}: {
  status: ProjectStatus | DailyDiariesStatus;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium h-fit",
        statusStyles[status].badge
      )}
    >
      {statusStyles[status].label}
    </span>
  );
}

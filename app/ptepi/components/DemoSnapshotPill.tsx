import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { epiData } from "../data";
import { getAsAtLabel } from "../selectors";
import { Tr } from "./Tr";

/**
 * "Demo snapshot as at <as-at date>": the data date every figure and every overdue count
 * is computed against, so a later meeting date is not read as today.
 */
export function DemoSnapshotPill({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        onDark ? "border border-white/20 bg-white/10 text-white" : "border border-primary-100 bg-primary-50 text-primary-900"
      )}
    >
      <CalendarClock size={16} aria-hidden />
      <Tr>Demo snapshot as at</Tr> {getAsAtLabel(epiData)}
    </span>
  );
}

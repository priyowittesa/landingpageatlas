import Link from "next/link";
import { ArrowRight, CalendarClock, Flag, Timer, TriangleAlert } from "lucide-react";
import { formatDate, formatPointsUnsigned } from "../format";
import type { CriticalItem } from "../types";
import { DateSourceTag } from "./DateSourceTag";
import { PercentText } from "./PercentText";
import { Tr } from "./Tr";

type CriticalItemCalloutProps = {
  projectId: string;
  item: CriticalItem;
};

/** "-126 days" with weeks for scale; null stays "No date". */
function FloatText({ days }: { days: number }) {
  const weeks = Math.round(Math.abs(days) / 7);
  return (
    <>
      {days > 0 ? "+" : ""}
      {days} <Tr>days</Tr> ({weeks} <Tr>{days < 0 ? "weeks late" : "weeks spare"}</Tr>)
    </>
  );
}

/**
 * The heaviest component that is far behind plan, its next milestone with a dated and
 * sourced estimate, and the float to the planned finish. Missing dates read "No date".
 */
export function CriticalItemCallout({ projectId, item }: CriticalItemCalloutProps) {
  const milestone = item.nextMilestone;
  return (
    <div className="rounded-xl border border-destructive bg-gradient-to-r from-red-50 to-background p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <TriangleAlert size={16} className="mt-1 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="font-semibold">
              <Tr>Critical item</Tr>: {item.label}
            </p>
            <p className="text-sm text-gray-700">
              <PercentText fraction={item.weight} /> <Tr>of the project weight</Tr>, {formatPointsUnsigned(item.behindPts)}{" "}
              <Tr>behind plan</Tr>
              {item.claimedStage && (
                <>
                  , <Tr>claimed stage</Tr>: <Tr>{item.claimedStage}</Tr>
                </>
              )}
              .
            </p>
          </div>
        </div>
        <Link
          href={`/ptepi/project/${projectId}/evidence`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
        >
          <Tr>Open evidence gate</Tr>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-red-100 pt-4 sm:grid-cols-3">
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-gray-700">
            <Flag size={14} aria-hidden />
            <Tr>Next milestone</Tr>
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-gray-950">
            {milestone ? <Tr>{milestone.label}</Tr> : <Tr>All stages claimed</Tr>}
          </dd>
          {milestone && (
            <dd className="text-xs text-gray-700">
              <Tr>Needs</Tr> <Tr>{milestone.document}</Tr>
            </dd>
          )}
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-gray-700">
            <CalendarClock size={14} aria-hidden />
            <Tr>Milestone date</Tr>
          </dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-950">
            {milestone?.date ? formatDate(milestone.date) : <Tr>No date</Tr>}
            {milestone?.date && milestone.source && <DateSourceTag source={milestone.source} />}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-gray-700">
            <Timer size={14} aria-hidden />
            <Tr>Float to finish</Tr>
          </dt>
          <dd
            className={`mt-0.5 flex flex-wrap items-center gap-2 text-sm font-semibold ${
              item.floatDays !== null && item.floatDays < 0 ? "text-red-700" : "text-gray-950"
            }`}
          >
            {item.floatDays === null ? <Tr>No date</Tr> : <FloatText days={item.floatDays} />}
            {item.floatDays !== null && item.floatSource && <DateSourceTag source={item.floatSource} />}
          </dd>
        </div>
      </dl>
    </div>
  );
}

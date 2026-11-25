import { formatDateRange, formatPctPoints, formatPoints } from "../format";
import type { LookAheadRow } from "../types";
import { SectionCard } from "./SectionCard";
import { SyntheticDataBadge } from "./SyntheticDataBadge";
import { Tr } from "./Tr";

type LookAheadCardProps = {
  rows: LookAheadRow[];
  real?: boolean;
};

/** S3 4-week look-ahead: what the plan asks of each coming week, the ATLAS forecast and what falls due. */
export function LookAheadCard({ rows, real = false }: LookAheadCardProps) {
  return (
    <SectionCard
      title="4-week look-ahead"
      subtitle="Planned progress for the coming weeks against the scenario in which the best 4-week pace repeats"
      badge={<SyntheticDataBadge real={real} />}
      flush
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-2.5 font-medium"><Tr>Week</Tr></th>
              <th className="px-4 py-2.5 font-medium"><Tr>Plan (cumulative)</Tr></th>
              <th className="px-4 py-2.5 font-medium"><Tr>Planned gain</Tr></th>
              <th className="px-4 py-2.5 font-medium">
                <Tr>Scenario if best pace repeats (ATLAS-estimated)</Tr>
              </th>
              <th className="px-4 py-2.5 font-medium"><Tr>Due this week</Tr></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.weekNo} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <span className="block font-semibold text-gray-950">
                    <Tr>Week</Tr> {row.weekNo}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    <Tr>{formatDateRange(row.weekStart, row.weekEnd)}</Tr>
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {row.plan === null ? <Tr>After the planned end</Tr> : formatPctPoints(row.plan)}
                </td>
                <td className="px-4 py-3 tabular-nums">{row.planGain === null ? "-" : <Tr>{formatPoints(row.planGain)}</Tr>}</td>
                <td className="px-4 py-3 tabular-nums">{row.forecast === null ? <Tr>No date</Tr> : formatPctPoints(row.forecast)}</td>
                <td className="px-4 py-3">
                  {row.milestones.length === 0 ? (
                    <span className="text-gray-600"><Tr>No milestone due</Tr></span>
                  ) : (
                    <ul className="space-y-0.5">
                      {row.milestones.map((milestone) => (
                        <li key={milestone}><Tr>{milestone}</Tr></li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

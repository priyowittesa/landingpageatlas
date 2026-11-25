"use client";

import { Tr } from "./Tr";
import { formatPercent, formatRupiahMillions } from "../format";
import { useProjectStore } from "../store/project-store";
import type { ProjectCostView } from "../types";
import { CostBulletCard, MarginBridgeCard } from "./charts/ScreenCharts";
import { CostLinesTable } from "./CostLinesTable";
import { CostMarginCard } from "./CostMarginCard";
import { ProcurementFlowCard } from "./ProcurementFlowCard";
import { EmptyState } from "./EmptyState";
import { SectionCard } from "./SectionCard";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

type CostExplorerProps = {
  views: Record<string, ProjectCostView>;
};

/** Shows the project selected in the top bar switcher. */
export function CostExplorer({ views }: CostExplorerProps) {
  const projectId = useProjectStore((state) => state.projectId);
  const setProject = useProjectStore((state) => state.setProject);
  const view = projectId ? views[projectId] : undefined;

  if (projectId === null) {
    return (
      <SectionCard
        title="Cost by project"
        subtitle="All projects. Pick one to open its margin, cost chart and cost lines."
        badge={<SyntheticDataBadge />}
        flush
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th scope="col" className="px-4 py-3 font-medium"><Tr>Project</Tr></th>
                <th scope="col" className="px-4 py-3 text-right font-medium"><Tr>RAP budget</Tr></th>
                <th scope="col" className="px-4 py-3 text-right font-medium"><Tr>Realised cost</Tr></th>
                <th scope="col" className="px-4 py-3 text-right font-medium"><Tr>RAP remaining</Tr></th>
                <th scope="col" className="px-4 py-3 text-right font-medium"><Tr>Margin</Tr></th>
              </tr>
            </thead>
            <tbody>
              {Object.values(views).map((item) => (
                <tr key={item.projectId}>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setProject(item.projectId)}
                      className="cursor-pointer text-left font-medium text-primary-700 hover:underline"
                    >
                      {item.projectId}
                    </button>
                    <span className="ml-2 text-muted-foreground">{item.customer}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupiahMillions(item.margin.rapPlanned)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupiahMillions(item.margin.cost)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatRupiahMillions(item.margin.rapRemaining)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{item.margin.margin === null ? "-" : formatPercent(item.margin.margin, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    );
  }


  return (
    <div className="space-y-8">
      {view ? (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
            <SectionCard
              title="Margin"
              subtitle="(Recognised revenue - cost) / recognised revenue"
              badge={<SyntheticDataBadge />}
              className="xl:col-span-2"
            >
              <CostMarginCard money={view.margin} detailed />
            </SectionCard>

            <CostBulletCard chart={view.chart} badge={<SyntheticDataBadge />} className="xl:col-span-3" />
          </div>

          {view.bridge.steps.length > 0 && (
            <MarginBridgeCard chart={view.bridge} badge={<SyntheticDataBadge />} />
          )}

          {view.lines.length > 0 && (
          <SectionCard
            title={`Cost lines: ${view.projectId}`}
            subtitle="Flags mark lines with a missing PR, PO or SES, money paid without the document, or no SAP posting."
            badge={<SyntheticDataBadge />}
            flush
          >
            <CostLinesTable key={view.projectId} lines={view.lines} />
          </SectionCard>
          )}

          {view.flow.lines.length > 0 && <ProcurementFlowCard projectId={view.projectId} flow={view.flow} />}
        </>
      ) : (
        <EmptyState title="Unknown project" />
      )}
    </div>
  );
}

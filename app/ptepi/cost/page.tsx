import { AiInsightCard } from "../components/AiInsightCard";
import { getInsights } from "../operations/insights";
import { getAsAtLabel } from "../selectors";
import { CircleDollarSign, FileWarning, Landmark, Percent } from "lucide-react";
import { ProjectFilter } from "../components/ProjectFilter";
import { ScreenHeader } from "../components/ScreenHeader";
import { KpiCard } from "../components/KpiCard";
import { CostExplorer } from "../components/CostExplorer";
import { epiData } from "../data";
import { formatPercent, formatRupiahMillions } from "../format";
import { getCostPortfolio, getProjectCostView, getProjectFilterOptions } from "../selectors";
import type { ProjectCostView } from "../types";

export default function ProcurementCostPage() {
  const portfolio = getCostPortfolio(epiData);

  const views: Record<string, ProjectCostView> = {};
  for (const project of epiData.projects) {
    views[project.projectId] = getProjectCostView(epiData, project.projectId);
  }

  return (
    <div className="space-y-8">
      <ScreenHeader
        title="Procurement and cost"
        subtitle={`RAP budget against realised cost and margin.`}
        actions={<ProjectFilter options={getProjectFilterOptions(epiData)} allowAll />}
      />

      <AiInsightCard insights={getInsights(epiData, { modules: ["cost"] })} asAtLabel={getAsAtLabel(epiData)} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="RAP budget"
          subtitle={`All ${portfolio.projectCount} projects`}
          value={formatRupiahMillions(portfolio.rapPlanned)}
          icon={Landmark}
        />
        <KpiCard
          title="Realised cost"
          subtitle="Cost lines with SAP keys"
          value={formatRupiahMillions(portfolio.cost)}
          icon={CircleDollarSign}
        />
        <KpiCard
          title="Portfolio margin"
          subtitle="On recognised revenue"
          value={portfolio.margin === null ? "-" : formatPercent(portfolio.margin, 2)}
          icon={Percent}
        />
        <KpiCard
          title="Flagged cost lines"
          tone="watch"
          subtitle="Missing document or not posted"
          value={`${portfolio.flaggedLines} in ${portfolio.flaggedProjects} projects`}
          icon={FileWarning}
        />
      </div>

      <CostExplorer views={views} />
    </div>
  );
}

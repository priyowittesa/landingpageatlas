import { BillingExposure } from "./components/BillingExposure";
import { DumbbellCard, ValueByStatusCard } from "./components/charts/ScreenCharts";
import { NeedsAttentionPanel } from "./components/NeedsAttentionPanel";
import { PageHero } from "./components/PageHero";
import { PortfolioTable } from "./components/PortfolioTable";
import { RevenueStrip } from "./components/RevenueStrip";
import { SectionCard } from "./components/SectionCard";
import { SyntheticDataBadge } from "./components/SyntheticDataBadge";
import { epiData } from "./data";
import { formatRupiahMillions } from "./format";
import {
  getAttentionGroups,
  getPlanActualDumbbell,
  getPortfolioHeadline,
  getPortfolioRows,
  getPortfolioTotals,
  getRevenueTrio,
  getValueByStatusChart
} from "./selectors";

export default function PortfolioHealthPage() {
  const totals = getPortfolioTotals(epiData);
  const hero = getPortfolioHeadline(epiData);
  const rows = getPortfolioRows(epiData);
  const groups = getAttentionGroups(epiData);
  const valueByStatus = getValueByStatusChart(epiData);
  const dumbbell = getPlanActualDumbbell(epiData);
  const badge = <SyntheticDataBadge />;

  return (
    <div className="space-y-8">
      <PageHero
        title="Portfolio health"
        headline={hero.headline}
        detail={hero.detail}
        actionHref="#needs-attention"
        actionLabel="See what needs attention"
        stats={[
          { label: "Projects", value: totals.projectCount },
          { label: "Customers", value: totals.customerCount },
          { label: "Portfolio value", value: formatRupiahMillions(totals.contractValue) },
          { label: "With exceptions", value: `${totals.projectsWithExceptions} of ${totals.projectCount}` }
        ]}
      />

      <RevenueStrip revenue={getRevenueTrio(epiData)} scope="All projects" />

      <BillingExposure totals={totals} />

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-5">
        <SectionCard
          id="needs-attention"
          title="Needs attention"
          subtitle="Detected exceptions, most severe first"
          badge={badge}
          className="xl:col-span-2"
        >
          <NeedsAttentionPanel groups={groups} />
        </SectionCard>
        <div className="space-y-5 xl:col-span-3">
          <DumbbellCard chart={dumbbell} badge={badge} />
          <ValueByStatusCard chart={valueByStatus} badge={badge} />
        </div>
      </div>

      <SectionCard
        title="All projects"
        subtitle="Select a row to open the project."
        badge={badge}
        flush
      >
        <PortfolioTable rows={rows} />
      </SectionCard>
    </div>
  );
}

import { AiInsightCard } from "../../components/AiInsightCard";
import { getInsights } from "../../operations/insights";
import { getAsAtLabel } from "../../selectors";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ProjectFilter } from "../../components/ProjectFilter";
import { ScreenHeader } from "../../components/ScreenHeader";
import { CostMarginCard } from "../../components/CostMarginCard";
import { CriticalItemCallout } from "../../components/CriticalItemCallout";
import { AdaptiveRow } from "../../components/AdaptiveRow";
import { PaymentScheduleCard } from "../../components/PaymentScheduleCard";
import { ProjectLifecycleCard } from "../../components/ProjectLifecycleCard";
import { ProjectExceptionsList } from "../../components/ProjectExceptionsList";
import { ProjectInfoRow } from "../../components/ProjectInfoRow";
import { RecoveryCard } from "../../components/RecoveryCard";
import { RevenueStrip } from "../../components/RevenueStrip";
import { DeficitCard, SCurveCard, WeeklyIncrementsCard } from "../../components/charts/ScreenCharts";
import { SectionCard } from "../../components/SectionCard";
import { SyntheticDataBadge } from "../../components/SyntheticDataBadge";
import { SCurveInsightCard } from "../../components/SCurveInsightCard";
import { LookAheadCard } from "../../components/LookAheadCard";
import { Tr } from "../../components/Tr";
import { WeightBreakdown } from "../../components/WeightBreakdown";
import { epiData } from "../../data";
import {
  getCostMargin,
  getCriticalItem,
  getLookAhead,
  getDeficitByComponent,
  getProjectExceptionItems,
  getProjectFilterOptions,
  getPaymentSchedule,
  getProjectInfo,
  getProjectLifecycle,
  getRecoveryRate,
  getRevenueTrio,
  getSCurveChart,
  getWeekCard,
  getWeeklyIncrements,
  getWeightBreakdown,
  hasProject
} from "../../selectors";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return epiData.projects.map((project) => ({ id: project.projectId }));
}

export const dynamicParams = false;

export default async function ProjectCockpitPage({ params }: ProjectPageProps) {
  const { id } = await params;
  if (!hasProject(epiData, id)) notFound();

  const info = getProjectInfo(epiData, id);
  const sCurve = getSCurveChart(epiData, id);
  const increments = getWeeklyIncrements(epiData, id);
  const deficit = getDeficitByComponent(epiData, id);
  const week = getWeekCard(epiData, id);
  const weights = getWeightBreakdown(epiData, id);
  const recovery = getRecoveryRate(epiData, id);
  const critical = getCriticalItem(epiData, id);
  const money = getCostMargin(epiData, id);
  const exceptions = getProjectExceptionItems(epiData, id);
  const lifecycle = getProjectLifecycle(epiData, id);
  const schedule = getPaymentSchedule(epiData, id);
  const lookAhead = getLookAhead(epiData, id);
  const scheduleInsights = getInsights(epiData, { modules: ["cockpit"], projectId: id });
  const insightId = (scheduleInsights.find((insight) => insight.id.startsWith("P-LATE")) ?? scheduleInsights[0])?.id;
  const progressBadge = <SyntheticDataBadge real={info.progressOrigin === "real"} />;

  return (
    <div className="space-y-8">
      <ScreenHeader
        title={`${info.projectId}: ${info.customer}`}
        subtitle={info.description}
        actions={<ProjectFilter options={getProjectFilterOptions(epiData)} />}
        dataTags={info.progressOrigin === "real" ? ["synthetic", "real"] : ["synthetic"]}
      />

      <AiInsightCard insights={getInsights(epiData, { modules: ["cockpit", "evidence"], projectId: id })} asAtLabel={getAsAtLabel(epiData)} />

      <ProjectInfoRow info={info} />

      <RevenueStrip revenue={getRevenueTrio(epiData, id)} scope={info.projectId} />

      {critical && <CriticalItemCallout projectId={id} item={critical} />}

      <ProjectLifecycleCard
        lifecycle={lifecycle}
        action={
          <Link
            href={`/ptepi/commercial?project=${id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
          >
            <Tr>Open billing</Tr>
            <ArrowRight size={16} aria-hidden />
          </Link>
        }
      />

      {sCurve.points.length > 0 && (
        <div className={week ? "grid grid-cols-1 gap-5 xl:grid-cols-3" : undefined}>
          <SCurveCard chart={sCurve} badge={progressBadge} className={week ? "xl:col-span-2" : undefined} />
          {week && (
            <SCurveInsightCard
              week={week}
              recovery={recovery}
              badge={progressBadge}
              actionHref={insightId ? `/ptepi/actions?signal=${insightId}` : "/ptepi/actions"}
            />
          )}
        </div>
      )}

      <AdaptiveRow>
        {increments.points.length > 0 && <WeeklyIncrementsCard chart={increments} badge={progressBadge} />}
        {deficit.points.length > 0 && <DeficitCard chart={deficit} badge={progressBadge} />}
      </AdaptiveRow>

      {lookAhead.length > 0 && <LookAheadCard rows={lookAhead} real={info.progressOrigin === "real"} />}

      <AdaptiveRow>
        {weights.length > 0 && (
          <SectionCard title="Weight breakdown" subtitle="Share of each component in the project" badge={progressBadge}>
            <WeightBreakdown rows={weights} />
          </SectionCard>
        )}
        {recovery && (
          <SectionCard title="Recovery" subtitle="Required pace against the best 4-week rolling average" badge={progressBadge}>
            <RecoveryCard recovery={recovery} actual={week?.actual ?? null} />
          </SectionCard>
        )}
      </AdaptiveRow>

      <AdaptiveRow>
        <SectionCard
          title="Cost and margin"
          subtitle="Actual cost against RAP, margin on recognised revenue"
          badge={<SyntheticDataBadge />}
        >
          <CostMarginCard money={money} />
          <Link
            href={`/ptepi/cost?project=${id}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary-700 hover:underline"
          >
            <Tr>Open cost detail</Tr>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </SectionCard>
        {exceptions.length > 0 ? (
          <SectionCard
            title="Related exceptions"
            subtitle="Seeded exceptions detected for this project"
            badge={<SyntheticDataBadge />}
          >
            <ProjectExceptionsList items={exceptions} />
          </SectionCard>
        ) : (
          schedule.rows.length > 0 && <PaymentScheduleCard schedule={schedule} />
        )}
      </AdaptiveRow>
    </div>
  );
}

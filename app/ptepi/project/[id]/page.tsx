import { notFound } from "next/navigation";
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
import { DeficitCard, SCurveCard, WeeklyIncrementsCard } from "../../components/charts/ScreenCharts";
import { SectionCard } from "../../components/SectionCard";
import { SyntheticDataBadge } from "../../components/SyntheticDataBadge";
import { WeekCard } from "../../components/WeekCard";
import { WeightBreakdown } from "../../components/WeightBreakdown";
import { epiData } from "../../data";
import {
  getCostMargin,
  getCriticalItem,
  getDeficitByComponent,
  getProjectExceptionItems,
  getProjectFilterOptions,
  getPaymentSchedule,
  getProjectInfo,
  getProjectLifecycle,
  getRecoveryRate,
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
  const progressBadge = <SyntheticDataBadge real={info.progressOrigin === "real"} />;

  return (
    <div className="space-y-8">
      <ScreenHeader
        title={`${info.projectId}: ${info.customer}`}
        subtitle={info.description}
        actions={<ProjectFilter options={getProjectFilterOptions(epiData)} />}
      />

      <ProjectInfoRow info={info} />

      {critical && <CriticalItemCallout projectId={id} item={critical} />}

      <ProjectLifecycleCard lifecycle={lifecycle} />

      {sCurve.points.length > 0 && (
        <div className={week ? "grid grid-cols-1 gap-5 xl:grid-cols-3" : undefined}>
          <SCurveCard chart={sCurve} badge={progressBadge} className={week ? "xl:col-span-2" : undefined} />
          {week && (
            <SectionCard title="Current week" subtitle="Plan, actual and deviation to date" badge={progressBadge}>
              <WeekCard week={week} />
            </SectionCard>
          )}
        </div>
      )}

      <AdaptiveRow>
        {increments.points.length > 0 && <WeeklyIncrementsCard chart={increments} badge={progressBadge} />}
        {deficit.points.length > 0 && <DeficitCard chart={deficit} badge={progressBadge} />}
      </AdaptiveRow>

      <AdaptiveRow>
        {weights.length > 0 && (
          <SectionCard title="Weight breakdown" subtitle="Share of each component in the project" badge={progressBadge}>
            <WeightBreakdown rows={weights} />
          </SectionCard>
        )}
        {recovery && (
          <SectionCard title="Recovery" subtitle="Run-rate needed to finish on the planned date" badge={progressBadge}>
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

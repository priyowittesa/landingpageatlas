import { AiInsightCard } from "../../../components/AiInsightCard";
import { getInsights } from "../../../operations/insights";
import { getAsAtLabel } from "../../../selectors";
import { notFound } from "next/navigation";
import { Tr } from "../../../components/Tr";
import {
  CircleCheck,
  CalendarClock,
  CircleDollarSign,
  FileText,
  FileWarning,
  ShieldCheck,
  TriangleAlert
} from "lucide-react";
import { ProjectFilter } from "../../../components/ProjectFilter";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { KpiCard } from "../../../components/KpiCard";
import { BillingTable } from "../../../components/BillingTable";
import { PaymentScheduleCard } from "../../../components/PaymentScheduleCard";
import { EvidenceRegisterTable } from "../../../components/EvidenceRegisterTable";
import { SectionCard } from "../../../components/SectionCard";
import { StageTracker } from "../../../components/StageTracker";
import { SyntheticDataBadge } from "../../../components/SyntheticDataBadge";
import { epiData } from "../../../data";
import { formatRupiahMillions } from "../../../format";
import {
  PROGRESS_SIGNER,
  getBillingRows,
  getEvidenceStages,
  getEvidenceSummary,
  getProjectFilterOptions,
  getPaymentSchedule,
  getProjectInfo,
  getRegisterSummary,
  getProjectRegister,
  getSuggestedAction,
  hasProject
} from "../../../selectors";
import type { SuggestedAction } from "../../../types";

type EvidencePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return epiData.projects.map((project) => ({ id: project.projectId }));
}

export const dynamicParams = false;

export default async function EvidenceGatePage({ params }: EvidencePageProps) {
  const { id } = await params;
  if (!hasProject(epiData, id)) notFound();

  const info = getProjectInfo(epiData, id);
  const stages = getEvidenceStages(epiData, id);
  const summary = getEvidenceSummary(stages);
  const billingRows = getBillingRows(epiData).filter((row) => row.projectId === id);
  const register = getProjectRegister(epiData, id);
  const registerSummary = getRegisterSummary(epiData, id);
  const schedule = getPaymentSchedule(epiData, id);

  const suggestions: Record<number, SuggestedAction> = {};
  for (const stage of stages) {
    if (stage.gate.result === "blocked") {
      suggestions[stage.stageNo] = getSuggestedAction(epiData, id, stage);
    }
  }

  return (
    <div className="space-y-8">
      <ScreenHeader
        title={`Evidence gate: ${info.projectId}`}
        subtitle={`${info.customer}. Nothing is earned or billed without a signed BA for that stage.`}
        actions={<ProjectFilter options={getProjectFilterOptions(epiData)} />}
        dataTags={register.some((row) => row.dataOrigin === "real") ? ["synthetic", "real"] : ["synthetic"]}
      />

      <AiInsightCard insights={getInsights(epiData, { modules: ["evidence"], projectId: id })} asAtLabel={getAsAtLabel(epiData)} />

      <div className="flex items-start gap-3 ptepi-card p-6">
        <ShieldCheck size={16} className="mt-1 shrink-0 text-primary-700" aria-hidden />
        <div className="space-y-1 text-sm">
          <p className="font-semibold"><Tr>Who signs what</Tr></p>
          <p className="text-muted-foreground">
            <Tr>{`The customer ${PROGRESS_SIGNER} signs progress documents: S-curve, approval drawings and material, weekly and monthly reports. The customer President Director signs the payment BA and the handover BA (BAST). Source: kick-off BA, 2 Jul 2026.`}</Tr>
          </p>
          <p className="text-muted-foreground">
            <Tr>A BA signed by any other role does not open the gate.</Tr>
          </p>
        </div>
      </div>

      {stages.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Earned"
              subtitle="Stages with every BA signed"
              value={`${summary.canEarn} of ${stages.length}`}
              icon={CircleCheck}
            />
            <KpiCard
              title="Blocked"
              tone="bad"
              subtitle={`Progress claimed without a signed BA (${summary.claimedWithoutBa} component)`}
              value={`${summary.blocked} of ${stages.length}`}
              icon={TriangleAlert}
            />
            <KpiCard
              title="Not started"
              subtitle="Nothing claimed yet"
              value={`${summary.notStarted} of ${stages.length}`}
              icon={FileWarning}
            />
            <KpiCard
              title="Value at risk"
              tone="bad"
              subtitle="Blocked progress value"
              value={formatRupiahMillions(summary.blockedValue)}
              icon={CircleDollarSign}
            />
          </div>

          <SectionCard
            title="Earning stages 15/15/30/30/10"
            subtitle="Select a stage to see its BA records. Blocked stages can raise an action."
            badge={<SyntheticDataBadge />}
          >
            <StageTracker stages={stages} suggestions={suggestions} />
          </SectionCard>
        </>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Documents on file"
            subtitle="BA and contract documents"
            value={registerSummary.total}
            icon={FileText}
          />
          <KpiCard
            title="Signed"
            subtitle="Count toward billing"
            value={`${registerSummary.signed} of ${registerSummary.total}`}
            icon={CircleCheck}
          />
          <KpiCard
            title="Not signed yet"
            tone={registerSummary.notSigned > 0 ? "watch" : undefined}
            subtitle="Draft or waiting for a signature"
            value={registerSummary.notSigned}
            icon={FileWarning}
          />
          <KpiCard
            title="Latest document"
            subtitle={registerSummary.latestDateLabel ?? "No date on file"}
            value={registerSummary.latestDocument ?? "-"}
            icon={CalendarClock}
          />
        </div>
      )}

      {billingRows.length > 0 ? (
        <SectionCard
          title="Billing gate"
          subtitle="Open payment stages and the signed BA each one needs"
          badge={<SyntheticDataBadge />}
          flush
        >
          <BillingTable rows={billingRows} showFilters={false} />
        </SectionCard>
      ) : (
        schedule.rows.length > 0 && (
          <PaymentScheduleCard
            schedule={schedule}
            title="Billing gate"
            subtitle="No stage is waiting on a BA. Every payment stage of this project, with its status."
          />
        )
      )}

      <SectionCard
        title="BA register"
        subtitle="Every evidence document on file for this project"
        badge={<SyntheticDataBadge />}
      >
        <EvidenceRegisterTable rows={register} />
      </SectionCard>
    </div>
  );
}

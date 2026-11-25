import { CircleCheck, Layers, PlayCircle, Workflow } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { formatPercent } from "../format";
import { CONNECTIONS, FOLDERS, WORKFLOWS } from "./data";
import { getStudioSummary } from "./logic";
import { WorkflowStudio } from "./components/WorkflowStudio";

export default function WorkflowStudioPage() {
  const summary = getStudioSummary(WORKFLOWS);

  return (
    <div className="space-y-8">
      <ScreenHeader
        icon={Workflow}
        title="Workflow Studio"
        subtitle="Automations that move project data from the client systems into ATLAS. Press Run now to replay one on the demo data."
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Workflows" value={summary.workflows} subtitle="Across delivery, commercial and procurement" icon={Workflow} />
        <KpiCard title="Steps" value={summary.steps} subtitle="Sources, transforms, AI, logic and stores" icon={Layers} />
        <KpiCard title="Runs this month" value={summary.runsThisMonth} subtitle="Scheduled runs since 1 Nov 2026" icon={PlayCircle} />
        <KpiCard
          title="Run success rate"
          value={formatPercent(summary.successRate, 1)}
          subtitle="Runs that finished every step"
          icon={CircleCheck}
          tone={summary.successRate >= 0.9 ? "good" : "watch"}
        />
      </div>
      <WorkflowStudio folders={FOLDERS} workflows={WORKFLOWS} connections={CONNECTIONS} />
    </div>
  );
}

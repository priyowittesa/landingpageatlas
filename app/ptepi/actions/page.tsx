import { ScreenHeader } from "../components/ScreenHeader";
import { ActionsBoard } from "../components/ActionsBoard";
import { epiData } from "../data";
import { buildSeedActions } from "../store/action-helpers";

export default function ActionTrackerPage() {
  return (
    <div className="space-y-8">
      <ScreenHeader
        title="Action tracker"
        subtitle={`Alerts and tasks with an owner, a due date and a closing step.`}
      />
      <ActionsBoard
        seeds={buildSeedActions(epiData)}
        asAt={epiData.asAt}
        projectOptions={epiData.projects.map((project) => project.projectId)}
      />
    </div>
  );
}

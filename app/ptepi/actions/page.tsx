import { CalendarClock } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { Tr } from "../components/Tr";
import { getAsAtLabel } from "../selectors";
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
      <p className="flex items-center gap-2 text-sm text-gray-700">
        <CalendarClock size={16} aria-hidden className="shrink-0 text-primary-700" />
        <span>
          <Tr>Overdue is counted against the demo snapshot date, not today:</Tr> {getAsAtLabel(epiData)}.{" "}
          <Tr>An action due after that date is not overdue yet.</Tr>
        </span>
      </p>
      <ActionsBoard
        seeds={buildSeedActions(epiData)}
        asAt={epiData.asAt}
        projectOptions={epiData.projects.map((project) => project.projectId)}
      />
    </div>
  );
}

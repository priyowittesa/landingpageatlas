import { Suspense } from "react";
import { epiData } from "../data";
import { OperationsBoard } from "../operations/components/OperationsBoard";
import { getSignals } from "../operations/signals";
import { getAsAtLabel } from "../selectors";
import { buildSeedActions } from "../store/action-helpers";

/** Operations Intelligence: the signals ATLAS found and the actions to take. The action tracker is its third tab. */
export default function OperationsIntelligencePage() {
  return (
    <Suspense>
      <OperationsBoard
        signals={getSignals(epiData)}
        seeds={buildSeedActions(epiData)}
        asAt={epiData.asAt}
        asAtLabel={getAsAtLabel(epiData)}
        projectOptions={epiData.projects.map((project) => project.projectId)}
      />
    </Suspense>
  );
}

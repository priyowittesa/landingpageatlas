import type { Metadata } from "next";
import "./ptepi.css";
import { PtepiShell } from "./components/PtepiShell";
import { buildAllAnswers } from "./ask-atlas/answers";
import { epiData } from "./data";
import { getSignals } from "./operations/signals";
import { buildSeedActions } from "./store/action-helpers";

export const metadata: Metadata = {
  title: "ATLAS x EPI - Demo",
  robots: { index: false, follow: false }
};

export default function PtepiLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // What the sidebar counts as new: the signals nobody has acted on yet.
  const signalRefs = getSignals(epiData).map((signal) => ({
    module: signal.module,
    action: { source: signal.action.source, projectId: signal.action.projectId, issue: signal.action.issue }
  }));
  return (
    <PtepiShell signalRefs={signalRefs} seeds={buildSeedActions(epiData)} answers={buildAllAnswers(epiData)}>
      {children}
    </PtepiShell>
  );
}

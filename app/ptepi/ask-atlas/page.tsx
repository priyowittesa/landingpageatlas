import { Sparkles } from "lucide-react";
import { ScreenHeader } from "../components/ScreenHeader";
import { epiData } from "../data";
import { getAsAtLabel, getNexaContext } from "../selectors";
import { buildAllAnswers } from "./answers";
import { AskAtlasChat } from "./components/AskAtlasChat";

export default function NexaIntelligencePage() {
  const answers = buildAllAnswers(epiData);

  return (
    <div className="space-y-5">
      <ScreenHeader
        icon={Sparkles}
        title="Nexa Intelligence"
        subtitle="Contractor PMO copilot on the governed demo data. A person approves every action."
      />
      <AskAtlasChat answers={answers} context={getNexaContext(epiData)} asAtLabel={getAsAtLabel(epiData)} />
    </div>
  );
}

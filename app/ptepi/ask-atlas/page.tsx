import { epiData } from "../data";
import { buildAllAnswers } from "./answers";
import { AskAtlasChat } from "./components/AskAtlasChat";

export default function NexaIntelligencePage() {
  const answers = buildAllAnswers(epiData);

  return <AskAtlasChat answers={answers} />;
}

import { QUESTIONS } from "./questions";
import type { QuestionId } from "./types";

/** Questions worth asking on each screen, so the drawer opens with relevant suggestions. */
const BY_SCREEN: { match: (path: string) => boolean; ids: QuestionId[] }[] = [
  { match: (path) => /^\/ptepi\/project\/[^/]+\/evidence$/.test(path), ids: ["bast", "mos", "next"] },
  { match: (path) => path.startsWith("/ptepi/project/"), ids: ["behind", "next", "report"] },
  { match: (path) => path === "/ptepi/commercial", ids: ["billing", "export"] },
  { match: (path) => path === "/ptepi/cost", ids: ["rap", "billing"] },
  { match: (path) => path === "/ptepi/service-contracts", ids: ["inspections"] },
  { match: (path) => path === "/ptepi/actions", ids: ["attention", "next", "export"] },
  { match: (path) => path === "/ptepi/portfolio", ids: ["attention", "behind", "export"] }
];

const DEFAULT_IDS: QuestionId[] = ["attention", "behind", "billing"];

/** The question labels to suggest on a screen. */
export function getPagePrompts(pathname: string): string[] {
  const path = pathname.replace(/\/+$/, "") || "/";
  const ids = BY_SCREEN.find((entry) => entry.match(path))?.ids ?? DEFAULT_IDS;
  return ids.map((id) => QUESTIONS.find((question) => question.id === id)?.label ?? id);
}

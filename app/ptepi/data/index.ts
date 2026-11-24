import raw from "./epi-demo-data.json";
import type { EpiDemoData } from "../types";
import { toEnglish, toEnglishCategory, toEnglishName } from "./translate";

const source = raw as EpiDemoData;

/** English display text for the free-text fields. Keys, status codes and document types are untouched. */
function withEnglishText(data: EpiDemoData): EpiDemoData {
  return {
    ...data,
    projects: data.projects.map((project) => ({ ...project, description: toEnglish(project.description) })),
    progressWeekly: data.progressWeekly.map((row) => ({ ...row, component: toEnglishName(row.component) })),
    rapBudget: data.rapBudget.map((row) => ({ ...row, rapCategory: toEnglishCategory(row.rapCategory) })),
    costLines: data.costLines.map((line) => ({
      ...line,
      rapCategory: line.rapCategory === null ? null : toEnglishCategory(line.rapCategory),
      description: toEnglish(line.description),
      note: toEnglish(line.note)
    })),
    serviceScope: data.serviceScope.map((scope) => ({
      ...scope,
      scopeItem: toEnglish(scope.scopeItem),
      scopeSource: toEnglish(scope.scopeSource)
    })),
    serviceInspection: data.serviceInspection.map((item) => ({
      ...item,
      scopeItem: toEnglish(item.scopeItem),
      assetArea: toEnglish(item.assetArea),
      finding: toEnglish(item.finding),
      followUp: toEnglish(item.followUp),
      officer: toEnglish(item.officer),
      customerWitness: toEnglish(item.customerWitness)
    })),
    baRegister: data.baRegister.map((ba) => ({
      ...ba,
      documentType: toEnglishName(ba.documentType),
      component: toEnglishName(ba.component),
      note: toEnglish(ba.note),
      customerSignatoryRole: toEnglish(ba.customerSignatoryRole),
      epiSignatoryRole: toEnglish(ba.epiSignatoryRole)
    })),
    paymentStages: data.paymentStages.map((stage) => ({ ...stage, blocker: toEnglish(stage.blocker) }))
  };
}

/** Typed view of the generated demo data (as at `asAt`), with English display text. */
export const epiData = withEnglishText(source);

import type { ItemResult } from "./run-inspection-dialog";

export function canCompleteInspectionItem(
  result: ItemResult,
  hasReferenceFiles: boolean,
  isHoldPoint = false
) {
  return (
    result.passed !== undefined &&
    (hasReferenceFiles || result.file_names.length > 0) &&
    (result.passed || result.notes.trim().length > 0) &&
    !(isHoldPoint && result.passed === false)
  );
}

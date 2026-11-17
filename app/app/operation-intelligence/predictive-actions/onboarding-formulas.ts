import type { Formula } from "./formula-data";
import { displayValue } from "./onboarding-api";

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}
const text = (value: unknown) => typeof value === "string" ? value : "";
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export function humanize(value: string): string {
  const words = value.replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function parameterRows(value: unknown, prefix = ""): [string, string][] {
  return Object.entries(object(value)).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return Object.keys(object(item)).length > 0
      ? parameterRows(item, path)
      : [[path, displayValue(item)] as [string, string]];
  });
}

export function mapOnboardingFormulas(detectors: unknown[], counts?: Record<string, number>): Formula[] {
  return detectors.map((raw, index) => {
    const detector = object(raw);
    const id = text(detector.id) || `detector-${index + 1}`;
    const data: [string, string][] = [];
    for (const rawInput of list(detector.inputs)) {
      const input = object(rawInput);
      const field = [text(input.ref), input.unit ? `(${text(input.unit)})` : ""].filter(Boolean).join(" ");
      const source = [
        input.table ? `table ${text(input.table)}` : "",
        input.column ? `column ${text(input.column)}` : "",
        input.expr ? `expr ${text(input.expr)}` : ""
      ].filter(Boolean).join(" · ");
      if (field) data.push([text(input.name) || "Field", field]);
      if (source) data.push(["From", source]);
      const rollup = object(input.rollup);
      const period = [text(rollup.from), text(rollup.to)].filter(Boolean).join(" to ");
      const aggregation = [text(rollup.aggregate), period].filter(Boolean).join(" · ");
      if (aggregation) data.push(["Rollup", aggregation]);
    }
    return {
      id,
      category: text(detector.module_label) || humanize(text(detector.module)) || "Detector",
      title: text(detector.name) || text(detector.label) || humanize(id),
      template: text(detector.template),
      version: text(detector.version),
      enabled: detector.enabled !== false,
      icon: text(detector.module).includes("reserv") ? "reserves" : "production",
      openSignals: counts ? counts[id] ?? 0 : undefined,
      condition: text(detector.signal_when),
      data,
      parameters: parameterRows(detector.params),
      calculations: list(detector.steps).flatMap((rawStep) => {
        const step = object(rawStep);
        return typeof step.expression === "string"
          ? [[text(step.step), step.expression] as [string, string]] : [];
      }),
      note: detector.skip_rule ? `Not evaluated when ${text(detector.skip_rule)}` : ""
    };
  });
}

import { formatNumber } from "./api";
import type { LoadingCapacity, ProductionPart, Thresholds } from "./api-types";
import type { ChartGroup, RefLine } from "./types";

export function productionPartStatus(part: ProductionPart) {
  if (part.line_status === "CAPACITY_STATUS_NORMAL") return { label: "Normal", color: "green" as const, alert: false };
  if (part.line_status === "CAPACITY_STATUS_WARNING") return { label: "Warning", color: "orange" as const, alert: false };
  if (part.line_status === "CAPACITY_STATUS_NG") return { label: part.bottleneck ? "NG Bottleneck" : "NG Overload", color: "red" as const, alert: true };
  return undefined;
}

export function loadingGroups(data?: LoadingCapacity): ChartGroup[] {
  const series = [
    { offset: -1, before: false, label: "N-1", color: "#8ED8E0" },
    { offset: 0, before: true, label: "N Before", color: "#F5B231" },
    { offset: 0, before: false, label: "N After", color: "#279A5B" },
    { offset: 1, before: false, label: "N+1", color: "#B7BEC9" },
    { offset: 2, before: true, label: "N+2", color: "#3B9BE0" },
    { offset: 2, before: false, label: "N+2 After", color: "#8FCB4A" },
    { offset: 3, before: false, label: "N+3", color: "#1B9C8E" },
  ];
  return (data?.lines ?? []).map((item) => ({
    line: item.line.line_code,
    bars: series.flatMap((entry) => {
      const point = item.points?.find((p) => p.offset === entry.offset);
      const value = (entry.before ? point?.before : point?.capacity)?.capacity_pct;
      return value == null ? [] : [{ label: entry.label, color: entry.color, value }];
    }),
  }));
}

export function thresholdLines(thresholds?: Thresholds): RefLine[] {
  return thresholds ? [
    { pct: thresholds.warning_pct, color: "#F59E0B" },
    { pct: thresholds.ng_pct, color: "#EF4444" },
  ] : [];
}

export function loadingRows(data?: LoadingCapacity) {
  return (data?.lines ?? []).map((item) => {
    const current = item.points?.find((p) => p.offset === 0);
    const capacity = current?.capacity;
    const loading = (offset: number) => formatNumber(item.points?.find((p) => p.offset === offset)?.capacity?.loading_pcs);
    return {
      id: item.line.line_id,
      line: item.line.line_code,
      ct: formatNumber(capacity?.cycle_time_seconds),
      efficiency: formatNumber(capacity?.efficiency_pct, "%"),
      pcsPerHour: formatNumber(capacity?.pcs_per_hour),
      maxCap: `${formatNumber(capacity?.available_pcs)} CM / ${formatNumber(capacity?.daily_capacity_pcs)} CD`,
      n: formatNumber(current?.before?.loading_pcs), nAfter: loading(0),
      n1: loading(1), n2: loading(2), n3: loading(3),
      problem: capacity?.problem,
    };
  });
}

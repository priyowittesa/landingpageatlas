export interface TrendPoint {
  month: string;
  n1?: number;
  loading?: number;
  shift1?: number;
  shift2?: number;
  shift3?: number;
}

export interface TrendLegendItem {
  label: string;
  color: string;
}

export interface TrendRefLine {
  pct: number;
  label: string;
  color: string;
  dashStyle: "dashed" | "dotted";
}

export const TREND_DATA: TrendPoint[] = [
  { month: "Jan", n1: 188, loading: 188 },
  { month: "Feb", n1: 195, loading: 195 },
  { month: "Mar", n1: 190, loading: 190 },
  { month: "Apr", n1: 195, loading: 195 },
  { month: "May", n1: 200, loading: 200 },
  { month: "Jun", n1: 280, loading: 295 },
  { month: "Jul", n1: 300, loading: 320 },
  { month: "Aug", n1: 243, loading: 234 },
];

export const TREND_LEGEND: TrendLegendItem[] = [
  { label: "Loading", color: "#3B0764" },
  { label: "N-1", color: "#A78BFA" },
  { label: "Capacity 1 Shift", color: "#F59E0B" },
  { label: "Capacity 2 Shift", color: "#FBBF24" },
  { label: "Capacity 3 Shift", color: "#FDE68A" },
];

export const TREND_REF_LINES: TrendRefLine[] = [
  { pct: 200, label: "Warning (200%)", color: "#F59E0B", dashStyle: "dashed" },
  {
    pct: 300,
    label: "NG Threshold (300%)",
    color: "#EF4444",
    dashStyle: "dotted",
  },
];

export const LINES = [
  "ASCC 01",
  "ASCC 02",
  "ASCC 03",
  "ASCC 04",
  "ASCC 05",
  "ASCC 06",
];

export const PARTS = [
  "PN-D3086",
  "PN-A1042",
  "PN-C2057",
  "PN-B7023",
  "PN-E4519",
  "PN-F6602",
];

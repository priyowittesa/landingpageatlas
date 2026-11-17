export interface ChartBar {
  label: string;
  value: number;
  color: string;
}

export interface ChartGroup {
  line: string;
  bars: ChartBar[];
  highlighted?: boolean;
}

export interface LegendItem {
  label: string;
  color: string;
}

export interface RefLine {
  pct: number;
  color: string;
}

export interface BridgingRow {
  id: string;
  sourceLine: string;
  targetLine: string;
  partNumber: string;
  qtyMoved: string;
  beforeCap: number;
  beforeStatus: "Normal" | "NG";
  afterCap: number;
  afterStatus: "Normal" | "NG";
  date: string;
}

export interface OvertimeRow {
  id: string;
  line: string;
  shiftType: string;
  date: string;
  hours: string;
  workers: number;
  reason: string;
}

export const LEGEND: LegendItem[] = [
  { label: "N-1", color: "#8ED8E0" },
  { label: "N Before", color: "#F5B231" },
  { label: "N After", color: "#279A5B" },
  { label: "N+1", color: "#B7BEC9" },
  { label: "N+2", color: "#3B9BE0" },
  { label: "N+2 After", color: "#8FCB4A" },
  { label: "N+3", color: "#1B9C8E" },
];

export const REF_LINES: RefLine[] = [
  { pct: 150, color: "#E05252" },
  { pct: 200, color: "#8B5CF6" },
  { pct: 257, color: "#2FAE60" },
];

export const CHART_GROUPS: ChartGroup[] = [
  {
    line: "ASCC 01",
    bars: [
      { label: "N-1", value: 243, color: "#8ED8E0" },
      { label: "N Before", value: 234, color: "#F5B231" },
      { label: "N+1", value: 219, color: "#B7BEC9" },
      { label: "N+2", value: 221, color: "#3B9BE0" },
      { label: "N+2 After", value: 221, color: "#8FCB4A" },
      { label: "N+3", value: 223, color: "#1B9C8E" },
    ],
  },
  {
    line: "ASCC 02",
    bars: [
      { label: "N-1", value: 160, color: "#8ED8E0" },
      { label: "N Before", value: 187, color: "#F5B231" },
      { label: "N After", value: 187, color: "#279A5B" },
      { label: "N+1", value: 297, color: "#B7BEC9" },
      { label: "N+2", value: 200, color: "#3B9BE0" },
      { label: "N+2 After", value: 200, color: "#8FCB4A" },
      { label: "N+3", value: 205, color: "#1B9C8E" },
    ],
  },
  {
    line: "ASCC 03",
    bars: [
      { label: "N-1", value: 315, color: "#8ED8E0" },
      { label: "N Before", value: 306, color: "#F5B231" },
      { label: "N After", value: 291, color: "#279A5B" },
      { label: "N+1", value: 276, color: "#B7BEC9" },
      { label: "N+2", value: 297, color: "#3B9BE0" },
      { label: "N+2 After", value: 295, color: "#8FCB4A" },
      { label: "N+3", value: 283, color: "#1B9C8E" },
    ],
  },
];

export const CONTINGENCY_CHART_GROUPS: ChartGroup[] = [
  {
    line: "ASCC 01",
    highlighted: true,
    bars: [
      { label: "N-1", value: 243, color: "#8ED8E0" },
      { label: "N Before", value: 234, color: "#F5B231" },
      { label: "N+1", value: 219, color: "#B7BEC9" },
      { label: "N+2", value: 221, color: "#3B9BE0" },
      { label: "N+2 After", value: 221, color: "#8FCB4A" },
      { label: "N+3", value: 223, color: "#1B9C8E" },
    ],
  },
];

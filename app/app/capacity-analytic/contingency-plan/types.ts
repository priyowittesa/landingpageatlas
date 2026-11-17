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

// Dummy Data
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
export const REASONS = [
  "Post-bridging capacity gap on ASCC 02",
  "Extended shift for NG backlog",
  "Weekend maintenance run",
  "Line changeover support",
  "Urgent customer order",
];
export const SHIFT_TYPES = ["Weekend", "Night OT", "Saturday", "Weekday OT"];

export type BadgeColor = "blue" | "red" | "orange" | "green";

export interface StatCard {
  label: string;
  badge: string;
  badgeColor: BadgeColor;
  value: string;
  caption: string;
}

export type PartStatus = "Normal" | "NG Overload" | "NG Bottleneck";

export type ActivityStatus = "In Progress" | "Completed" | "Pending";

export interface ProductionPart {
  pn: string;
  status: PartStatus;
  assignedLine: string;
  modelName: string;
  orderVolume: string;
}

export interface Activity {
  activity: string;
  targetLine: string;
  pic: string;
  dueDate: string;
  status: ActivityStatus;
}

export const STATS: StatCard[] = [
  {
    label: "Total Production Lines",
    badge: "Active",
    badgeColor: "blue",
    value: "24",
    caption: "Running normal schedule",
  },
  {
    label: "NG Lines (Overloaded)",
    badge: "Critical",
    badgeColor: "red",
    value: "3",
    caption: "Action required on ASCC 02 & 05",
  },
  {
    label: "Overall Capacity",
    badge: "Warning",
    badgeColor: "orange",
    value: "187",
    caption: "Slight bottleneck detected",
  },
  {
    label: "Recent Uploads Today",
    badge: "Up to Date",
    badgeColor: "green",
    value: "12",
    caption: "Latest parts updated 5m ago",
  },
];

export const PARTS: ProductionPart[] = [
  {
    pn: "PN-A2847",
    status: "Normal",
    assignedLine: "ASCC 03",
    modelName: "Titan Engine X",
    orderVolume: "14,200 pcs",
  },
  {
    pn: "PN-B9022",
    status: "NG Overload",
    assignedLine: "ASCC 05",
    modelName: "Altimeda Gearbox",
    orderVolume: "8,900 pcs",
  },
  {
    pn: "PN-A2847",
    status: "Normal",
    assignedLine: "ASCC 03",
    modelName: "Titan Engine X",
    orderVolume: "14,200 pcs",
  },
  {
    pn: "PN-C1149",
    status: "Normal",
    assignedLine: "ASCC 12",
    modelName: "Quantum Rotor S",
    orderVolume: "22,500 pcs",
  },
  {
    pn: "PN-D3086",
    status: "NG Bottleneck",
    assignedLine: "ASCC 02",
    modelName: "Atlas Compressor",
    orderVolume: "6,400 pcs",
  },
  {
    pn: "PN-C1149",
    status: "Normal",
    assignedLine: "ASCC 12",
    modelName: "Quantum Rotor S",
    orderVolume: "22,500 pcs",
  },
];

export const ACTIVITIES: Activity[] = [
  {
    activity: "Line capacity review (ASCC 02 & 05)",
    targetLine: "ASCC 02",
    pic: "Alexander V.",
    dueDate: "Oct 24, 2025",
    status: "In Progress",
  },
  {
    activity: "Shift schedule update for Titan Model",
    targetLine: "ASCC 03",
    pic: "Maria G.",
    dueDate: "Oct 25, 2025",
    status: "Completed",
  },
  {
    activity: "Machine maintenance check & optimization",
    targetLine: "ASCC 12",
    pic: "Sophia P.",
    dueDate: "Oct 26, 2025",
    status: "Pending",
  },
  {
    activity: "Quality audit preparation (PN-B9022)",
    targetLine: "ASCC 05",
    pic: "David L.",
    dueDate: "Oct 27, 2025",
    status: "In Progress",
  },
  {
    activity: "Production target alignment meeting",
    targetLine: "ASCC 01",
    pic: "John D.",
    dueDate: "Oct 28, 2025",
    status: "Pending",
  },
];

export const PROCESSING_LOG: { type: "warn" | "success"; text: string }[] = [
  { type: "warn", text: "PN: 11213-90200 - not found in SUB COMPONENT (GRP)" },
  { type: "warn", text: "PN: 85720-00290 - not found in SUB COMPONENT (GRP)" },
  { type: "warn", text: "PN: 82304-73980 - not found in SUB COMPONENT (GRP)" },
  { type: "warn", text: "PN: 11213-90200 - not found in SUB COMPONENT (GRP)" },
  { type: "warn", text: "PN: 85720-00290 - not found in SUB COMPONENT (GRP)" },
  { type: "warn", text: "PN: 82303-73980 - not found in SUB COMPONENT (GRP)" },
  { type: "warn", text: "PN: 82304-73980 - not found in SUB COMPONENT (GRP)" },
  { type: "success", text: "insert capacity order done" },
  { type: "success", text: "insert capacity tentative done" },
  { type: "success", text: "import data marketing successfully" },
];

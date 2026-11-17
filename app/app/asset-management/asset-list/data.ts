export type AssetStatus = "Active" | "Preventive" | "Breakdown";

export type Asset = {
  id: string;
  code: string;
  name: string;
  model: string;
  status: AssetStatus;
  project: string;
  frequency: string;
  frequencyTypeId: string;
  threshold: string;
  usage: string;
  usageNumber: number;
  lastServiceUsage: string;
  serviceInterval: number;
  warningThreshold: number;
  usageUnit: string;
  autoCreateWorkOrder: boolean;
};

const names = [
  ["Caterpillar 320 Excavator", "EQ-CRN-4827", "ASD-0987", "Project A", "Hourly", "500 hrs", "482 hrs", 482, "380 hrs"],
  ["Volvo A45G Dump Truck", "EQ-EXC-1053", "ASD-0987", "Project B", "Mileage", "10,000 km", "3,450 km", 3450, "2,900 km"],
  ["Liebherr LTM 1050 Crane", "EQ-BLD-7391", "ASD-0987", "Project C", "Monthly", "5.8 mths", "5.8 mths", 5.8, "4.2 mths"],
  ["Komatsu D155AX Bulldozer", "EQ-PMP-2648", "ASD-0987", "Project D", "Hourly", "500 hrs", "248 hrs", 248, "196 hrs"],
  ["CAT 966M Wheel Loader", "EQ-GEN-5916", "ASD-0987", "Project E", "Hourly", "500 hrs", "512 hrs", 512, "410 hrs"],
] as const;

export const assets: Asset[] = Array.from({ length: 42 }, (_, index) => {
  const source = names[index % names.length];
  const statuses: AssetStatus[] = ["Active", "Preventive", "Active", "Breakdown", "Active"];
  return {
    id: index === 0 ? "eq-crn-4827" : `asset-${index + 1}`,
    name: source[0], code: index < 5 ? source[1] : `EQ-AST-${String(6000 + index)}`,
    model: source[2], project: source[3], frequency: source[4], threshold: source[5],
    usage: source[6], usageNumber: source[7], lastServiceUsage: source[8], status: statuses[index % 5],
    frequencyTypeId: "", serviceInterval: 5000, warningThreshold: 3500, usageUnit: source[4] === "Mileage" ? "km" : source[4] === "Monthly" ? "months" : "hrs", autoCreateWorkOrder: true,
  };
});

export const recentUsage = [
  ["Oct 24, 2025", "380 hrs", "Alexander V."], ["Oct 23, 2025", "380 hrs", "Alexander V."],
  ["Oct 22, 2025", "380 hrs", "Maria G."], ["Oct 21, 2025", "380 hrs", "Maria G."],
  ["Oct 20, 2025", "380 hrs", "Sophia P."],
];

export const workOrders = [
  ["WO-4821", "Hydraulic Filter Replacement", "Oct 15, 2025"],
  ["WO-4790", "PM-03 Standard Maintenance", "Sep 28, 2025"],
  ["WO-4632", "Engine Tuning & Diagnostics", "Sep 02, 2025"],
  ["WO-4481", "Track Link & Shoe Tension Adjustment", "Aug 14, 2025"],
  ["WO-4322", "O-Ring Seal Replacement (Boom Cylinder)", "Jul 19, 2025"],
];

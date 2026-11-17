export type InspectionTemplate = {
  id: string;
  code: string;
  name: string;
  machine: string;
  frequency?: "Weekly" | "Monthly";
  version?: string;
  status?: "Draft" | "Archived" | "Published";
};

export type QualityTemplate = {
  id: string;
  name: string;
  products: string[];
  status: "Draft" | "Archived" | "Published";
  revision: string;
};

export const inspectionTemplates: InspectionTemplate[] = [
  { id: "lth-05", code: "LTH-05", name: "Hydraulic", machine: "Hydraulic lift #1", frequency: "Monthly", version: "Rev 1", status: "Draft" },
  { id: "drl-12", code: "DRL-12", name: "Pneumatic", machine: "Pneumatic drill #2", frequency: "Weekly", version: "Rev 2", status: "Archived" },
  { id: "wld-08", code: "WLD-08", name: "Thermal", machine: "Welding unit #3", frequency: "Monthly", version: "Rev 3", status: "Published" },
  { id: "prs-03", code: "PRS-03", name: "Calibration", machine: "Pressure system #1", frequency: "Weekly", version: "Rev 5", status: "Draft" },
  { id: "cnc-07", code: "CNC-07", name: "Milling", machine: "CNC Mill #1", frequency: "Weekly", version: "Rev 4", status: "Archived" },
  { id: "hyd-15", code: "HYD-15", name: "Compressor", machine: "Compressor #2" },
  { id: "elc-22", code: "ELC-22", name: "Electrical", machine: "Electrical panel #4" },
  { id: "grn-09", code: "GRN-09", name: "Grinding", machine: "Grinding unit #1" },
  { id: "asm-11", code: "ASM-11", name: "Assembly", machine: "Assembly station #3" },
  { id: "trn-04", code: "TRN-04", name: "Turning", machine: "Turning lathe #2" },
];

export const qualityTemplates: QualityTemplate[] = [
  {
    id: "qt-1",
    name: "Final Assembly QC Checklist",
    products: ["Bracket A-100", "Housing B-220"],
    status: "Draft",
    revision: "Rev 1",
  },
  {
    id: "qt-2",
    name: "Incoming Material QC",
    products: ["Valve Assembly C-30"],
    status: "Archived",
    revision: "Rev 2",
  },
  {
    id: "qt-3",
    name: "Final Assembly QC Checklist",
    products: ["Hydraulic Pump"],
    status: "Published",
    revision: "Rev 1",
  },
  {
    id: "qt-4",
    name: "Incoming Material QC",
    products: ["Ball Bearing"],
    status: "Draft",
    revision: "Rev 4",
  },
  {
    id: "qt-5",
    name: "Final Assembly QC Checklist",
    products: ["Drive Shaft"],
    status: "Archived",
    revision: "Rev 2",
  },
  {
    id: "qt-6",
    name: "Incoming Material QC",
    products: ["Gearbox Assembly"],
    status: "Published",
    revision: "Rev 3",
  },
  {
    id: "qt-7",
    name: "Final Assembly QC Checklist",
    products: ["Brake Caliper"],
    status: "Draft",
    revision: "Rev 1",
  },
  {
    id: "qt-8",
    name: "Incoming Material QC",
    products: ["Fuel Injector"],
    status: "Archived",
    revision: "Rev 2",
  },
  {
    id: "qt-9",
    name: "Final Assembly QC Checklist",
    products: ["Timing Belt"],
    status: "Published",
    revision: "Rev 2",
  },
  {
    id: "qt-10",
    name: "Incoming Material QC",
    products: ["Piston Ring"],
    status: "Draft",
    revision: "Rev 1",
  },
  {
    id: "qt-11",
    name: "Weld Inspection Checklist",
    products: ["Structural Frame"],
    status: "Published",
    revision: "Rev 1",
  },
  {
    id: "qt-12",
    name: "Surface Finish QC",
    products: ["Panel Assembly"],
    status: "Draft",
    revision: "Rev 1",
  },
];

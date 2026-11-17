export type GroupStatus = "Active" | "Draft" | "Inactive";
export type ProductStatus = "Active" | "Inactive" | "Draft";
export type EntityStatus = string;

export interface ProductionLineGroup {
  id: string;
  groupCode: string;
  groupName: string;
  productionLines: number;
  status: EntityStatus;
}

export interface ProductNode {
  id: string;
  code: string;
  name: string;
  status: EntityStatus;
  groups: ProductionLineGroup[];
}

export interface LineItem {
  id: string;
  code: string;
  name: string;
  efficiency: number;
  status: EntityStatus;
}

export interface PartItem {
  id: string;
  number: string;
  name: string;
  back_number: string;
  model: string;
  cycle_time: number;
  spm: number;
  status: EntityStatus;
}

export interface AssemblyPartItem {
  id: string;
  number: number;
  name: string;
  usage: number;
  status: EntityStatus;
}
export type ProductStructureSelection =
  | { level: "product"; productId: string }
  | { level: "group"; productId: string; groupId: string }
  | { level: "line"; productId: string; groupId: string; lineId: string }
  | {
      level: "part";
      productId: string;
      groupId: string;
      lineId: string;
      partId: string;
    };

export const DUMMY_PRODUCTS: ProductNode[] = [
  {
    id: "PRD-001",
    code: "PRD-001",
    name: "Clutch Cover Assembly",
    status: "Active",
    groups: [
      {
        id: "g1",
        groupCode: "ASCC",
        groupName: "Main Assembly Group",
        productionLines: 3,
        status: "Active",
      },
      {
        id: "g2",
        groupCode: "SACC",
        groupName: "Sub Assembly Group",
        productionLines: 2,
        status: "Active",
      },
      {
        id: "g3",
        groupCode: "MADS",
        groupName: "Quality Control Group",
        productionLines: 1,
        status: "Draft",
      },
    ],
  },
  {
    id: "PRD-002",
    code: "PRD-002",
    name: "Titan Engine Block",
    status: "Active",
    groups: [
      {
        id: "g4",
        groupCode: "TEBM",
        groupName: "Machining Group",
        productionLines: 4,
        status: "Active",
      },
      {
        id: "g5",
        groupCode: "TEBA",
        groupName: "Assembly Group",
        productionLines: 2,
        status: "Active",
      },
    ],
  },
  {
    id: "PRD-003",
    code: "PRD-003",
    name: "Quantum Rotor S",
    status: "Active",
    groups: [
      {
        id: "g6",
        groupCode: "QRSB",
        groupName: "Balancing Group",
        productionLines: 1,
        status: "Draft",
      },
    ],
  },
  {
    id: "PRD-004",
    code: "PRD-004",
    name: "Altimeda Gearbox",
    status: "Draft",
    groups: [
      {
        id: "g7",
        groupCode: "AGBM",
        groupName: "Main Assembly Group",
        productionLines: 2,
        status: "Active",
      },
    ],
  },
  {
    id: "PRD-005",
    code: "PRD-005",
    name: "Atlas Compressor",
    status: "Active",
    groups: [
      {
        id: "g8",
        groupCode: "ACMP",
        groupName: "Assembly Group",
        productionLines: 3,
        status: "Active",
      },
      {
        id: "g9",
        groupCode: "ACQC",
        groupName: "Quality Control Group",
        productionLines: 1,
        status: "Inactive",
      },
    ],
  },
  {
    id: "PRD-006",
    code: "PRD-006",
    name: "Brake Disc Assembly",
    status: "Active",
    groups: [
      {
        id: "g10",
        groupCode: "BDAM",
        groupName: "Main Assembly Group",
        productionLines: 2,
        status: "Active",
      },
    ],
  },
];

export const DUMMY_LINE: LineItem[] = [
  {
    id: "ASCC 01",
    code: "ASCC 01",
    name: "Main Assembly Line 1",
    efficiency: 26,
    status: "Active",
  },
  {
    id: "ASCC 02",
    code: "ASCC 02",
    name: "Main Assembly Line 2",
    efficiency: 60,
    status: "Active",
  },
  {
    id: "ASCC 03",
    code: "ASCC 03",
    name: "Testing Line",
    efficiency: 87,
    status: "Active",
  },
];

export const DUMMY_PART: PartItem[] = [
  {
    id: "PN-001",
    number: "PN-001",
    name: "Hydraulic Cylinder Assembly",
    back_number: "93213",
    model: "Titan Engine X",
    cycle_time: 45,
    spm: 112,
    status: "Active",
  },
  {
    id: "PN-002",
    number: "PN-002",
    name: "Drive Shaft Coupling Unit",
    back_number: "76764",
    model: "Quantum Rotor",
    cycle_time: 32,
    spm: 87,
    status: "Active",
  },
  {
    id: "PN-003",
    number: "PN-003",
    name: "Precision Bearing Housing",
    back_number: "12947",
    model: "Compressor",
    cycle_time: 28,
    spm: 164,
    status: "Active",
  },
];

export const DUMMY_ASSEMBLY_PART: AssemblyPartItem[] = [
  {
    id: "4321134",
    number: 4321134,
    name: "Front Disc Plate",
    usage: 2,
    status: "Active",
  },
  {
    id: "352359",
    number: 352359,
    name: "Friction Lining Set",
    usage: 7,
    status: "Active",
  },
  {
    id: "136467",
    number: 136467,
    name: "Rivet Pin Assembly",
    usage: 1,
    status: "Active",
  },
];

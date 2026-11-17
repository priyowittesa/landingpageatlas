import {
  FormulaPillItem,
  FormulaVersionEntry,
} from "./components/FormulaHistoryPanel";

export type StatusValue =
  | "Active"
  | "Normal"
  | "Warning"
  | "NG"
  | "Draft"
  | "Scheduled";

export interface LineUsage {
  line: string;
  status: StatusValue;
  description: string;
  futureNote?: string;
}

export interface FormulaVersionRow {
  id: string;
  scope: string;
  scopeType: string;
  formula: string;
  effectiveLabel?: string;
  effectiveDate: string;
  updatedBy: string;
  status: StatusValue;
}

export const LINE_USAGE: LineUsage[] = [
  {
    line: "ASCC 01",
    status: "Normal",
    description: "Global default v3, 197%",
    futureNote: "From 1 Oct 2026: ASCC group v1",
  },
  { line: "ASCC 02", status: "Warning", description: "ASCC 02 v2 (own), 270%" },
  {
    line: "ASCC 03",
    status: "Normal",
    description: "Global default v3, 146%",
    futureNote: "From 1 Oct 2026: ASCC group v1",
  },
  {
    line: "ASCC 05",
    status: "Warning",
    description: "Global default v3, 299%",
    futureNote: "From 1 Oct 2026: ASCC group v1",
  },
  {
    line: "ASCC 12",
    status: "Normal",
    description: "Global default v3, 197%",
    futureNote: "From 1 Oct 2026: ASCC group v1",
  },
  { line: "SACC 01", status: "Normal", description: "Global default v3, 143%" },
  { line: "SACC 02", status: "NG", description: "Global default v3, 333%" },
  {
    line: "MADS 01",
    status: "Normal",
    description: "MADS 01 v1 (own), 79%",
    futureNote: "From 1 Oct 2026: ASCC group v1",
  },
];

export const SCOPES = [
  "SACC 01",
  "ASCC",
  "Global default",
  "ASCC 02",
  "MADS",
  "ASCC 03",
  "SACC 02",
  "ASCC 05",
];

export const FORMULA_VERSIONS: FormulaVersionRow[] = [
  {
    id: "fv-1",
    scope: "SACC 01",
    scopeType: "Line",
    formula:
      "MIN(Working days × Shifts per day × Hours per shift × 3,600 ÷ Cycle time × Efficiency, Man-hours available × 60 ÷ Standard labor time)",
    effectiveLabel: "Planned",
    effectiveDate: "1 Nov 2026",
    updatedBy: "David L.",
    status: "Draft",
  },
  {
    id: "fv-2",
    scope: "ASCC",
    scopeType: "Line group",
    formula:
      "(Working days × Shifts per day × Hours per shift + Overtime hours) × 3,600 ÷ Cycle time × Efficiency",
    effectiveDate: "1 Oct 2026",
    updatedBy: "Sophia P.",
    status: "Scheduled",
  },
  {
    id: "fv-3",
    scope: "Global default",
    scopeType: "Applies to every line",
    formula:
      "Working days × Shifts per day × Hours per shift × 3,600 ÷ Cycle time × Efficiency",
    effectiveDate: "1 Jan 2026",
    updatedBy: "Maria G.",
    status: "Active",
  },
  {
    id: "fv-4",
    scope: "ASCC 02",
    scopeType: "Line",
    formula:
      "(Working days × Shifts per day × Hours per shift − Planned downtime) × 3,600 ÷ Cycle time × Efficiency",
    effectiveDate: "1 Jul 2026",
    updatedBy: "Alexander V.",
    status: "Active",
  },
  {
    id: "fv-5",
    scope: "MADS",
    scopeType: "Line",
    formula: "Man-hours available × 60 ÷ Standard labor time",
    effectiveDate: "1 Mar 2026",
    updatedBy: "Sophia P.",
    status: "Active",
  },
  ...Array.from({ length: 11 }, (_, i) => {
    const statuses: StatusValue[] = ["Active", "Scheduled", "Draft"];
    return {
      id: `fv-${i + 6}`,
      scope: SCOPES[i % SCOPES.length],
      scopeType: i % 3 === 0 ? "Line group" : "Line",
      formula:
        "Working days × Shifts per day × Hours per shift × 3,600 ÷ Cycle time × Efficiency",
      effectiveDate: `1 ${["Feb", "Apr", "May", "Jun", "Aug", "Sep"][i % 6]} 2026`,
      updatedBy: ["Maria G.", "David L.", "Sophia P.", "Alexander V."][i % 4],
      status: statuses[i % statuses.length],
    };
  }),
];

export const pill = (
  kind: FormulaPillItem["kind"],
  label: string,
  unit?: string,
): FormulaPillItem => ({
  kind,
  label,
  unit,
});

export const HISTORY_DATA: Record<string, FormulaVersionEntry[]> = {
  "ASCC 02": [
    {
      version: "v2",
      title: "Standard machine capacity",
      inEffect: true,
      since: "1 Feb 2026",
      updatedBy: "Maria G.",
      updatedDate: "18 Feb 2026",
      pills: [
        pill("operator", "("),
        pill("variable", "Working days", "day"),
        pill("operator", "x"),
        pill("variable", "Shift per day", "shift/day"),
        pill("operator", "x"),
        pill("variable", "Hours per shift", "h/shift"),
        pill("operator", "-"),
        pill("variable", "Planned downtime", "h"),
        pill("operator", ")"),
        pill("operator", "x"),
        pill("constant", "3,600", "s/h"),
        pill("operator", "÷"),
        pill("variable", "Cycle time", "s/pcs"),
        pill("operator", "x"),
        pill("variable", "Efficiency"),
      ],
    },
    {
      version: "v1",
      title: "Standard machine capacity",
      since: "1 Jan 2025",
      updatedBy: "Toto",
      updatedDate: "18 Dec 2025",
      pills: [
        pill("variable", "Working days", "day"),
        pill("operator", "x"),
        pill("variable", "Shift per day", "shift/day"),
        pill("operator", "x"),
        pill("variable", "Hours per shift", "h/shift"),
        pill("operator", "x"),
        pill("constant", "3,600", "s/h"),
        pill("operator", "+"),
        pill("variable", "Cycle time", "s/pcs"),
        pill("operator", "x"),
        pill("variable", "Efficiency"),
        pill("operator", "x"),
        pill("variable", "Parallel stations"),
      ],
    },
  ],
};

export const DEFAULT_PILLS: FormulaPillItem[] = [
  pill("variable", "Working days", "day"),
  pill("operator", "x"),
  pill("variable", "Shift per day", "shift/day"),
  pill("operator", "x"),
  pill("variable", "Hours per shift", "h/shift"),
  pill("operator", "x"),
  pill("constant", "3,600", "s/h"),
  pill("operator", "÷"),
  pill("variable", "Cycle time", "s/pcs"),
  pill("operator", "x"),
  pill("variable", "Efficiency"),
];

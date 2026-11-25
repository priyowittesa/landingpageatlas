"use client";

import { Tr } from "./Tr";
import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TableColumn, TableFilter } from "@/types/type";
import { formatDate, formatDateRange, formatPercent } from "../format";
import { filterInspectionRows, filterScopeRows, getContractOptions } from "../selectors";
import type { ScopeStatus, ServiceInspectionRow, ServiceScopeRow } from "../types";
import { StatusBadge, type StatusTone } from "./StatusBadge";

const ALL = "all";
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const STATUS: Record<ScopeStatus, { tone: StatusTone; label: string }> = {
  compliant: { tone: "good", label: "Compliant" },
  short: { tone: "watch", label: "Short" },
  "not-done": { tone: "bad", label: "Not carried out" }
};

const GROUP_OPTIONS = [
  { label: "All frequencies", value: ALL },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" }
];

const SCOPE_COLUMNS: TableColumn<ServiceScopeRow>[] = [
  {
    key: "item",
    header: <Tr>Scope item</Tr>,
    render: (row) => (
      <div className="min-w-64">
        <div className="font-medium">
          {row.scopeNo}. {row.scopeItem}
        </div>
        {row.scopeSource && (
          <div className="max-w-72 text-xs text-muted-foreground">{row.scopeSource}</div>
        )}
      </div>
    )
  },
  {
    key: "contract",
    header: <Tr>Contract</Tr>,
    render: (row) => (
      <div>
        <div className="font-semibold">{row.contractId}</div>
        <div className="text-xs text-muted-foreground">{row.customer}</div>
      </div>
    )
  },
  { key: "group", header: <Tr>Frequency</Tr>, render: (row) => (row.group === "weekly" ? "Weekly" : "Monthly") },
  {
    key: "period",
    header: <Tr>Period</Tr>,
    className: "whitespace-nowrap",
    render: (row) => formatDateRange(row.periodStart, row.periodEnd)
  },
  { key: "required", header: <Tr>Required</Tr>, className: "text-right", render: (row) => row.required },
  { key: "done", header: <Tr>Done</Tr>, className: "text-right", render: (row) => row.done },
  {
    key: "overdue",
    header: <Tr>Overdue</Tr>,
    className: "text-right",
    render: (row) =>
      row.overdue > 0 ? <span className="font-semibold text-destructive">{row.overdue}</span> : 0
  },
  { key: "upcoming", header: <Tr>Scheduled</Tr>, className: "text-right", render: (row) => row.upcoming },
  {
    key: "compliance",
    header: <Tr>Compliance</Tr>,
    className: "text-right whitespace-nowrap",
    render: (row) => formatPercent(row.compliance, 2)
  },
  {
    key: "status",
    header: <Tr>Status</Tr>,
    render: (row) => <StatusBadge tone={STATUS[row.status].tone} label={STATUS[row.status].label} />
  },
];

const INSPECTION_COLUMNS: TableColumn<ServiceInspectionRow>[] = [
  { key: "inspectionDate", header: <Tr>Date</Tr>, className: "whitespace-nowrap", render: (row) => formatDate(row.inspectionDate) },
  {
    key: "contract",
    header: <Tr>Contract</Tr>,
    render: (row) => (
      <div>
        <div className="font-semibold">{row.contractId}</div>
        <div className="text-xs text-muted-foreground">{row.customer}</div>
      </div>
    )
  },
  {
    key: "item",
    header: <Tr>Scope item</Tr>,
    render: (row) => (
      <div className="min-w-56">
        <div className="font-medium">
          {row.scopeNo}. {row.scopeItem}
        </div>
        <div className="text-xs text-muted-foreground">{row.assetArea}</div>
      </div>
    )
  },
  {
    key: "checks",
    header: <Tr>Checks</Tr>,
    render: (row) =>
      row.timing === "scheduled" ? (
        <span className="text-muted-foreground">-</span>
      ) : row.failedChecks.length === 0 ? (
        <StatusBadge tone="good" label="All OK" />
      ) : (
        <StatusBadge tone="bad" label={`Failed: ${row.failedChecks.join(", ")}`} />
      )
  },
  { key: "measurement", header: <Tr>Measurement</Tr>, className: "whitespace-nowrap", render: (row) => row.measurement ?? "-" },
  {
    key: "finding",
    header: <Tr>Finding and follow-up</Tr>,
    render: (row) =>
      row.finding ? (
        <div className="min-w-56">
          <div>{row.finding}</div>
          <div className="text-xs text-muted-foreground">{row.followUp ?? "No follow-up recorded"}</div>
        </div>
      ) : (
        "-"
      )
  },
  { key: "witness", header: <Tr>Witness</Tr>, render: (row) => row.witness ?? "-" },
  {
    key: "timing",
    header: <Tr>Status</Tr>,
    render: (row) =>
      row.timing === "scheduled" ? (
        <Badge variant="secondary" className="gap-1.5">
          <CalendarClock size={16} aria-hidden />
          <Tr>Scheduled</Tr>
        </Badge>
      ) : (
        <StatusBadge tone="good" label="Done" />
      )
  }
];

type ServiceTablesProps = {
  scope: ServiceScopeRow[];
  inspections: ServiceInspectionRow[];
};

export function ServiceTables({ scope, inspections }: ServiceTablesProps) {
  return (
    <Tabs defaultValue="scope" className="space-y-4">
      <TabsList>
        <TabsTrigger value="scope" className="text-gray-700">
          Scope ({scope.length})
        </TabsTrigger>
        <TabsTrigger value="inspections" className="text-gray-700">
          Inspections ({inspections.length})
        </TabsTrigger>
      </TabsList>
      <TabsContent value="scope">
        <ScopeTable rows={scope} />
      </TabsContent>
      <TabsContent value="inspections">
        <InspectionsTable rows={inspections} />
      </TabsContent>
    </Tabs>
  );
}

function ScopeTable({ rows }: { rows: ServiceScopeRow[] }) {
  const [contract, setContract] = useState(ALL);
  const [group, setGroup] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => filterScopeRows(rows, { contract, group, status }),
    [rows, contract, group, status]
  );
  const reset = (apply: (value: string) => void) => (value: string) => {
    apply(value);
    setPage(1);
  };
  const filters: TableFilter[] = [
    {
      key: "contract",
      placeholder: "Contract",
      value: contract,
      onChange: reset(setContract),
      options: [
        { label: "All contracts", value: ALL },
        ...contractOptions(rows)
      ]
    },
    { key: "group", placeholder: "Frequency", value: group, onChange: reset(setGroup), options: GROUP_OPTIONS },
    {
      key: "status",
      placeholder: "Status",
      value: status,
      onChange: reset(setStatus),
      options: [
        { label: "All statuses", value: ALL },
        ...Object.entries(STATUS).map(([value, item]) => ({ label: item.label, value }))
      ]
    }
  ];

  return (
    <Table
      name="scope item"
      columns={SCOPE_COLUMNS}
      data={filtered.slice((page - 1) * pageSize, page * pageSize)}
      getRowId={(row) => row.scopeId}
      filters={filters}
      onResetFilters={() => {
        setContract(ALL);
        setGroup(ALL);
        setStatus(ALL);
        setPage(1);
      }}
      emptyState={{ description: "No scope item matches the filters." }}
      pagination={{
        page,
        pageSize,
        totalEntries: filtered.length,
        onPageChange: setPage,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPage(1);
        }
      }}
    />
  );
}

const RESULT_OPTIONS = [
  { label: "All results", value: ALL },
  { label: "Clean", value: "clean" },
  { label: "With finding", value: "finding" },
  { label: "Scheduled", value: "scheduled" }
];

function InspectionsTable({ rows }: { rows: ServiceInspectionRow[] }) {
  const [contract, setContract] = useState(ALL);
  const [group, setGroup] = useState(ALL);
  const [result, setResult] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => filterInspectionRows(rows, { contract, group, result }),
    [rows, contract, group, result]
  );
  const reset = (apply: (value: string) => void) => (value: string) => {
    apply(value);
    setPage(1);
  };
  const filters: TableFilter[] = [
    {
      key: "contract",
      placeholder: "Contract",
      value: contract,
      onChange: reset(setContract),
      options: [{ label: "All contracts", value: ALL }, ...contractOptions(rows)]
    },
    { key: "group", placeholder: "Frequency", value: group, onChange: reset(setGroup), options: GROUP_OPTIONS },
    { key: "result", placeholder: "Result", value: result, onChange: reset(setResult), options: RESULT_OPTIONS }
  ];

  return (
    <Table
      name="inspection"
      columns={INSPECTION_COLUMNS}
      data={filtered.slice((page - 1) * pageSize, page * pageSize)}
      getRowId={(row) => row.inspectionId}
      filters={filters}
      onResetFilters={() => {
        setContract(ALL);
        setGroup(ALL);
        setResult(ALL);
        setPage(1);
      }}
      emptyState={{ description: "No inspection matches the filters." }}
      pagination={{
        page,
        pageSize,
        totalEntries: filtered.length,
        onPageChange: setPage,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPage(1);
        }
      }}
    />
  );
}

function contractOptions(rows: { contractId: string }[]) {
  return getContractOptions(rows).map((id) => ({ label: id, value: id }));
}

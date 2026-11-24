"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown } from "lucide-react";
import Table from "@/components/Table";
import { cn } from "@/lib/utils";
import type { TableColumn, TableFilter } from "@/types/type";
import { formatPoints } from "../format";
import { HEALTH_LABELS, STATUS_GROUP_LABELS } from "../labels";
import {
  filterPortfolioRows,
  getCustomerOptions,
  sortPortfolioRows,
  type PortfolioSortKey
} from "../selectors";
import type { PortfolioRow } from "../types";
import { PercentText } from "./PercentText";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";
import { HEALTH_TONE } from "./status";

const ALL = "all";
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const SORT_KEYS: PortfolioSortKey[] = [
  "project",
  "customer",
  "contractValue",
  "plan",
  "actual",
  "deviation",
  "stage",
  "exceptions",
  "health"
];

function isSortKey(key: string | null): key is PortfolioSortKey {
  return SORT_KEYS.some((item) => item === key);
}

const RAW_COLUMNS: TableColumn<PortfolioRow>[] = [
  {
    key: "project",
    header: "Project",
    sortable: true,
    render: (row) => (
      <div className="min-w-32">
        <div className="font-semibold">{row.projectId}</div>
        <div
          className="line-clamp-2 max-w-56 whitespace-normal text-xs text-muted-foreground"
          title={row.description}
        >
          {row.description}
        </div>
      </div>
    )
  },
  { key: "customer", header: "Customer", sortable: true },
  {
    key: "contractValue",
    header: "Contract value",
    sortable: true,
    className: "text-right whitespace-nowrap",
    render: (row) => <RupiahText value={row.contractValue} />
  },
  {
    key: "plan",
    header: "Plan %",
    sortable: true,
    className: "text-right whitespace-nowrap",
    render: (row) => <PercentText fraction={row.plan} />
  },
  {
    key: "actual",
    header: "Actual %",
    sortable: true,
    className: "text-right whitespace-nowrap",
    render: (row) => <PercentText fraction={row.actual} />
  },
  {
    key: "deviation",
    header: "Deviation",
    sortable: true,
    className: "text-right whitespace-nowrap",
    render: (row) =>
      row.deviationPts === null ? (
        "-"
      ) : (
        <span
          className={
            row.deviationAlert
              ? "inline-flex items-center gap-1 font-semibold text-destructive"
              : undefined
          }
        >
          {row.deviationAlert && <TrendingDown size={16} aria-hidden />}
          {formatPoints(row.deviationPts)}
        </span>
      )
  },
  {
    key: "stage",
    header: "Lifecycle stage",
    sortable: true,
    className: "min-w-24 max-w-28 whitespace-normal",
    render: (row) => row.stageLabel
  },
  {
    key: "exceptions",
    header: "Exceptions",
    sortable: true,
    className: "text-right",
    render: (row) => row.exceptionCount
  },
  {
    key: "health",
    header: "Health",
    sortable: true,
    render: (row) => (
      <div className="min-w-36 space-y-1">
        <StatusBadge
          tone={HEALTH_TONE[row.health.rating]}
          label={HEALTH_LABELS[row.health.rating]}
        />
        <div
          className="max-w-36 truncate text-xs text-muted-foreground"
          title={row.health.reason}
        >
          {row.health.reason}
        </div>
      </div>
    )
  }
];

/** Tight cell padding so every column, health included, fits next to the sidebar. */
const COLUMNS: TableColumn<PortfolioRow>[] = RAW_COLUMNS.map((column) => ({
  ...column,
  className: cn("px-2", column.className)
}));

type PortfolioTableProps = {
  rows: PortfolioRow[];
};

export function PortfolioTable({ rows }: PortfolioTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState(ALL);
  const [statusGroup, setStatusGroup] = useState(ALL);
  const [health, setHealth] = useState(ALL);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => filterPortfolioRows(rows, { search, customer, statusGroup, health }),
    [rows, search, customer, statusGroup, health]
  );
  const sorted = useMemo(
    () => sortPortfolioRows(filtered, isSortKey(sortKey) ? sortKey : null, sortDir),
    [filtered, sortKey, sortDir]
  );
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const withReset = (apply: (value: string) => void) => (value: string) => {
    apply(value);
    setPage(1);
  };

  const filters: TableFilter[] = [
    {
      key: "customer",
      placeholder: "Customer",
      value: customer,
      onChange: withReset(setCustomer),
      options: [
        { label: "All customers", value: ALL },
        ...getCustomerOptions(rows).map((name) => ({ label: name, value: name }))
      ]
    },
    {
      key: "statusGroup",
      placeholder: "Status group",
      value: statusGroup,
      onChange: withReset(setStatusGroup),
      options: [
        { label: "All status groups", value: ALL },
        ...Object.entries(STATUS_GROUP_LABELS).map(([value, label]) => ({ label, value }))
      ]
    },
    {
      key: "health",
      placeholder: "Health",
      value: health,
      onChange: withReset(setHealth),
      options: [
        { label: "All health ratings", value: ALL },
        ...Object.entries(HEALTH_LABELS).map(([value, label]) => ({ label, value }))
      ]
    }
  ];

  const resetFilters = () => {
    setCustomer(ALL);
    setStatusGroup(ALL);
    setHealth(ALL);
    setPage(1);
  };

  return (
    <Table
      name="project"
      columns={COLUMNS}
      data={pageRows}
      getRowId={(row) => row.projectId}
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Search project, customer or description"
      filters={filters}
      onResetFilters={resetFilters}
      sortKey={sortKey}
      sortDir={sortDir}
      onSortChange={(key, dir) => {
        setSortKey(key);
        setSortDir(dir);
      }}
      onRowClick={(row) => router.push(`/ptepi/project/${row.projectId}`)}
      emptyState={{ description: "No project matches the current filters." }}
      pagination={{
        page,
        pageSize,
        totalEntries: sorted.length,
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

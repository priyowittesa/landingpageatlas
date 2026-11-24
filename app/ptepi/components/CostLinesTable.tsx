"use client";

import { useMemo, useState } from "react";
import Table from "@/components/Table";
import type { TableColumn, TableFilter } from "@/types/type";
import { formatDate } from "../format";
import { getCostCategoryOptions } from "../selectors";
import type { CostLineRow } from "../types";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";

const ALL = "all";
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const dash = (value: string | null) => value ?? "-";

const COLUMNS: TableColumn<CostLineRow>[] = [
  {
    key: "item",
    header: "Item",
    render: (row) => (
      <div className="min-w-56">
        <div className="font-medium">{row.item}</div>
        <div className="text-xs text-muted-foreground">{row.category}</div>
        {row.note && <div className="max-w-64 text-xs text-muted-foreground">{row.note}</div>}
      </div>
    )
  },
  { key: "executor", header: "Executor", render: (row) => <span className="whitespace-nowrap">{row.executor}</span> },
  { key: "method", header: "Method", render: (row) => row.method },
  { key: "prNo", header: "PR", className: "whitespace-nowrap", render: (row) => dash(row.prNo) },
  { key: "poNo", header: "PO", className: "whitespace-nowrap", render: (row) => dash(row.poNo) },
  { key: "sesNo", header: "SES", className: "whitespace-nowrap", render: (row) => dash(row.sesNo) },
  {
    key: "advanceNo",
    header: "Advance (kas uang muka)",
    className: "whitespace-nowrap",
    render: (row) => dash(row.advanceNo)
  },
  {
    key: "transactionDate",
    header: "Transaction date",
    className: "whitespace-nowrap",
    render: (row) => formatDate(row.transactionDate)
  },
  {
    key: "amount",
    header: "Amount",
    className: "text-right whitespace-nowrap",
    render: (row) => <RupiahText value={row.amount} />
  },
  {
    key: "paymentStatus",
    header: "Payment status",
    render: (row) => (
      <StatusBadge
        tone={row.paymentStatus === "Posted" ? "good" : "watch"}
        label={row.paymentStatus}
      />
    )
  },
  { key: "sapDocNo", header: "SAP doc no.", className: "whitespace-nowrap", render: (row) => dash(row.sapDocNo) },
  {
    key: "flags",
    header: "Flags",
    render: (row) =>
      row.flags.length === 0 ? (
        <span className="text-muted-foreground">-</span>
      ) : (
        <div className="min-w-52 space-y-1">
          {row.flags.map((flag) => (
            <div key={flag.code}>
              <StatusBadge tone={flag.severity === "high" ? "bad" : "watch"} label={flag.label} />
            </div>
          ))}
        </div>
      )
  }
];

type CostLinesTableProps = {
  lines: CostLineRow[];
};

/** Re-mount with a new key when the project changes, so the filter and page reset. */
export function CostLinesTable({ lines }: CostLinesTableProps) {
  const [category, setCategory] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => lines.filter((line) => category === ALL || line.category === category),
    [lines, category]
  );

  const filters: TableFilter[] = [
    {
      key: "category",
      placeholder: "RAP category",
      value: category,
      onChange: (value) => {
        setCategory(value);
        setPage(1);
      },
      options: [
        { label: "All categories", value: ALL },
        ...getCostCategoryOptions(lines).map((name) => ({ label: name, value: name }))
      ]
    }
  ];

  return (
    <Table
      name="cost line"
      columns={COLUMNS}
      data={filtered.slice((page - 1) * pageSize, page * pageSize)}
      getRowId={(row) => `${row.projectId}-${row.lineNo}`}
      filters={filters}
      onResetFilters={() => {
        setCategory(ALL);
        setPage(1);
      }}
      emptyState={{ description: "No cost line matches the selected category." }}
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

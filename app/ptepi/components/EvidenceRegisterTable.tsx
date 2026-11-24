"use client";

import { useMemo, useState } from "react";
import Table from "@/components/Table";
import type { TableColumn } from "@/types/type";
import type { RegisterRow } from "../types";
import { StatusBadge } from "./StatusBadge";
import { SyntheticDataBadge } from "./SyntheticDataBadge";

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function RegisterStatus({ status }: { status: string }) {
  if (status === "Signed") return <StatusBadge tone="good" label="Signed" />;
  if (status === "Draft") return <StatusBadge tone="watch" label="Draft, unsigned" />;
  return <StatusBadge tone="bad" label="Missing" />;
}

const COLUMNS: TableColumn<RegisterRow>[] = [
  {
    key: "document",
    header: "Document",
    render: (row) => (
      <div className="min-w-48">
        <div className="font-medium">{row.documentType}</div>
        <div className="max-w-64 truncate text-xs text-muted-foreground" title={row.documentNo ?? ""}>
          {row.documentNo ?? "No number"}
        </div>
        <div className="mt-1">
          <SyntheticDataBadge real={row.dataOrigin === "real"} />
        </div>
      </div>
    )
  },
  {
    key: "scope",
    header: "Component or stage",
    render: (row) => row.component ?? row.relatedStage ?? "-"
  },
  { key: "documentDate", header: "Date", className: "whitespace-nowrap", render: (row) => row.documentDate ?? "-" },
  {
    key: "customerSigner",
    header: "Customer signer",
    render: (row) => row.customerSigner ?? "-"
  },
  { key: "epiSigner", header: "EPI signer", render: (row) => row.epiSigner ?? "-" },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <div className="min-w-36 space-y-1">
        <RegisterStatus status={row.status} />
        {row.note && <div className="max-w-56 text-xs text-muted-foreground">{row.note}</div>}
      </div>
    )
  },

];

type EvidenceRegisterTableProps = {
  rows: RegisterRow[];
};

export function EvidenceRegisterTable({ rows }: EvidenceRegisterTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(
      (row) =>
        query === "" ||
        `${row.documentType} ${row.documentNo ?? ""} ${row.component ?? ""} ${row.status}`
          .toLowerCase()
          .includes(query)
    );
  }, [rows, search]);

  return (
    <Table
      name="BA record"
      columns={COLUMNS}
      data={filtered.slice((page - 1) * pageSize, page * pageSize)}
      getRowId={(row) => row.baId}
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setPage(1);
      }}
      searchPlaceholder="Search document, number or status"
      emptyState={{ description: "No BA record matches the search." }}
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

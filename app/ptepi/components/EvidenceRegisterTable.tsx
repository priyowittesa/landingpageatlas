"use client";

import { Tr, useT } from "./Tr";
import { ExternalLink, FileText } from "lucide-react";
import { formatDate } from "../format";
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

/** The file behind a BA: a web link opens in a new tab; a repository path is shown as text. */
function FileLinkCell({ link }: { link: string | null }) {
  if (!link) return <span className="text-gray-600"><Tr>No file</Tr></span>;
  const name = link.split("/").pop() ?? link;
  if (link.startsWith("http://") || link.startsWith("https://")) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex max-w-52 items-center gap-1.5 text-primary-800 hover:underline"
        title={link}
      >
        <ExternalLink size={14} aria-hidden className="shrink-0" />
        <span className="truncate"><Tr>Open file</Tr></span>
      </a>
    );
  }
  return (
    <span className="inline-flex max-w-52 items-center gap-1.5 text-gray-800" title={link}>
      <FileText size={14} aria-hidden className="shrink-0 text-primary-700" />
      <span className="truncate">{name}</span>
    </span>
  );
}

const COLUMNS: TableColumn<RegisterRow>[] = [
  {
    key: "document",
    header: <Tr>Document</Tr>,
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
    header: <Tr>Component or stage</Tr>,
    render: (row) => row.component ?? row.relatedStage ?? "-"
  },
  { key: "documentDate", header: <Tr>Date</Tr>, className: "whitespace-nowrap", render: (row) => formatDate(row.documentDate) },
  {
    key: "customerSigner",
    header: <Tr>Customer signer</Tr>,
    render: (row) => row.customerSigner ?? "-"
  },
  { key: "epiSigner", header: <Tr>EPI signer</Tr>, render: (row) => row.epiSigner ?? "-" },
  {
    key: "status",
    header: <Tr>Status</Tr>,
    render: (row) => (
      <div className="min-w-36 space-y-1">
        <RegisterStatus status={row.status} />
        {row.note && <div className="max-w-56 text-xs text-muted-foreground">{row.note}</div>}
      </div>
    )
  },
  { key: "fileLink", header: <Tr>File</Tr>, render: (row) => <FileLinkCell link={row.fileLink} /> }
];

type EvidenceRegisterTableProps = {
  rows: RegisterRow[];
};

export function EvidenceRegisterTable({ rows }: EvidenceRegisterTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const t = useT();

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
      searchPlaceholder={t("Search document, number or status")}
      emptyState={{ description: t("No BA record matches the search.") }}
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

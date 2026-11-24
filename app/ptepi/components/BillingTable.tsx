"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, FileSearch } from "lucide-react";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import type { TableColumn, TableFilter } from "@/types/type";
import { filterBillingRows, getCustomerOptions } from "../selectors";
import type { BillingReadiness, BillingRow, DocStatus } from "../types";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";

const ALL = "all";
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const READINESS_LABELS: Record<BillingReadiness, string> = {
  billable: "Billable now",
  blocked: "Blocked",
  invoiced: "Invoiced, awaiting payment",
  "not-due": "Not yet due"
};

const STAGE_TYPE_OPTIONS = ["Termin", "Pelunasan 95%", "Retensi 5%"];

const DOC_LABELS: Record<Exclude<DocStatus, "none">, string> = {
  signed: "BA signed",
  draft: "BA draft",
  missing: "BA missing"
};

function DocStatusBadge({ status }: { status: DocStatus }) {
  if (status === "none") return <span className="text-muted-foreground">-</span>;
  const tone = status === "signed" ? "good" : status === "draft" ? "watch" : "bad";
  return <StatusBadge tone={tone} label={DOC_LABELS[status]} />;
}

function ReadinessBadge({ readiness }: { readiness: BillingReadiness }) {
  if (readiness === "billable") {
    return <StatusBadge tone="good" label={READINESS_LABELS.billable} />;
  }
  if (readiness === "blocked") {
    return <StatusBadge tone="bad" label={READINESS_LABELS.blocked} />;
  }
  return (
    <Badge variant="secondary" className="gap-1.5">
      <Clock size={16} aria-hidden />
      {READINESS_LABELS[readiness]}
    </Badge>
  );
}

const COLUMNS: TableColumn<BillingRow>[] = [
  {
    key: "project",
    header: "Project",
    render: (row) => (
      <div className="min-w-28">
        <div className="font-semibold">{row.projectId}</div>
        <div className="text-xs text-muted-foreground">{row.customer}</div>
      </div>
    )
  },
  {
    key: "payment",
    header: "Payment",
    render: (row) => (
      <div className="min-w-44">
        <div className="font-medium">{row.stageType}</div>
        <div className="max-w-56 truncate text-xs text-muted-foreground" title={row.condition ?? ""}>
          {row.condition}
        </div>
      </div>
    )
  },
  {
    key: "amount",
    header: "Amount",
    className: "text-right whitespace-nowrap",
    render: (row) => <RupiahText value={row.amount} />
  },
  {
    key: "document",
    header: "Required BA",
    render: (row) => (
      <div className="min-w-40 space-y-1">
        <div className="text-sm">{row.requiredDocument ?? "Progress condition"}</div>
        {row.expectedSigner && (
          <div className="text-xs text-muted-foreground">Signer: {row.expectedSigner}</div>
        )}
        <DocStatusBadge status={row.docStatus} />
      </div>
    )
  },
  {
    key: "readiness",
    header: "Readiness",
    render: (row) => (
      <div className="min-w-48 space-y-1">
        <ReadinessBadge readiness={row.readiness} />
        {row.reason && (
          <div className="max-w-64 text-xs text-muted-foreground">{row.reason}</div>
        )}
        {row.readiness === "blocked" && (
          <Link
            href={`/ptepi/project/${row.projectId}/evidence`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            <FileSearch size={16} aria-hidden />
            View evidence
          </Link>
        )}
      </div>
    )
  },
];

type BillingTableProps = {
  rows: BillingRow[];
  /** Customer, payment stage and readiness filters; hide them for a single project */
  showFilters?: boolean;
};

export function BillingTable({ rows, showFilters = true }: BillingTableProps) {
  const router = useRouter();
  const [customer, setCustomer] = useState(ALL);
  const [stageType, setStageType] = useState(ALL);
  const [readiness, setReadiness] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(
    () => filterBillingRows(rows, { customer, stageType, readiness }),
    [rows, customer, stageType, readiness]
  );
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

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
      key: "stageType",
      placeholder: "Payment stage",
      value: stageType,
      onChange: withReset(setStageType),
      options: [
        { label: "All payment stages", value: ALL },
        ...STAGE_TYPE_OPTIONS.map((value) => ({ label: value, value }))
      ]
    },
    {
      key: "readiness",
      placeholder: "Readiness",
      value: readiness,
      onChange: withReset(setReadiness),
      options: [
        { label: "All readiness", value: ALL },
        ...Object.entries(READINESS_LABELS).map(([value, label]) => ({ label, value }))
      ]
    }
  ];

  return (
    <Table
      name="payment stage"
      columns={COLUMNS}
      data={pageRows}
      getRowId={(row) => row.paymentId}
      filters={showFilters ? filters : undefined}
      onResetFilters={() => {
        setCustomer(ALL);
        setStageType(ALL);
        setReadiness(ALL);
        setPage(1);
      }}
      onRowClick={(row) =>
        router.push(
          row.readiness === "blocked"
            ? `/ptepi/project/${row.projectId}/evidence`
            : `/ptepi/project/${row.projectId}`
        )
      }
      emptyState={{ description: "No payment stage matches the current filters." }}
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

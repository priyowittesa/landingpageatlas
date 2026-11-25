"use client";

import { Tr, useT } from "./Tr";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Clock, FileSearch } from "lucide-react";
import { formatDate } from "../format";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import type { TableColumn, TableFilter } from "@/types/type";
import { filterBillingRows, getCustomerOptions } from "../selectors";
import type { BillingReadiness, BillingRow, DocStatus } from "../types";
import { RupiahText } from "./RupiahText";
import { StatusBadge } from "./StatusBadge";
import { GlossaryTerm } from "./GlossaryTerm";

const ALL = "all";
const PAGE_SIZE_OPTIONS = [5, 10, 20];

const READINESS_LABELS: Record<BillingReadiness, string> = {
  billable: "Billable now",
  "awaiting-bast": "Due, awaiting BAST II",
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
  if (readiness === "awaiting-bast") {
    return <StatusBadge tone="watch" label={READINESS_LABELS["awaiting-bast"]} />;
  }
  if (readiness === "blocked") {
    return <StatusBadge tone="bad" label={READINESS_LABELS.blocked} />;
  }
  return (
    <Badge variant="secondary" className="gap-1.5">
      <Clock size={16} aria-hidden />
      <Tr>{READINESS_LABELS[readiness]}</Tr>
    </Badge>
  );
}

const COLUMNS: TableColumn<BillingRow>[] = [
  {
    key: "project",
    header: <Tr>Project</Tr>,
    render: (row) => (
      <div className="min-w-28">
        <div className="font-semibold">{row.projectId}</div>
        <div className="text-xs text-muted-foreground">{row.customer}</div>
      </div>
    )
  },
  {
    key: "payment",
    header: <Tr>Payment</Tr>,
    render: (row) => (
      <div className="min-w-44">
        <div className="font-medium"><GlossaryTerm>{row.stageType}</GlossaryTerm></div>
        <div className="max-w-56 truncate text-xs text-muted-foreground" title={row.condition ?? ""}>
          {row.condition}
        </div>
      </div>
    )
  },
  {
    key: "amount",
    header: <Tr>Amount</Tr>,
    className: "text-right whitespace-nowrap",
    render: (row) => <RupiahText value={row.amount} />
  },
  {
    key: "document",
    header: <Tr>Required BA</Tr>,
    render: (row) => (
      <div className="min-w-40 space-y-1">
        <div className="text-sm">{row.requiredDocument ? <GlossaryTerm>{row.requiredDocument}</GlossaryTerm> : <Tr>Progress condition</Tr>}</div>
        {row.expectedSigner && (
          <div className="text-xs text-muted-foreground">
            <Tr>Signer</Tr>: <Tr>{row.expectedSigner}</Tr>
          </div>
        )}
        <DocStatusBadge status={row.docStatus} />
      </div>
    )
  },
  {
    key: "readiness",
    header: <Tr>Readiness</Tr>,
    render: (row) => (
      <div className="min-w-48 space-y-1">
        <ReadinessBadge readiness={row.readiness} />
        {row.reason && (
          <div className="max-w-64 text-xs text-muted-foreground"><Tr>{row.reason}</Tr></div>
        )}
        {row.readiness === "blocked" && (
          <Link
            href={`/ptepi/project/${row.projectId}/evidence`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            <FileSearch size={16} aria-hidden />
            <Tr>View evidence</Tr>
          </Link>
        )}
      </div>
    )
  },
  {
    key: "invoice",
    header: <Tr>Invoice and payment</Tr>,
    render: (row) => <InvoiceCell row={row} />
  }
];

/** Invoice date, paid date and days outstanding (overdue in red with an icon and text). */
function InvoiceCell({ row }: { row: BillingRow }) {
  if (!row.invoiceDate) {
    return (
      <span className="text-xs text-gray-600">
        <Tr>Not invoiced</Tr>
      </span>
    );
  }
  return (
    <dl className="min-w-44 space-y-0.5 text-xs">
      <div className="flex gap-1.5">
        <dt className="text-muted-foreground"><Tr>Invoiced</Tr></dt>
        <dd className="font-medium tabular-nums">{formatDate(row.invoiceDate)}</dd>
      </div>
      <div className="flex gap-1.5">
        <dt className="text-muted-foreground"><Tr>Paid</Tr></dt>
        <dd className="font-medium tabular-nums">{row.paidDate ? formatDate(row.paidDate) : <Tr>Not yet</Tr>}</dd>
      </div>
      {!row.paidDate && (
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground"><Tr>Days outstanding</Tr></dt>
          <dd className="font-semibold tabular-nums">{row.daysOutstanding}</dd>
        </div>
      )}
      {!row.paidDate && row.daysOverdue > 0 && (
        <dd className="inline-flex items-center gap-1 font-semibold text-red-700">
          <AlertCircle size={12} aria-hidden />
          {row.daysOverdue} <Tr>days overdue</Tr>
        </dd>
      )}
    </dl>
  );
}

type BillingTableProps = {
  rows: BillingRow[];
  /** Customer, payment stage and readiness filters; hide them for a single project */
  showFilters?: boolean;
};

export function BillingTable({ rows, showFilters = true }: BillingTableProps) {
  const t = useT();
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
        { label: t("All customers"), value: ALL },
        ...getCustomerOptions(rows).map((name) => ({ label: name, value: name }))
      ]
    },
    {
      key: "stageType",
      placeholder: "Payment stage",
      value: stageType,
      onChange: withReset(setStageType),
      options: [
        { label: t("All payment stages"), value: ALL },
        ...STAGE_TYPE_OPTIONS.map((value) => ({ label: value, value }))
      ]
    },
    {
      key: "readiness",
      placeholder: "Readiness",
      value: readiness,
      onChange: withReset(setReadiness),
      options: [
        { label: t("All readiness"), value: ALL },
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

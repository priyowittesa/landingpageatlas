"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  LoaderCircle,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useTransactions,
  downloadTransactionReceipt,
  type TransactionItem
} from "@/components/settings/use-transactions";
import { TransactionDetailPanel } from "@/components/settings/TransactionDetailPanel";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "refunded", label: "Refunded" }
] as const;

type StatusValue = (typeof STATUS_OPTIONS)[number]["value"];

const STATUS_VARIANT: Record<string, "green" | "yellow" | "red" | "secondary"> =
  {
    paid: "green",
    pending: "yellow",
    expired: "red",
    refunded: "red",
    failed: "red",
    cancelled: "secondary"
  };

/** Formats an amount with the given ISO 4217 currency code. */
function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/** Returns a short, human-readable label for a payment method. */
function formatPaymentMethod(method: string): string {
  if (!method) return "—";
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Formats the transaction's line items into a single description string. */
function describeItems(items: TransactionItem["items"]): string {
  if (!items || items.length === 0) return "—";
  if (items.length === 1) return items[0].name || "—";
  return `${items[0].name} +${items.length - 1} more`;
}

/** Formats the created_at timestamp as "Billed on Sep 5, 2026". */
function formatBilledOn(iso: string): string {
  try {
    return `Billed on ${format(new Date(iso), "MMM d, yyyy")}`;
  } catch {
    return iso;
  }
}

export function PaymentHistorySettings() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusValue>("all");
  const [page, setPage] = useState(1);
  const [tokens, setTokens] = useState<string[]>([""]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      status: status === "all" ? undefined : status,
      page_size: PAGE_SIZE,
      page_token: tokens[page - 1] || undefined
    }),
    [status, page, tokens]
  );

  const transactionsQuery = useTransactions(filters);
  const totalCount = transactionsQuery.data?.total_count ?? 0;
  const nextPageToken = transactionsQuery.data?.next_page_token ?? "";

  // Client-side search across the fetched page (the API has no search param).
  const filtered = useMemo(() => {
    const items = transactionsQuery.data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) =>
        t.order_id.toLowerCase().includes(q) ||
        t.invoice_number.toLowerCase().includes(q) ||
        describeItems(t.items).toLowerCase().includes(q)
    );
  }, [transactionsQuery.data, query]);

  const resetFilters = (next: StatusValue) => {
    setStatus(next);
    setTokens([""]);
    setPage(1);
  };

  const goNext = () => {
    if (!nextPageToken) return;
    setTokens((current) => {
      const copy = [...current];
      copy[page] = nextPageToken;
      return copy;
    });
    setPage(page + 1);
  };

  const goPrev = () => {
    if (page === 1) return;
    setPage(page - 1);
  };

  const handleDownload = async (t: TransactionItem) => {
    setDownloadingId(t.id);
    try {
      await downloadTransactionReceipt(t.id, t.order_id || "receipt");
      toast.success("Download started", {
        description: `Receipt for ${t.order_id}`
      });
    } catch {
      toast.error("Download failed", {
        description: "Could not download the receipt. Please try again."
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const isLoading = transactionsQuery.isLoading;
  const isFetching = transactionsQuery.isFetching;
  const isError = transactionsQuery.isError;
  const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // When a transaction is selected, show the inline detail panel instead of the list.
  if (detailId) {
    return (
      <TransactionDetailPanel
        transactionId={detailId}
        onBack={() => setDetailId(null)}
      />
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-950">
            Payment History
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and view your recent transaction card reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={status}
            onChange={(e) => resetFilters(e.target.value as StatusValue)}
            className="h-9 w-[120px] appearance-none rounded-md border border-input bg-white pl-9 pr-8 text-sm"
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order id or invoice..."
            className="h-9 pl-9 text-sm"
            aria-label="Search invoices"
          />
        </div>
      </div>

      {/* Transaction list */}
      <div className="mt-6 flex flex-col gap-3">
        {filtered.map((t) => {
          const label = t.invoice_number
            ? `Invoice #${t.invoice_number}`
            : t.order_id;
          return (
            <Card
              key={t.id}
              className="flex items-center gap-4 rounded-lg border bg-white px-4 py-4 shadow-none transition-colors hover:border-gray-300"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {label}
                  </span>
                  <Badge variant={STATUS_VARIANT[t.status] ?? "secondary"}>
                    {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {describeItems(t.items)}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatBilledOn(t.created_at)}
                </p>
              </div>

              <div className="hidden text-right sm:block">
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(t.final_amount, t.currency)}
                </p>
                <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-gray-500">
                  <CreditCard className="h-3.5 w-3.5" />
                  {formatPaymentMethod(t.payment_method)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Download receipt"
                  disabled={downloadingId === t.id}
                  onClick={() => handleDownload(t)}
                >
                  {downloadingId === t.id ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  className="h-8 w-8"
                  aria-label="View invoice"
                  onClick={() => setDetailId(t.id)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          );
        })}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Loading transactions…
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-red-500">
            Unable to load transactions. Please try again.
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-500">
            No transactions match your filters.
          </div>
        )}
      </div>

      {/* Footer / pagination */}
      <div className="mt-6 flex items-center justify-between gap-4 border-t pt-4">
        <p className="text-xs text-gray-500">
          {totalCount > 0
            ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(
                page * PAGE_SIZE,
                totalCount
              )} of ${totalCount} transactions`
            : "0 transactions"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={page === 1 || isFetching}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-xs text-gray-500">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={!nextPageToken || isFetching}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, Download, LoaderCircle, Printer } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useTransaction,
  downloadTransactionReceipt,
  printTransactionReceipt,
} from "@/components/settings/use-transactions";

const STATUS_VARIANT: Record<
  string,
  "green" | "yellow" | "red" | "secondary"
> = {
  paid: "green",
  pending: "yellow",
  expired: "red",
  refunded: "red",
  failed: "red",
  cancelled: "secondary",
};

const EPOCH_ISO = "1970-01-01T00:00:00Z";

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatPaymentMethod(method: string): string {
  if (!method) return "—";
  return method
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(iso: string): string {
  if (!iso || iso === EPOCH_ISO) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy");
  } catch {
    return iso;
  }
}

function pretty(value: string): string {
  if (!value) return "—";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type TransactionDetailPanelProps = {
  transactionId: string;
  onBack: () => void;
};

export function TransactionDetailPanel({
  transactionId,
  onBack,
}: TransactionDetailPanelProps) {
  const { data: transaction, isLoading } = useTransaction(transactionId);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const handleDownload = async () => {
    if (!transaction) return;
    setDownloading(true);
    try {
      await downloadTransactionReceipt(
        transaction.id,
        transaction.order_id || "receipt"
      );
      toast.success("Download started", {
        description: `Receipt for ${transaction.order_id}`,
      });
    } catch {
      toast.error("Download failed", {
        description: "Could not download the receipt. Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!transaction) return;
    setPrinting(true);
    try {
      await printTransactionReceipt(transaction.id);
    } catch {
      toast.error("Print failed", {
        description: "Could not print the invoice. Please try again.",
      });
    } finally {
      setPrinting(false);
    }
  };

  if (isLoading || !transaction) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading transaction…
        </div>
      </div>
    );
  }

  const invoiceLabel = transaction.invoice_number
    ? `Invoice #${transaction.invoice_number}`
    : transaction.order_id;
  const isPaid =
    transaction.status === "paid" &&
    Boolean(transaction.paid_at) &&
    transaction.paid_at !== EPOCH_ISO;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Navigation Header Row */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Payment History
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={printing}
          >
            {printing ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            Print Invoice
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={downloading}>
            {downloading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PDF
          </Button>
        </div>
      </div>

      <Separator />

      {/* Invoice Main Info */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {invoiceLabel}
            </h2>
            <Badge variant={STATUS_VARIANT[transaction.status] ?? "secondary"}>
              {pretty(transaction.status)}
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            {describeItems(transaction.items)} —{" "}
            {pretty(transaction.type)} transaction record
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <p className="text-lg font-semibold text-gray-900">
            {formatCurrency(transaction.final_amount, transaction.currency)}
          </p>
          <p className="text-xs text-gray-500">
            {isPaid ? "Amount Paid" : "Amount Due"}
          </p>
        </div>
      </div>

      {/* Invoice Meta Cards */}
      <div className="flex gap-3">
        <MetaCard label="Invoice Date" value={formatDate(transaction.created_at)} />
        <MetaCard label="Paid At" value={formatDate(transaction.paid_at)} />
        <MetaCard
          label="Payment Method"
          value={formatPaymentMethod(transaction.payment_method)}
        />
        <MetaCard
          label="Billing Cycle"
          value={pretty(transaction.billing_cycle)}
        />
      </div>

      {/* Line items table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        {/* Header */}
        <div className="flex gap-4 bg-gray-50 px-4 py-3 text-xs font-medium text-gray-500">
          <p className="flex-1">Description</p>
          <p className="w-15 text-center">Qty</p>
          <p className="w-30 text-right">Unit Price</p>
          <p className="w-30 text-right">Amount</p>
        </div>
        {/* Rows */}
        {transaction.items?.length ? (
          transaction.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 border-t border-gray-100 px-4 py-4"
            >
              <div className="flex flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium text-gray-900">
                  {item.name || "—"}
                </p>
                {item.description && (
                  <p className="text-xs text-gray-500">{item.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  {pretty(item.item_type)}
                </p>
              </div>
              <p className="w-15 text-center text-sm text-gray-900">
                {item.quantity}
              </p>
              <p className="w-30 text-right text-sm text-gray-900">
                {formatCurrency(item.unit_price, transaction.currency)}
              </p>
              <p className="w-30 text-right text-sm font-semibold text-gray-900">
                {formatCurrency(item.amount, transaction.currency)}
              </p>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No items.
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="flex justify-end">
        <div className="flex w-[320px] flex-col gap-2.5">
          <SummaryRow
            label="Subtotal"
            value={formatCurrency(transaction.subtotal, transaction.currency)}
          />
          {transaction.discount_amount > 0 && (
            <SummaryRow
              label="Discount"
              value={`−${formatCurrency(
                transaction.discount_amount,
                transaction.currency
              )}`}
            />
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Total</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(transaction.final_amount, transaction.currency)}
            </p>
          </div>
          {isPaid && (
            <div className="flex items-center justify-between rounded-md bg-green-50 px-3 py-2 text-xs font-medium text-green-600">
              <span>Amount Paid</span>
              <span>
                {formatCurrency(transaction.final_amount, transaction.currency)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <p className="text-gray-500">{label}</p>
      <p className="text-gray-900">{value}</p>
    </div>
  );
}

function describeItems(
  items: { name: string }[]
): string {
  if (!items || items.length === 0) return "—";
  if (items.length === 1) return items[0].name || "—";
  return `${items[0].name} +${items.length - 1} more`;
}

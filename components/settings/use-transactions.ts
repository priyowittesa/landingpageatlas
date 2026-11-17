"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const TRANSACTIONS_URL = "/v1/portal/transactions";

export type TransactionItemLine = {
  id: string;
  item_type: string;
  reference_id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
};

export type TransactionItem = {
  id: string;
  order_id: string;
  invoice_number: string;
  type: string;
  status: string;
  billing_cycle: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  payment_method: string;
  provider: string;
  promo_code: string;
  paid_at: string;
  created_at: string;
  items: TransactionItemLine[];
};

export type TransactionsResponse = {
  items: TransactionItem[];
  next_page_token: string;
  total_count: number;
};

export type TransactionFilters = {
  status?: string;
  page_size: number;
  page_token?: string;
};

/** Fetches the tenant's billing transactions from GET /v1/portal/transactions. */
export function useTransactions(filters: TransactionFilters) {
  return useQuery<
    TransactionsResponse,
    AxiosError<ApiResponseError>
  >({
    queryKey: ["portal", "transactions", filters],
    queryFn: async () => {
      const res = await axios.get(TRANSACTIONS_URL, { params: filters });
      // This endpoint returns the payload directly ({ items, next_page_token,
      // total_count }) rather than wrapped in the standard { data: ... } envelope.
      const body = (res.data?.data ?? res.data) as Partial<TransactionsResponse>;
      return {
        items: Array.isArray(body.items) ? body.items : [],
        next_page_token: String(body.next_page_token ?? ""),
        total_count: Number(body.total_count ?? 0),
      };
    },
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
    meta: { errorMessage: "Failed to load transactions" },
  });
}

/** Fetches a single transaction by id from GET /v1/portal/transactions/{id}. */
export function useTransaction(id: string | null) {
  return useQuery<TransactionItem, AxiosError<ApiResponseError>>({
    queryKey: ["portal", "transactions", id],
    queryFn: async () => {
      const res = await axios.get(`${TRANSACTIONS_URL}/${id}`);
      const body = (res.data?.data ?? res.data) as Partial<TransactionItem>;
      return body as TransactionItem;
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load transaction" },
  });
}

function fetchTransactionReceipt(id: string) {
  return axios.get<Blob>(`${TRANSACTIONS_URL}/${id}/receipt`, {
    responseType: "blob",
  });
}

/** Prints the downloaded receipt PDF, not the surrounding settings page. */
export async function printTransactionReceipt(id: string): Promise<void> {
  const res = await fetchTransactionReceipt(id);
  const pdf = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(pdf);

  return new Promise<void>((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.title = "Invoice PDF";
    frame.style.cssText =
      "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
    let timeout: ReturnType<typeof setTimeout>;

    const cleanup = () => {
      clearTimeout(timeout);
      frame.onload = null;
      frame.onerror = null;
      frame.remove();
      window.URL.revokeObjectURL(url);
    };
    const fail = (error: unknown) => {
      cleanup();
      reject(error);
    };

    frame.onload = () => {
      try {
        const printWindow = frame.contentWindow;
        if (!printWindow) throw new Error("Invoice print window unavailable");
        frame.onload = null;
        clearTimeout(timeout);
        // Some PDF viewers do not emit afterprint; retain the PDF for the dialog.
        timeout = setTimeout(cleanup, 5 * 60_000);
        printWindow.addEventListener("afterprint", cleanup, { once: true });
        printWindow.focus();
        printWindow.print();
        resolve();
      } catch (error) {
        fail(error);
      }
    };
    frame.onerror = () => fail(new Error("Could not load the invoice PDF"));
    timeout = setTimeout(
      () => fail(new Error("Invoice PDF loading timed out")),
      30_000
    );
    frame.src = url;
    document.body.appendChild(frame);
  });
}

/**
 * Downloads a transaction receipt from GET /v1/portal/transactions/{id}/receipt.
 * The endpoint returns a binary file (PDF); this triggers a browser download.
 */
export async function downloadTransactionReceipt(
  id: string,
  fallbackName = "receipt"
): Promise<void> {
  const res = await fetchTransactionReceipt(id);

  // Prefer the server-provided filename from Content-Disposition, otherwise
  // fall back to a generic name.
  let filename = fallbackName;
  const disposition = res.headers["content-disposition"] as
    | string
    | undefined;
  if (disposition) {
    const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
    if (match?.[1]) filename = decodeURIComponent(match[1]);
  }

  // Infer an extension from the content type when the header has none.
  const contentType = (res.headers["content-type"] as string | undefined) ?? "";
  if (!/\.[a-z0-9]+$/i.test(filename)) {
    const ext = contentType.includes("pdf")
      ? "pdf"
      : contentType.includes("zip")
        ? "zip"
        : "pdf";
    filename = `${filename}.${ext}`;
  }

  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

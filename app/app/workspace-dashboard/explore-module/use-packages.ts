"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import {
  BarChart3,
  Bot,
  Box,
  ChartLine,
  ContactRound,
  LayoutDashboard,
  MapPinned,
  Megaphone,
  Store,
  TrendingUp,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const PACKAGES_URL = "/v1/portal/packages";
const MODULES_URL = "/v1/portal/modules";
const TRANSACTIONS_URL = "/v1/portal/transactions";
const axios = axiosConfig(env.apiBaseUrl);

const packageKeys = {
  all: ["portal-packages"] as const,
};

const moduleKeys = {
  all: ["portal-modules"] as const,
};

const iconMap: Record<string, LucideIcon> = {
  "trending-up": TrendingUp,
  megaphone: Megaphone,
  users: UsersRound,
  "chart-line": ChartLine,
  box: Box,
  "layout-dashboard": LayoutDashboard,
  store: Store,
  "bar-chart": BarChart3,
  "map-pinned": MapPinned,
  "contact-round": ContactRound,
  bot: Bot,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Bot;
}

export function isCatalogAvailable(status: string): boolean {
  const normalized = status.toLowerCase();
  return !["inactive", "archived", "disabled", "draft"].some(
    (value) =>
      normalized === value ||
      normalized.endsWith(`_${value}`)
  );
}

export type CatalogBillingCycle = "monthly" | "yearly";

export type ApiModule = {
  id: string;
  name: string;
  description: string;
  icon: string;
  monthly_price: number;
  monthly_price_idr: number;
  yearly_price: number | null;
  yearly_price_idr: number | null;
  category: string;
  status: string;
  version: string;
  is_menu: boolean;
  created_at?: { seconds: number; nanos: number };
  updated_at?: { seconds: number; nanos: number };
};

export type ApiPackage = {
  id: string;
  name: string;
  description: string;
  icon: string;
  monthly_price: number;
  monthly_price_idr: number;
  yearly_price: number | null;
  yearly_price_idr: number | null;
  module_ids: string[];
  included_modules: ApiModule[];
  status: string;
  version: string;
  created_at?: { seconds: number; nanos: number };
  updated_at?: { seconds: number; nanos: number };
};

export type ExchangeRate = {
  as_of: string;
  available: boolean;
  from: string;
  rate: number;
  source: string;
  to: string;
};

type PackagesResponse = {
  exchange_rate: ExchangeRate | null;
  items: ApiPackage[];
  next_page_token: string;
  total_count: number;
};

type ModulesResponse = {
  exchange_rate: ExchangeRate | null;
  items: ApiModule[];
  next_page_token: string;
  total_count: number;
};

function findList(payload: unknown, keys: string[]): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  for (const key of ["items", "data", ...keys]) {
    const value = object[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      const nested = findList(value, keys);
      if (nested.length) return nested;
    }
  }
  return [];
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeModule(raw: unknown, index: number): ApiModule {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(item.id ?? item._id ?? item.module_id ?? index),
    name: String(item.name ?? "Untitled module"),
    description: String(item.description ?? ""),
    icon: String(item.icon ?? ""),
    monthly_price: Number(item.monthly_price ?? 0),
    monthly_price_idr: Number(item.monthly_price_idr ?? 0),
    yearly_price: nullableNumber(item.yearly_price),
    yearly_price_idr: nullableNumber(item.yearly_price_idr),
    category: String(item.category ?? ""),
    status: String(item.status ?? "active"),
    version: String(item.version || "1"),
    is_menu: Boolean(item.is_menu ?? false),
    created_at: item.created_at as ApiModule["created_at"],
    updated_at: item.updated_at as ApiModule["updated_at"],
  };
}

function normalizePackage(raw: unknown, index: number): ApiPackage {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const rawIncluded = item.included_modules ?? item.modules;
  const includedModules = Array.isArray(rawIncluded)
    ? rawIncluded.map(normalizeModule)
    : [];
  const rawModuleIds = item.module_ids ?? item.included_module_ids;
  const moduleIds = Array.isArray(rawModuleIds)
    ? rawModuleIds.map(String)
    : includedModules.map((module) => module.id);

  return {
    id: String(item.id ?? item._id ?? item.package_id ?? index),
    name: String(item.name ?? "Untitled package"),
    description: String(item.description ?? ""),
    icon: String(item.icon ?? ""),
    monthly_price: Number(item.monthly_price ?? 0),
    monthly_price_idr: Number(item.monthly_price_idr ?? 0),
    yearly_price: nullableNumber(item.yearly_price),
    yearly_price_idr: nullableNumber(item.yearly_price_idr),
    module_ids: moduleIds,
    included_modules: includedModules,
    status: String(item.status ?? "active"),
    version: String(item.version || "1"),
    created_at: item.created_at as ApiPackage["created_at"],
    updated_at: item.updated_at as ApiPackage["updated_at"],
  };
}

function extractCount(payload: unknown, fallback: number): number {
  if (!payload || typeof payload !== "object") return fallback;
  const object = payload as Record<string, unknown>;
  const count = object.total_count ?? object.total;
  if (count != null && Number.isFinite(Number(count))) return Number(count);
  const nested = object.data;
  return nested && nested !== payload ? extractCount(nested, fallback) : fallback;
}

function extractToken(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const object = payload as Record<string, unknown>;
  const token = object.next_page_token ?? object.nextPageToken;
  if (token != null) return String(token);
  const nested = object.data;
  return nested && nested !== payload ? extractToken(nested) : "";
}

function extractExchangeRate(payload: unknown): ExchangeRate | null {
  if (!payload || typeof payload !== "object") return null;
  const object = payload as Record<string, unknown>;
  const value = object.exchange_rate;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const rate = value as Record<string, unknown>;
    return {
      as_of: String(rate.as_of ?? ""),
      available: Boolean(rate.available),
      from: String(rate.from ?? "USD"),
      rate: Number(rate.rate ?? 0),
      source: String(rate.source ?? ""),
      to: String(rate.to ?? "IDR"),
    };
  }
  const nested = object.data;
  return nested && nested !== payload ? extractExchangeRate(nested) : null;
}

export function useGetPackages(options?: { enabled?: boolean }) {
  return useQuery<PackagesResponse, AxiosError<ApiResponseError>>({
    queryKey: packageKeys.all,
    queryFn: async () => {
      const payload: unknown = (await axios.get(PACKAGES_URL)).data;
      const items = findList(payload, ["packages"]).map(normalizePackage);
      return {
        exchange_rate: extractExchangeRate(payload),
        items,
        next_page_token: extractToken(payload),
        total_count: extractCount(payload, items.length),
      };
    },
    enabled: options?.enabled ?? true,
    meta: { errorMessage: "Failed to load packages" },
  });
}

export function useGetModules() {
  return useQuery<ModulesResponse, AxiosError<ApiResponseError>>({
    queryKey: moduleKeys.all,
    queryFn: async () => {
      const payload: unknown = (await axios.get(MODULES_URL)).data;
      const items = findList(payload, ["modules"]).map(normalizeModule);
      return {
        exchange_rate: extractExchangeRate(payload),
        items,
        next_page_token: extractToken(payload),
        total_count: extractCount(payload, items.length),
      };
    },
    meta: { errorMessage: "Failed to load modules" },
  });
}

export type CheckoutPayload = {
  currency: string;
  customer_email: string;
  customer_name: string;
  items: {
    billing_cycle: "monthly" | "yearly";
    item_type: "package" | "addon";
    reference_id: string;
  }[];
  payment_method: string;
  promo_code: string;
};

const CHECKOUT_URL = "/v1/portal/checkout";

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, CheckoutPayload>({
    mutationFn: async (payload) => (await axios.post(CHECKOUT_URL, payload)).data,
    meta: {
      errorMessage: "Checkout failed",
      successMessage: "Checkout initiated successfully",
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: packageKeys.all });
    },
  });
}

export type TransactionItem = {
  id: string;
  name: string;
  description: string;
  item_type: string;
  quantity: number;
  unit_price: number;
  amount: number;
  reference_id: string;
};

export type Transaction = {
  id: string;
  order_id: string;
  type: string;
  status: "pending" | "paid" | "failed" | string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  final_amount: number;
  promo_code: string;
  billing_cycle: string;
  payment_method: string;
  provider: string;
  invoice_number: string;
  created_at: string;
  paid_at: string;
  items: TransactionItem[];
};

type TransactionsResponse = {
  items: Transaction[];
  next_page_token: string;
  total_count: number;
};

export function useGetTransactions(
  _filters?: unknown,
  options?: { enabled?: boolean; tenantId?: string | null },
) {
  return useQuery<TransactionsResponse, AxiosError<ApiResponseError>>({
    queryKey: ["portal-transactions", options?.tenantId ?? null] as const,
    queryFn: async () => {
      const payload: unknown = (await axios.get(TRANSACTIONS_URL)).data;
      const items = findList(payload, ["transactions"]).map((raw, index) => {
        const item = (raw && typeof raw === "object" ? raw : {}) as Record<
          string,
          unknown
        >;
        const rawItems = item.items;
        const txItems = Array.isArray(rawItems)
          ? (rawItems as Record<string, unknown>[]).map((tx) => ({
            id: String(tx.id ?? ""),
            name: String(tx.name ?? ""),
            description: String(tx.description ?? ""),
            item_type: String(tx.item_type ?? ""),
            quantity: Number(tx.quantity ?? 1),
            unit_price: Number(tx.unit_price ?? 0),
            amount: Number(tx.amount ?? 0),
            reference_id: String(tx.reference_id ?? ""),
          }))
          : [];
        return {
          id: String(item.id ?? index),
          order_id: String(item.order_id ?? ""),
          type: String(item.type ?? ""),
          status: String(item.status ?? ""),
          currency: String(item.currency ?? "IDR"),
          subtotal: Number(item.subtotal ?? 0),
          discount_amount: Number(item.discount_amount ?? 0),
          final_amount: Number(item.final_amount ?? 0),
          promo_code: String(item.promo_code ?? ""),
          billing_cycle: String(item.billing_cycle ?? "monthly"),
          payment_method: String(item.payment_method ?? ""),
          provider: String(item.provider ?? ""),
          invoice_number: String(item.invoice_number ?? ""),
          created_at: String(item.created_at ?? ""),
          paid_at: String(item.paid_at ?? ""),
          items: txItems,
        } as Transaction;
      });
      return {
        items,
        next_page_token: extractToken(payload),
        total_count: extractCount(payload, items.length),
      };
    },
    enabled:
      (options?.enabled ?? true) && Boolean(options?.tenantId),
    meta: { errorMessage: "Failed to load transactions" },
  });
}

export type ResumeTransactionResponse = {
  bank: string;
  expiry_time: string;
  order_id: string;
  payment_method: string;
  provider: string;
  provider_url: string;
  qr_url: string;
  transaction_id: string;
  va_number: string;
};

export function useResumeTransaction() {
  return useMutation<
    ResumeTransactionResponse,
    AxiosError<ApiResponseError>,
    string
  >({
    mutationFn: async (id) => {
      const payload: unknown = (
        await axios.post(`${TRANSACTIONS_URL}/${id}/resume`)
      ).data;
      const obj = (payload && typeof payload === "object" ? payload : {}) as Record<
        string,
        unknown
      >;
      return {
        bank: String(obj.bank ?? ""),
        expiry_time: String(obj.expiry_time ?? ""),
        order_id: String(obj.order_id ?? ""),
        payment_method: String(obj.payment_method ?? ""),
        provider: String(obj.provider ?? ""),
        provider_url: String(obj.provider_url ?? ""),
        qr_url: String(obj.qr_url ?? ""),
        transaction_id: String(obj.transaction_id ?? ""),
        va_number: String(obj.va_number ?? ""),
      };
    },
    meta: { errorMessage: "Failed to resume transaction" },
  });
}

export function useGetTransaction(id: string) {
  return useQuery<Transaction, AxiosError<ApiResponseError>>({
    queryKey: ["portal-transaction", id] as const,
    queryFn: async () => {
      const payload: unknown = (await axios.get(`${TRANSACTIONS_URL}/${id}`)).data;
      const obj = (payload && typeof payload === "object" ? payload : {}) as Record<
        string, unknown
      >;
      const items = Array.isArray(obj.items)
        ? (obj.items as Record<string, unknown>[]).map((item) => ({
          id: String(item.id ?? ""),
          name: String(item.name ?? ""),
          description: String(item.description ?? ""),
          item_type: String(item.item_type ?? ""),
          quantity: Number(item.quantity ?? 1),
          unit_price: Number(item.unit_price ?? 0),
          amount: Number(item.amount ?? 0),
          reference_id: String(item.reference_id ?? ""),
        }))
        : [];
      return {
        id: String(obj.id ?? ""),
        order_id: String(obj.order_id ?? ""),
        type: String(obj.type ?? ""),
        status: String(obj.status ?? ""),
        currency: String(obj.currency ?? "IDR"),
        subtotal: Number(obj.subtotal ?? 0),
        discount_amount: Number(obj.discount_amount ?? 0),
        final_amount: Number(obj.final_amount ?? 0),
        promo_code: String(obj.promo_code ?? ""),
        billing_cycle: String(obj.billing_cycle ?? "monthly"),
        payment_method: String(obj.payment_method ?? ""),
        provider: String(obj.provider ?? ""),
        invoice_number: String(obj.invoice_number ?? ""),
        created_at: String(obj.created_at ?? ""),
        paid_at: String(obj.paid_at ?? ""),
        items,
      };
    },
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "pending" ? 5000 : false,
    meta: { errorMessage: "Failed to load transaction" },
  });
}

export function useDownloadTransactionReceipt() {
  return useMutation<void, AxiosError<ApiResponseError>, { id: string }>({
    mutationFn: async ({ id }) => {
      const response = await axios.get(`${TRANSACTIONS_URL}/${id}/receipt`, {
        responseType: "blob",
      });
      const disposition = response.headers["content-disposition"] as
        | string
        | undefined;
      const encodedFileName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
      const plainFileName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
      const fileName = encodedFileName
        ? decodeURIComponent(encodedFileName)
        : plainFileName || `receipt-${id}.pdf`;
      const contentType = response.headers["content-type"];
      const blob = new Blob([response.data as BlobPart], {
        type: typeof contentType === "string" ? contentType : "application/pdf",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    meta: { errorMessage: "Failed to download receipt" },
  });
}

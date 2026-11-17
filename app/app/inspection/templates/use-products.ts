"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

const PRODUCTS_URL = "/v1/manufacturing/master-data/products";

export interface ProductItem {
  id: string;
  partName: string;
  partNumber: string;
  category: string;
  status: string;
}

export interface ProductListResponse {
  items: ProductItem[];
  nextPageToken: string;
  totalCount: number;
}

export interface ProductListParams {
  page_size?: number;
  page_token?: string;
  status?: string;
}

function normalizeProduct(raw: unknown): ProductItem {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    partName: String(row.part_name ?? ""),
    partNumber: String(row.part_number ?? ""),
    category: String(row.category ?? ""),
    status: String(row.status ?? ""),
  };
}

export function useProductList(params: ProductListParams = {}) {
  return useQuery<ProductListResponse, AxiosError<ApiResponseError>>({
    queryKey: ["products", "list", params],
    queryFn: async () => {
      const query: Record<string, string> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "")
          query[key] = String(value);
      }
      const res = await axios.get(PRODUCTS_URL, { params: query });
      const data = res.data as Record<string, unknown>;
      const products = Array.isArray(data?.products)
        ? data.products.map(normalizeProduct)
        : [];
      return {
        items: products,
        nextPageToken: String(data?.next_page_token ?? ""),
        totalCount: Number(data?.total_count ?? products.length),
      };
    },
    meta: { errorMessage: "Failed to load products" },
  });
}

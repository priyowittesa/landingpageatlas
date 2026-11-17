"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";

const axios = axiosConfig(env.apiBaseUrl);
const PARTS_URL = "/v1/construction-equipment/spare-parts";
const CATEGORIES_URL = "/v1/construction-equipment/spare-part-categories";
const partsKey = ["master-spare-parts"];
const categoriesKey = ["master-spare-part-categories"];

export type SparePartCategory = { id: string; name: string; description?: string };
export type SparePart = {
  id: string;
  code?: string;
  part_number?: string;
  name: string;
  description?: string;
  category_id: string;
  category?: SparePartCategory | string;
  category_name?: string;
  unit_stock: number;
  unit_price: number;
};
export type SparePartPayload = Pick<SparePart, "name" | "category_id" | "unit_stock" | "unit_price"> & { description: string };
export type SparePartFilters = { search?: string; category_id?: string; page_size: number; page_token?: string };
type ListResult<T> = { items: T[]; nextPageToken: string; totalCount?: number };

function extractList<T>(payload: unknown): ListResult<T> {
  let current = payload;
  let nextPageToken = "";
  let totalCount: number | undefined;
  for (let depth = 0; depth < 5; depth += 1) {
    if (Array.isArray(current)) return { items: current as T[], nextPageToken, totalCount };
    if (!current || typeof current !== "object") break;
    const value = current as Record<string, unknown>;
    const token = value.next_page_token ?? value.nextPageToken;
    const count = value.total_count ?? value.totalCount;
    if (token != null) nextPageToken = String(token);
    if (count != null && Number.isFinite(Number(count))) totalCount = Number(count);
    current = value.items ?? value.data ?? value.result ?? value.spare_parts ?? value.categories;
  }
  return { items: [], nextPageToken, totalCount };
}

export function useSpareParts(filters: SparePartFilters) {
  return useQuery({
    queryKey: [...partsKey, filters],
    queryFn: async () => extractList<SparePart>((await axios.get(PARTS_URL, { params: filters })).data),
    meta: { errorMessage: "Failed to load spare parts" },
  });
}
export function useInfiniteSpareParts(search = "", enabled = true) {
  return useInfiniteQuery({
    queryKey: [...partsKey, "lazy-select", search.trim()],
    initialPageParam: "",
    enabled,
    queryFn: async ({ pageParam }) =>
      extractList<SparePart>((await axios.get(PARTS_URL, {
        params: {
          search: search.trim() || undefined,
          page_size: 20,
          page_token: pageParam || undefined,
        },
      })).data),
    getNextPageParam: (lastPage) => lastPage.nextPageToken || undefined,
    meta: { errorMessage: "Failed to load spare parts" },
  });
}
export function useSparePartCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: async () => extractList<SparePartCategory>((await axios.get(CATEGORIES_URL, { params: { page_size: 200 } })).data).items,
    meta: { errorMessage: "Failed to load spare part categories" },
  });
}
export function useSaveSparePart() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id?: string; payload: SparePartPayload }) =>
      (id ? axios.put(`${PARTS_URL}/${id}`, payload) : axios.post(PARTS_URL, payload)).then((response) => response.data),
    onSuccess: () => client.invalidateQueries({ queryKey: partsKey }),
    meta: { errorMessage: "Failed to save spare part", successMessage: "Spare part saved" },
  });
}
export function useDeleteSparePart() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await axios.delete(`${PARTS_URL}/${id}`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: partsKey }),
    meta: { errorMessage: "Failed to delete spare part", successMessage: "Spare part deleted" },
  });
}
export function useCreateSparePartCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description: string }) => (await axios.post(CATEGORIES_URL, payload)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: categoriesKey }),
    meta: { errorMessage: "Failed to create category", successMessage: "Category created" },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { Product, ProductStatus } from "./types";

const axios = axiosConfig(env.apiBaseUrl);

const PRODUCTS_URL = "/v1/manufacturing/master-data/products";
const PRODUCT_URL = "/v1/manufacturing/master-data/product";
const INSPECTION_URL = "/v1/manufacturing/inspection";

export const productKeys = {
  all: ["products"] as const,
  list: (params: unknown) => ["products", "list", params] as const,
  detail: (id: string) => ["products", "detail", id] as const,
  inspectionHistory: (id: string, params: unknown) =>
    ["products", "inspection-history", id, params] as const,
};

export interface ProductListResponse {
  items: Product[];
  nextPageToken: string;
  totalCount: number;
}

export interface ProductListParams {
  page_size?: number;
  page_token?: string;
  status?: string;
}

function normalizeStatus(value: string): ProductStatus {
  const normalized = value.toLowerCase().replace(/[ -]/g, "_");
  if (normalized === "inactive" || normalized === "in_active") return "inactive";
  if (normalized === "obsolete") return "obsolete";
  if (normalized === "prototype") return "prototype";
  return "active";
}

function normalizeProduct(raw: unknown): Product {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    partName: String(row.part_name ?? ""),
    partNumber: String(row.part_number ?? ""),
    revision: Number(row.revision ?? 0),
    category: String(row.category ?? ""),
    status: normalizeStatus(String(row.status ?? "")),
    createdAt: String(row.created_at ?? ""),
    createdBy: String(row.created_by ?? ""),
  };
}

export function useProductList(params: ProductListParams = {}) {
  return useQuery<ProductListResponse, AxiosError<ApiResponseError>>({
    queryKey: productKeys.list(params),
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

export function useProduct(id?: string) {
  return useQuery<Product | null, AxiosError<ApiResponseError>>({
    queryKey: productKeys.detail(id ?? ""),
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`${PRODUCTS_URL}/${id}`);
      const data = res.data as Record<string, unknown>;
      const raw = data?.product ?? data;
      if (!raw || typeof raw !== "object") return null;
      return normalizeProduct(raw);
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load product" },
  });
}

export interface ProductInspectionHistoryItem {
  id: string;
  category: string;
  inspectionName: string;
  templateId: string;
  templateName: string;
  status: string;
  createdBy: string;
  startedAt: string;
  submittedAt: string;
  createdAt: string;
}

export interface ProductInspectionHistoryResponse {
  items: ProductInspectionHistoryItem[];
  nextPageToken: string;
  totalCount: number;
}

export interface ProductInspectionHistoryParams {
  page_size?: number;
  page_token?: string;
}

function normalizeInspectionHistory(raw: unknown): ProductInspectionHistoryItem {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: String(row.id ?? ""),
    category: String(row.category ?? ""),
    inspectionName: String(row.inspection_name ?? ""),
    templateId: String(row.template_id ?? ""),
    templateName: String(row.template_name ?? ""),
    status: String(row.status ?? ""),
    createdBy: String(row.created_by ?? ""),
    startedAt: String(row.started_at ?? ""),
    submittedAt: String(row.submitted_at ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

export function useProductInspectionHistory(
  id?: string,
  params: ProductInspectionHistoryParams = {},
) {
  return useQuery<
    ProductInspectionHistoryResponse,
    AxiosError<ApiResponseError>
  >({
    queryKey: productKeys.inspectionHistory(id ?? "", params),
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (params.page_size) query.page_size = String(params.page_size);
      if (params.page_token) query.page_token = params.page_token;

      const res = await axios.get(`${INSPECTION_URL}/product/${id}/history`, {
        params: query,
      });
      const data = (res.data?.data ?? res.data) as Record<string, unknown>;
      const items = Array.isArray(data?.history)
        ? data.history.map(normalizeInspectionHistory)
        : [];
      return {
        items,
        nextPageToken: String(data?.next_page_token ?? ""),
        totalCount: Number(data?.total_count ?? items.length),
      };
    },
    enabled: Boolean(id),
    meta: { errorMessage: "Failed to load inspection history" },
  });
}

export interface ProductCreatePayload {
  category: string;
  created_by: string;
  part_name: string;
  part_number: string;
  status: string;
}

export interface ProductUpdatePayload {
  category: string;
  id: string;
  part_name: string;
  part_number: string;
  status: string;
  updated_by: string;
}

function extractProductId(payload: unknown): string {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    const object = current as Record<string, unknown>;
    if (object.id) return String(object.id);
    const nested = object.data ?? object.product;
    if (!nested) break;
    current = nested;
  }
  return "";
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation<string, AxiosError<ApiResponseError>, ProductCreatePayload>({
    mutationFn: async (payload) =>
      extractProductId((await axios.post(PRODUCT_URL, payload)).data),
    meta: {
      errorMessage: "Failed to create product",
      successMessage: "Product created successfully",
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, ProductUpdatePayload>({
    mutationFn: async (payload) => {
      const { id, ...body } = payload;
      return (await axios.put(`${PRODUCT_URL}/${id}`, body)).data;
    },
    meta: {
      errorMessage: "Failed to update product",
      successMessage: "Product updated successfully",
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(payload.id) });
    },
  });
}

export interface ProductDrawing {
  id: string;
  fileName: string;
  storageKey: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

function normalizeDrawing(raw: unknown, index: number): ProductDrawing {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const uploadedAt = row.uploaded_at as Record<string, unknown> | undefined;
  const seconds = uploadedAt?.seconds;
  const storageKey = String(row.storage_key ?? "");
  return {
    id: String(row.id ?? index),
    fileName: String(row.file_name ?? storageKey.split("/").pop() ?? ""),
    storageKey,
    url: String(row.url ?? ""),
    uploadedBy: String(row.uploaded_by ?? ""),
    uploadedAt: seconds
      ? new Date(Number(seconds) * 1000).toISOString()
      : String(row.uploaded_at ?? ""),
  };
}

export async function fetchProductDrawings(
  productId: string,
): Promise<ProductDrawing[]> {
  const res = await axios.get(`${PRODUCT_URL}/${productId}/drawing`);
  const data = (res.data?.data ?? res.data) as Record<string, unknown>;
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.files)
      ? (data.files as unknown[])
      : [];
  return rows.map(normalizeDrawing);
}

export function useProductDrawings(productId?: string) {
  return useQuery<ProductDrawing[], AxiosError<ApiResponseError>>({
    queryKey: [...productKeys.detail(productId ?? ""), "drawings"],
    queryFn: () => fetchProductDrawings(productId as string),
    enabled: Boolean(productId),
    meta: { errorMessage: "Failed to load drawing files" },
  });
}

export interface DrawingUploadUrlResponse {
  upload_url: string;
  storage_key: string;
}

export async function getProductDrawingUploadUrl(
  productId: string,
  payload: { file_name: string },
): Promise<DrawingUploadUrlResponse> {
  const res = await axios.post(
    `${PRODUCT_URL}/${productId}/drawing/upload-url`,
    payload,
  );
  const data = (res.data?.data ?? res.data) as DrawingUploadUrlResponse;
  if (!data?.upload_url || !data?.storage_key) {
    throw new Error("Invalid upload URL response");
  }
  return data;
}

export async function uploadDrawingToS3(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const formData = new FormData();
  formData.append("uploadUrl", uploadUrl);
  formData.append("contentType", file.type || "application/octet-stream");
  formData.append("file", file);

  const res = await fetch("/api/upload", { method: "PUT", body: formData });
  if (!res.ok) {
    const { error } = (await res.json()) as { error?: string };
    throw new Error(error ?? `Upload proxy failed: ${res.status}`);
  }
}

export async function registerProductDrawing(
  productId: string,
  payload: { storage_key: string; uploaded_by: string },
): Promise<void> {
  await axios.post(`${PRODUCT_URL}/${productId}/drawing`, payload);
}

export type DrawingUploadStatus =
  | "idle"
  | "getting-upload-url"
  | "uploading-s3"
  | "registering"
  | "success"
  | "error";

export function useDeleteProductDrawing(productId?: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError<ApiResponseError>, string>({
    mutationFn: async (drawingId) =>
      (await axios.delete(`${PRODUCT_URL}/${drawingId}/drawing`)).data,
    meta: {
      errorMessage: "Failed to delete drawing file",
      successMessage: "Drawing file deleted successfully",
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...productKeys.detail(productId ?? ""), "drawings"],
      }),
  });
}

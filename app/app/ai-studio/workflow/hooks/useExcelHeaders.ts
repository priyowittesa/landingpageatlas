"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type {
  ExcelHeaderPreviewDto,
  ExcelHeaderPreviewResponse,
  ExcelSheetsDto,
  ExcelSheetsResponse,
  NodeField
} from "../types";

const axios = axiosConfig(env.apiBaseUrl);

const PREVIEW_EXCEL_HEADERS_URL =
  "/v1/fabrix/executor/api-connector/preview-excel-headers";
const EXCEL_SHEETS_URL = "/v1/fabrix/executor/file-connector/sheets";

export const excelHeaderKeys = {
  preview: (payload: ExcelHeaderPreviewDto | null) =>
    ["previewExcelHeaders", payload ? JSON.stringify(payload) : ""] as const,
  sheets: (payload: ExcelSheetsDto | null) =>
    ["excelSheets", payload ? JSON.stringify(payload) : ""] as const
};

function toField(name: string, type?: unknown): NodeField {
  return {
    name,
    type: typeof type === "string" && type ? type : "string",
    nullable: true,
    required: false,
    description: ""
  };
}

/**
 * Normalize the preview-excel-headers response into `NodeField[]`.
 *
 * The endpoint returns the spreadsheet's column names wrapped in a `columns`
 * array, e.g. `{ "columns": ["Role Name", "Description"] }`. A few richer /
 * alternative shapes (bare arrays, `headers`/`fields` keys, name → type maps)
 * are tolerated in case the contract grows. Columns have no type information,
 * so every field defaults to `string`.
 */
export function normalizeExcelHeaders(raw: unknown): NodeField[] {
  if (!raw) return [];

  // Unwrap the standard { data: ... } envelope.
  if (
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "data" in (raw as Record<string, unknown>)
  ) {
    return normalizeExcelHeaders((raw as Record<string, unknown>).data);
  }

  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return toField(item);
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const name = obj.name ?? obj.header ?? obj.column ?? obj.field;
          if (typeof name === "string") return toField(name, obj.type);
        }
        return null;
      })
      .filter((f): f is NodeField => !!f && !!f.name);
  }

  if (typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;

  // Wrapped list — `columns` is what the endpoint actually returns.
  for (const key of ["columns", "headers", "fields"]) {
    if (Array.isArray(obj[key])) return normalizeExcelHeaders(obj[key]);
  }

  // name → type / name → metadata map.
  return Object.entries(obj)
    .map(([name, value]) => {
      if (typeof value === "string" || value == null)
        return toField(name, value);
      if (typeof value === "object" && !Array.isArray(value))
        return toField(name, (value as Record<string, unknown>).type);
      return null;
    })
    .filter((f): f is NodeField => !!f);
}

/**
 * Previews the header columns of the Excel file provided by the upstream source
 * node of a `transform_parse_file` node. Disabled until the upstream
 * connection / connector / file are all known.
 */
export const usePreviewExcelHeaders = (
  payload: ExcelHeaderPreviewDto | null
) => {
  const enabled =
    !!payload?.connection_id && !!payload?.connector && !!payload?.file_id;

  return useQuery<ExcelHeaderPreviewResponse, AxiosError<ApiResponseError>>({
    queryKey: excelHeaderKeys.preview(payload),
    queryFn: async () => {
      const response = await axios.post<ExcelHeaderPreviewResponse>(
        PREVIEW_EXCEL_HEADERS_URL,
        payload
      );
      return response.data;
    },
    enabled,
    retry: 0,
    meta: { errorMessage: "Failed to preview Excel headers" }
  });
};

/**
 * Lists the worksheet names of the Excel file provided by the upstream source
 * node of a `transform_parse_file` node (POST
 * /v1/fabrix/executor/file-connector/sheets). Disabled until the upstream
 * connection + file are both known.
 */
export const useExcelSheets = (payload: ExcelSheetsDto | null) => {
  const enabled = !!payload?.connection_id && !!payload?.file_id;

  return useQuery<ExcelSheetsResponse, AxiosError<ApiResponseError>>({
    queryKey: excelHeaderKeys.sheets(payload),
    queryFn: async () => {
      const response = await axios.post<ExcelSheetsResponse>(
        EXCEL_SHEETS_URL,
        payload
      );
      return response.data;
    },
    enabled,
    retry: 0,
    meta: { errorMessage: "Failed to list Excel sheets" }
  });
};

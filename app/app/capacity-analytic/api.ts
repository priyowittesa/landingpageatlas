import { axiosConfig } from "@/lib/axios";
import type { ListPage, MasterRecord, Params, UploadResult } from "./api-types";

export const capacityBase = "/v1/manufacturing/line-balancing";
const client = axiosConfig();

export function capacityError(error: unknown): string {
  const response = (error as { response?: { status?: number; data?: { error?: { message?: string } } } })?.response;
  if (response?.status && response.status >= 500) return "Capacity analytics is unavailable. Please try again.";
  return response?.data?.error?.message || (error instanceof Error ? error.message : "The request failed. Please try again.");
}

export async function capacityGet<T>(path: string, params?: Params, signal?: AbortSignal): Promise<T> {
  const response = await client.get<{ data: T }>(`${capacityBase}${path}`, { params, signal });
  if (response.data?.data == null) throw new Error("The API returned an invalid capacity response.");
  return response.data.data;
}

export async function capacityWrite<T>(path: string, body?: unknown, method: "POST" | "PUT" | "DELETE" = "POST"): Promise<T> {
  const response = await client.request<{ data: T }>({ url: `${capacityBase}${path}`, method, data: body });
  return response.data?.data;
}

// Master-data selectors need every page, not only the gateway's first 20 items.
export async function capacityListAll<T>(path: string, params?: Params, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  const visited = new Set<string>();
  let pageToken = "";
  do {
    if (visited.has(pageToken)) throw new Error("The API returned a repeated page token.");
    visited.add(pageToken);
    const page = await capacityGet<ListPage<T>>(path, { ...params, page_size: 200, page_token: pageToken }, signal);
    items.push(...(page.items ?? []));
    pageToken = page.next_page_token ?? "";
  } while (pageToken);
  return items;
}

export const uploadLimit = 10 * 1024 * 1024;
export function validateUpload(file: File) {
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Choose an .xlsx file.");
  if (file.size > uploadLimit) throw new Error("The file must be at most 10 MB.");
}

export async function uploadCapacityFile(kind: "marketing-data" | "master-part", file: File): Promise<UploadResult> {
  validateUpload(file);
  const body = new FormData();
  body.append("file", file);
  const response = await client.post<{ data: UploadResult }>(`${capacityBase}/uploads/${kind}`, body, {
    // Remove the shared JSON header so the browser supplies the multipart boundary.
    headers: { "Content-Type": undefined },
  });
  return response.data.data;
}

export async function downloadCapacityTemplate(kind: "marketing-data" | "master-part") {
  const response = await client.get<Blob>(`${capacityBase}/uploads/templates/${kind}`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${kind}-template.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatNumber(value?: number, suffix = "") {
  return value == null || !Number.isFinite(value) ? "-" : `${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}${suffix}`;
}

export function masterCode(item: MasterRecord) {
  return item.code || item.product_code || item.group_code || item.line_code || item.part_number || item.id;
}

export function masterName(item: MasterRecord) {
  return item.name || item.product_name || item.group_name || item.line_name || item.part_name || item.label || "";
}

export function masterLabel(item: MasterRecord) {
  const code = masterCode(item);
  const name = masterName(item);
  return name && code !== name ? `${code} - ${name}` : code;
}

export function enumLabel(value?: string) {
  if (!value || value.endsWith("_UNSPECIFIED")) return "-";
  const short = value.replace(/^(CAPACITY_STATUS_|BRIDGING_STATUS_|ACTIVITY_PLAN_STATUS_|FORMULA_VERSION_STATUS_|DATA_UPLOAD_STATUS_|FORMULA_SCOPE_LEVEL_)/, "");
  if (short === "NG") return "NG";
  return short.toLowerCase().split("_").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
}

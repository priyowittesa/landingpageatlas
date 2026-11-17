"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponse, ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);

const CHAT_FILE_URL = (fileId: string) =>
  `${env.apiBaseUrl}/workflow/chat/uploads/${fileId}/url`;

/** `data` field of GET /workflow/chat/uploads/{file_id}/url. */
export interface ChatFileUrlResponse {
  id: string;
  file_url: string;
  original_name?: string;
  display_name?: string;
  file_extension?: string;
  file_type?: string;
  mime_type?: string;
  expires_at?: string;
}

/**
 * Step 1 — request a presigned download URL for a chat upload. The returned
 * `file_url` is a short-lived S3 URL that can be fetched directly by the
 * browser.
 */
export async function getChatFileUrl(
  fileId: string
): Promise<ChatFileUrlResponse> {
  const res = await axios.get<ApiResponse<ChatFileUrlResponse>>(
    CHAT_FILE_URL(fileId)
  );
  const data =
    (res.data?.data as ChatFileUrlResponse | undefined) ??
    (res.data as unknown as ChatFileUrlResponse);
  if (!data?.file_url) {
    throw new Error("Invalid chat file URL response");
  }
  return data;
}

export const chatFileKeys = {
  url: (fileId: string) => ["getChatFileUrl", fileId] as const
};

/** True when the file is previewable inline (image types only for now). */
export function isPreviewableMimeType(mimeType?: string): boolean {
  return Boolean(mimeType?.startsWith("image/"));
}

export function getChatFileExtension(file: ChatFileUrlResponse): string {
  const explicitExtension = file.file_extension || file.file_type;
  if (explicitExtension) return explicitExtension.replace(/^\./, "").toLowerCase();
  const fileName = file.original_name || file.display_name || "";
  const extension = fileName.match(/\.([^.]+)$/)?.[1];
  return extension?.toLowerCase() ?? "";
}

/**
 * Fetches the presigned URL for a chat file and caches it. Used by the
 * preview button to load an image inline without downloading it. `<img>`
 * tags can load cross-origin URLs directly, so no proxy is needed here.
 */
export function useGetChatFileUrl(fileId: string | null) {
  return useQuery<ChatFileUrlResponse, AxiosError<ApiResponseError>>({
    queryKey: chatFileKeys.url(fileId ?? ""),
    enabled: Boolean(fileId),
    queryFn: async () => getChatFileUrl(fileId!),
    staleTime: 5 * 60 * 1000,
    meta: { errorMessage: "Failed to load file preview" }
  });
}

export function useResolveChatFilePreview() {
  return useMutation<
    ChatFileUrlResponse,
    AxiosError<ApiResponseError>,
    { fileId: string }
  >({
    mutationFn: ({ fileId }) => getChatFileUrl(fileId),
    meta: { errorMessage: "Failed to load file preview" }
  });
}

export function getChatFileProxyUrl(
  fileUrl: string,
  fileName: string
): string {
  return `/api/download?fileUrl=${encodeURIComponent(fileUrl)}&fileName=${encodeURIComponent(fileName)}`;
}

/** Trigger a browser download for a remote URL by streaming it through a
 * Next.js API proxy. The proxy fetches the S3 presigned URL server-side
 * (avoiding CORS) and returns the file with a `Content-Disposition: attachment`
 * header so the browser always downloads it with the correct name. */
export async function downloadRemoteFile(
  fileUrl: string,
  fallbackName: string
): Promise<void> {
  const proxyUrl = getChatFileProxyUrl(fileUrl, fallbackName);
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    const { error } = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(error ?? `Download failed: ${response.status}`);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Mutation that resolves a chat file id to a presigned URL and streams the
 * resulting file to the browser as a download. Pass the preferred fallback
 * filename (usually the original `file_name`) so the saved file keeps it.
 */
export function useDownloadChatFile() {
  return useMutation<
    void,
    AxiosError<ApiResponseError>,
    { fileId: string; fileName?: string },
    unknown
  >({
    mutationFn: async ({ fileId, fileName }) => {
      const { file_url, original_name, display_name } =
        await getChatFileUrl(fileId);
      const fallbackName =
        fileName || display_name || original_name || fileId;
      await downloadRemoteFile(file_url, fallbackName);
    },
    meta: {
      errorMessage: "Failed to download file",
      successMessage: "File downloaded"
    }
  });
}

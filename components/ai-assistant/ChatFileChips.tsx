"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Download, Eye, ExternalLink, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import type { OfficeFilePreview } from "./OfficeFilePreviewDialog";
import {
  getChatFileExtension,
  isPreviewableMimeType,
  useDownloadChatFile,
  useGetChatFileUrl,
  useResolveChatFilePreview
} from "./useChatFileDownload";

const OfficeFilePreviewDialog = dynamic(
  () =>
    import("./OfficeFilePreviewDialog").then(
      (module) => module.OfficeFilePreviewDialog
    ),
  { ssr: false }
);

export interface ChatFileChipFile {
  fileId?: string;
  fileName: string;
}

/**
 * Renders chat attachments as a row of chips with two actions each:
 * **Preview** (loads the file inline below the message) and **Download**
 * (streams the file to the browser via the /api/download proxy).
 *
 * Preview is always offered; the FilePreview component checks the resolved
 * mime type and renders an image when possible, or a fallback message with
 * an open-in-new-tab link for non-image files.
 */
export function ChatFileChips({
  files,
  isUser
}: {
  files: ChatFileChipFile[];
  isUser?: boolean;
}) {
  const downloadFile = useDownloadChatFile();
  const resolvePreview = useResolveChatFilePreview();
  const orderedFiles = [...files].sort(
    (left, right) =>
      Number(/\.png$/i.test(left.fileName)) -
      Number(/\.png$/i.test(right.fileName))
  );
  const [previewingIds, setPreviewingIds] = useState<string[]>([]);
  const [documentPreview, setDocumentPreview] =
    useState<OfficeFilePreview | null>(null);

  const closeInlinePreview = (fileId: string) =>
    setPreviewingIds((current) => current.filter((id) => id !== fileId));

  const handlePreview = async (file: ChatFileChipFile) => {
    const fileId = file.fileId;
    if (!fileId) return;
    if (previewingIds.includes(fileId)) {
      closeInlinePreview(fileId);
      return;
    }
    if (documentPreview?.fileId === fileId) {
      setDocumentPreview(null);
      return;
    }

    try {
      const data = await resolvePreview.mutateAsync({ fileId });
      if (isPreviewableMimeType(data.mime_type)) {
        setPreviewingIds((current) =>
          current.includes(fileId) ? current : [...current, fileId]
        );
        return;
      }
      setDocumentPreview({
        fileId,
        displayName:
          file.fileName || data.display_name || data.original_name || fileId,
        fileName: data.original_name || file.fileName || fileId,
        fileUrl: data.file_url,
        fileType: getChatFileExtension(data)
      });
    } catch {
      return;
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {orderedFiles.map((file) => {
          const fileId = file.fileId;
          if (!fileId) return null;
          const downloading =
            downloadFile.isPending && downloadFile.variables?.fileId === fileId;
          const resolving =
            resolvePreview.isPending &&
            resolvePreview.variables?.fileId === fileId;
          const isPreviewing =
            previewingIds.includes(fileId) ||
            documentPreview?.fileId === fileId;
          return (
            <div key={fileId} className="flex items-center gap-1">
              <button
                type="button"
                disabled={downloading || resolving}
                onClick={() => void handlePreview(file)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors",
                  isUser
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-slate-200/70 text-slate-700 hover:bg-slate-300/70",
                  isPreviewing && "ring-1 ring-primary-400",
                  resolving && "cursor-default opacity-70"
                )}
                title={isPreviewing ? "Hide preview" : "Preview"}
              >
                {resolving ? (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                ) : (
                  <Eye className="h-3 w-3 shrink-0" />
                )}
              </button>
              <button
                type="button"
                disabled={downloading}
                onClick={() =>
                  downloadFile.mutate({ fileId, fileName: file.fileName })
                }
                className={cn(
                  "flex max-w-full items-center gap-1 rounded-md px-2 py-1 text-[11px] transition-colors",
                  isUser
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-slate-200/70 text-slate-700 hover:bg-slate-300/70",
                  downloading && "cursor-default opacity-70"
                )}
                title={`Download ${file.fileName}`}
              >
                {downloading ? (
                  <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 shrink-0" />
                )}
                <span className="truncate">{file.fileName}</span>
              </button>
            </div>
          );
        })}
      </div>
      {previewingIds.length > 0 && (
        <div className="space-y-2">
          {orderedFiles
            .filter((file) =>
              file.fileId ? previewingIds.includes(file.fileId) : false
            )
            .map((file) => (
              <FilePreview
                key={file.fileId}
                fileId={file.fileId!}
                fileName={file.fileName}
                isUser={isUser}
                onClose={() => closeInlinePreview(file.fileId!)}
              />
            ))}
        </div>
      )}
      <OfficeFilePreviewDialog
        file={documentPreview}
        onOpenChange={(open) => !open && setDocumentPreview(null)}
      />
    </div>
  );
}

function FilePreview({
  fileId,
  fileName,
  isUser,
  onClose
}: {
  fileId: string;
  fileName?: string;
  isUser?: boolean;
  onClose: () => void;
}) {
  const query = useGetChatFileUrl(fileId);
  const data = query.data;
  const isImage = isPreviewableMimeType(data?.mime_type);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border",
        isUser ? "border-white/20 bg-black/10" : "border-slate-200 bg-slate-50"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-2 border-b px-2.5 py-1.5 text-[11px]",
          isUser
            ? "border-white/10 text-white/90"
            : "border-slate-200 text-slate-600"
        )}
      >
        <span className="truncate">
          {fileName ?? data?.original_name ?? "Preview"}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          title="Close preview"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {query.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </div>
      ) : query.isError ? (
        <div className="flex h-32 items-center justify-center px-4 text-center text-[11px] text-slate-500">
          Failed to load preview
        </div>
      ) : isImage && data?.file_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.file_url}
          alt={data.original_name ?? "Preview"}
          className="max-h-64 w-full object-contain"
        />
      ) : (
        <div className="flex h-32 flex-col items-center justify-center gap-2 px-4 text-center text-[11px] text-slate-500">
          <span>No image preview available for this file type.</span>
          <a
            href={data?.file_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md bg-slate-200/70 px-2 py-1 text-slate-700 transition-colors hover:bg-slate-300/70"
          >
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </a>
        </div>
      )}
    </div>
  );
}

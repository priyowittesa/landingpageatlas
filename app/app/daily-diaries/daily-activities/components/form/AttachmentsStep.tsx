"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon,
  TriangleAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadDiaryAttachment } from "../../hooks/useDailyDiaries";
import type {
  DiaryAttachmentCategory,
  DiaryAttachmentItem
} from "@/types/type-daily-diaries";

type Attachment = {
  id: string;
  file?: File;
  name: string;
  kind: DiaryAttachmentCategory;
  status: "uploading" | "done" | "error";
  previewUrl: string;
};

function toAttachment(item: DiaryAttachmentItem): Attachment {
  return {
    id: item.id,
    name: item.file_name,
    kind:
      item.category === "DIARY_ATTACHMENT_CATEGORY_PHOTO"
        ? "photo"
        : "document",
    status: "done",
    previewUrl: item.url
  };
}

export function AttachmentsStep({
  diaryId,
  existing = [],
  onUploadingChange
}: {
  diaryId: string | null;
  existing?: DiaryAttachmentItem[];
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [panelDismissed, setPanelDismissed] = useState(false);
  const [previewing, setPreviewing] = useState<Attachment | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const uploadingCount = attachments.filter(
    (item) => item.status === "uploading"
  ).length;
  const failedCount = attachments.filter(
    (item) => item.status === "error"
  ).length;

  useEffect(() => {
    onUploadingChange?.(uploadingCount > 0);
  }, [uploadingCount, onUploadingChange]);

  // Merge already-uploaded attachments in, keeping any local uploads intact.
  useEffect(() => {
    if (existing.length === 0) return;
    setAttachments((current) => {
      const known = new Set(current.map((item) => item.id));
      const incoming = existing
        .filter((item) => !known.has(item.id))
        .map(toAttachment);
      return incoming.length ? [...incoming, ...current] : current;
    });
  }, [existing]);

  function setAttachmentStatus(id: string, status: Attachment["status"]) {
    setAttachments((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  function handleFilesPicked(
    fileList: FileList | null,
    kind: DiaryAttachmentCategory
  ) {
    if (!fileList || fileList.length === 0) return;

    const newAttachments: (Attachment & { file: File })[] = Array.from(
      fileList
    ).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      kind,
      status: diaryId ? "uploading" : "error",
      previewUrl: URL.createObjectURL(file)
    }));

    setAttachments((current) => [...current, ...newAttachments]);
    setPanelDismissed(false);
    setPanelOpen(true);

    if (!diaryId) return;

    newAttachments.forEach((attachment) => {
      uploadDiaryAttachment({
        category: attachment.kind,
        diaryId,
        file: attachment.file
      })
        .then(() => setAttachmentStatus(attachment.id, "done"))
        .catch(() => setAttachmentStatus(attachment.id, "error"));
    });
  }

  return (
    <div className="mt-6">
      {!diaryId && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          The diary hasn&apos;t been created yet, so attachments can&apos;t be
          uploaded.
        </div>
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/jpg"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFilesPicked(event.target.files, "photo");
          event.target.value = "";
        }}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        multiple
        className="hidden"
        onChange={(event) => {
          handleFilesPicked(event.target.files, "document");
          event.target.value = "";
        }}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!diaryId}
          onClick={() => photoInputRef.current?.click()}
          className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-primary-300 bg-primary-50 text-primary-700 disabled:opacity-60"
        >
          <Camera className="h-6 w-6" />
          <strong className="mt-2 text-xs">Progress & Safety Photos</strong>
          <small className="mt-1 text-[9px] text-gray-500">
            Click to upload · Images JPEG, PNG, HEIC
          </small>
        </button>
        <button
          type="button"
          disabled={!diaryId}
          onClick={() => documentInputRef.current?.click()}
          className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600 disabled:opacity-60"
        >
          <FileText className="h-6 w-6" />
          <strong className="mt-2 text-xs">Documents & Reports</strong>
          <small className="mt-1 text-[9px] text-gray-500">
            Click to upload · PDF, DOCX, XLSX
          </small>
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <button
              key={attachment.id}
              type="button"
              disabled={attachment.status === "uploading"}
              onClick={() => setPreviewing(attachment)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px]",
                attachment.status === "uploading" &&
                  "cursor-not-allowed border-gray-200 text-gray-400",
                attachment.status === "done" &&
                  "border-primary-200 text-primary-700 hover:bg-primary-50",
                attachment.status === "error" &&
                  "border-red-200 text-red-600 hover:bg-red-50"
              )}
            >
              {attachment.status === "uploading" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : attachment.status === "error" ? (
                <TriangleAlert className="h-3 w-3" />
              ) : attachment.kind === "photo" ? (
                <ImageIcon className="h-3 w-3" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              <span className="max-w-32 truncate">{attachment.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Floating upload-progress popup, matching the "Creating Daily
          Diaries" panel from the reference screenshot. */}
      {attachments.length > 0 && !panelDismissed && (
        <div className="fixed right-6 top-20 z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
            <span className="text-xs font-semibold text-gray-700">
              {uploadingCount > 0
                ? `Uploading ${uploadingCount} file(s)`
                : failedCount > 0
                  ? `${failedCount} upload(s) failed`
                  : "Uploads complete"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPanelOpen((current) => !current)}
                className="text-gray-400 hover:text-gray-600"
              >
                {panelOpen ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setPanelDismissed(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {panelOpen && (
            <div className="max-h-56 space-y-1 overflow-y-auto p-2">
              {attachments.map((attachment) => (
                <button
                  key={attachment.id}
                  type="button"
                  disabled={attachment.status === "uploading"}
                  onClick={() => setPreviewing(attachment)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs",
                    attachment.status === "uploading" &&
                      "cursor-not-allowed text-gray-400",
                    attachment.status === "done" &&
                      "text-primary-700 hover:bg-primary-50",
                    attachment.status === "error" &&
                      "text-red-600 hover:bg-red-50"
                  )}
                >
                  {attachment.kind === "photo" ? (
                    <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {attachment.name}
                  </span>
                  {attachment.status === "uploading" && (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary-400" />
                  )}
                  {attachment.status === "error" && (
                    <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-red-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview modal — opens once a completed attachment is clicked. */}
      {previewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewing(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <span className="truncate text-sm font-semibold text-gray-700">
                {previewing.name}
              </span>
              <button
                type="button"
                onClick={() => setPreviewing(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex max-h-[65vh] items-center justify-center overflow-auto bg-gray-50 p-4">
              {previewing.kind === "photo" ? (
                <img
                  src={previewing.previewUrl}
                  alt={previewing.name}
                  className="max-h-full max-w-full rounded-md object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="text-xs text-gray-500">
                    Preview isn't available inline for this file type.
                  </p>
                  <a
                    href={previewing.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-primary-700 px-3 py-1.5 text-xs text-white"
                  >
                    Open in new tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

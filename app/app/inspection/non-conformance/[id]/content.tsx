"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Check, FileText, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { NonConformanceDetail } from "../use-non-conformance";
import {
  getNonConformanceUploadUrl,
  registerNonConformanceFile,
  uploadNonConformanceFileToS3,
  useDeleteNonConformanceFile,
  useNonConformanceFiles,
  useUpdateNonConformance,
  type FileUploadState
} from "../use-non-conformance";

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|svg|avif)$/i;

function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.test(fileName);
}

function formatDate(value: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function NonConformanceDetailContent({
  id,
  detail
}: {
  id: string;
  detail: NonConformanceDetail;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [resolutionNote, setResolutionNote] = useState("");
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateNonConformance = useUpdateNonConformance(id);
  const { data: files = [], refetch: refetchFiles } =
    useNonConformanceFiles(id);
  const deleteFile = useDeleteNonConformanceFile(id);
  const { nonConformance, inspection, inspectionItem } = detail;
  const isUploading = uploads.some(
    (upload) => !["success", "error", "idle"].includes(upload.status)
  );

  function setUploadStatus(index: number, patch: Partial<FileUploadState>) {
    setUploads((previous) =>
      previous.map((upload, current) =>
        current === index ? { ...upload, ...patch } : upload
      )
    );
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    event.target.value = "";
    const startIndex = uploads.length;
    setUploads((previous) => [
      ...previous,
      ...selected.map((file) => ({
        status: "idle" as const,
        fileName: file.name
      }))
    ]);
    const uploadedBy = user?.name ?? user?.id ?? "system";
    for (let index = 0; index < selected.length; index += 1) {
      const file = selected[index];
      try {
        setUploadStatus(startIndex + index, {
          status: "getting-upload-url",
          error: undefined
        });
        const { upload_url, storage_key } = await getNonConformanceUploadUrl(
          id,
          { file_name: file.name }
        );

        setUploadStatus(startIndex + index, { status: "uploading-s3" });
        await uploadNonConformanceFileToS3(upload_url, file);

        setUploadStatus(startIndex + index, { status: "registering" });
        await registerNonConformanceFile(id, {
          storage_key,
          uploaded_by: uploadedBy
        });
        setUploadStatus(startIndex + index, { status: "success" });
      } catch {
        setUploadStatus(startIndex + index, {
          status: "error",
          error: "Upload failed"
        });
      }
    }
    await refetchFiles();
    setUploads((previous) =>
      previous.filter((upload) => upload.status !== "success")
    );
  }

  function handleSubmit() {
    updateNonConformance.mutate(
      { id, resolution_note: resolutionNote },
      { onSuccess: () => router.push("/app/inspection/non-conformance") }
    );
  }

  return (
    <Card className="gap-0 rounded-xl border-gray-200 bg-white p-4 shadow-none sm:p-5">
      <h1 className="mb-4 text-base font-bold text-gray-900">
        {nonConformance.itemName || "Untitled item"}
      </h1>

      <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-4 sm:grid-cols-3">
        <div>
          <p className="text-[8px] font-medium uppercase tracking-wider text-primary-400">
            Source Inspection
          </p>
          {inspection.id ? (
            <Link
              href={`/app/inspection/run-inspection/view/${encodeURIComponent(
                inspection.id
              )}`}
              className="mt-1 inline-block text-[10px] font-medium text-primary-600 underline transition-colors hover:text-primary-800"
            >
              {inspection.name || "View source inspection"}
            </Link>
          ) : (
            <p className="mt-1 text-[10px] font-medium text-gray-400">-</p>
          )}
        </div>
        <div>
          <p className="text-[8px] font-medium uppercase tracking-wider text-gray-500">
            Raised By
          </p>
          <p className="mt-1 text-[10px] font-medium text-gray-800">
            {nonConformance.raisedBy || "-"}
          </p>
        </div>
        <div>
          <p className="text-[8px] font-medium uppercase tracking-wider text-gray-500">
            Raised Date
          </p>
          <p className="mt-1 text-[10px] font-medium text-gray-800">
            {formatDate(nonConformance.raisedDate)}
          </p>
        </div>
      </div>

      <section className="mt-2 rounded-lg border border-gray-200 p-3">
        <p className="text-[8px] font-semibold uppercase tracking-wider text-gray-500">
          Failure Notes
        </p>
        <p className="mt-2 text-[10px] text-gray-800">
          {inspectionItem.notes || nonConformance.notes || "No notes recorded."}
        </p>
        {detail.inspectionItemFiles.length > 0 && (
          <div className="mt-2 flex gap-2">
            {detail.inspectionItemFiles.map((file, index) => {
              const isImage = file.startsWith("http");
              return (
                <button
                  key={`${file}-${index}`}
                  type="button"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-md bg-gray-100 text-[8px] text-gray-400"
                  onClick={() => isImage && setPreviewUrl(file)}
                  disabled={!isImage}
                >
                  {isImage ? (
                    <img
                      src={file}
                      alt="Failure evidence"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-3">
        <p className="mb-2 text-[9px] font-semibold text-gray-800">
          Resolution
        </p>
        <div className="rounded-lg border border-gray-200 p-3">
          <p className="text-[8px] font-medium uppercase tracking-wider text-gray-500">
            Fix Evidence
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 gap-1 px-2 text-[9px] text-gray-500"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Camera className="h-3 w-3" />
            )}{" "}
            {isUploading ? "Uploading..." : "Add photo evidence"}
          </Button>

          {uploads.length > 0 && (
            <div className="mt-2 space-y-1">
              {uploads.map((upload, index) => (
                <div
                  key={`${upload.fileName}-${index}`}
                  className="flex items-center gap-2 text-[9px] text-gray-600"
                >
                  {upload.status === "success" ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : upload.status === "error" ? (
                    <span className="text-red-500">{upload.error}</span>
                  ) : (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {upload.fileName}
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {files.map((file) => {
                const displayName = file.file_name || file.storage_key;
                const imageUrl = isImageFile(displayName)
                  ? file.url
                  : undefined;
                return (
                  <div
                    key={file.id}
                    className="group relative overflow-hidden rounded-md border border-gray-200 bg-white"
                  >
                    <button
                      type="button"
                      className="block h-20 w-full cursor-pointer overflow-hidden bg-gray-100"
                      onClick={() => imageUrl && setPreviewUrl(imageUrl)}
                      disabled={!imageUrl}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={displayName}
                          className="h-full w-full object-cover transition group-hover:opacity-90"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <FileText className="h-6 w-6 text-gray-400" />
                        </span>
                      )}
                    </button>
                    <div className="flex items-center justify-between gap-1 px-1.5 py-1">
                      <span
                        className="truncate text-[8px] text-gray-600"
                        title={displayName}
                      >
                        {displayName}
                      </span>
                      <button
                        type="button"
                        className="shrink-0 text-gray-400 hover:text-red-500 disabled:opacity-50"
                        onClick={() => deleteFile.mutate({ fileId: file.id })}
                        disabled={deleteFile.isPending}
                        aria-label={`Delete ${displayName}`}
                      >
                        {deleteFile.isPending &&
                        deleteFile.variables?.fileId === file.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <label className="mt-4 block text-[8px] font-medium uppercase tracking-wider text-gray-500">
            Resolution Note <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder="Describe how this was fixed"
            className="mt-1 min-h-10 resize-none text-[10px]"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-[8px] text-gray-500">
              Add at least one fix photo and a resolution note to close.
            </p>
            <Button
              size="sm"
              className="h-7 shrink-0 bg-primary-300 px-4 text-[9px] hover:bg-primary-400"
              disabled={
                !resolutionNote.trim() || updateNonConformance.isPending
              }
              onClick={handleSubmit}
            >
              <Check className="h-3 w-3" />{" "}
              {updateNonConformance.isPending
                ? "Saving..."
                : "Close Non-Conformance"}
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        open={Boolean(previewUrl)}
        onOpenChange={(open) => !open && setPreviewUrl(null)}
      >
        <DialogContent
          className="max-w-3xl border-gray-200 bg-black/90 p-0 sm:max-w-3xl"
          showCloseButton
        >
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Fix evidence preview"
              className="max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

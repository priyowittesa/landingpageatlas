"use client";

import dynamic from "next/dynamic";
import { ArrowLeft, Check, File, FileImage, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { OfficeFilePreview } from "@/components/ai-assistant/OfficeFilePreviewDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAuthMe } from "@/hooks/useAuthMe";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { Button } from "@/components/ui/button";
import {
  useInspectionDetail,
  useVerifyInspection,
  useDeclineInspection,
  type InspectionDetailAttachment,
  type InspectionDetailItem
} from "../use-available-inspections";
import {
  RejectInspectionDialog,
  type RejectInspectionValues
} from "./reject-inspection-dialog";

const OfficeFilePreviewDialog = dynamic(
  () =>
    import("@/components/ai-assistant/OfficeFilePreviewDialog").then(
      (module) => module.OfficeFilePreviewDialog
    ),
  { ssr: false }
);

const APPROVABLE_STATUSES = [
  "INSPECTION_STATUS_CHECKED",
  "INSPECTION_STATUS_VERIFIED"
];
const IMAGE_FILE_EXTENSIONS = new Set([
  "avif",
  "bmp",
  "gif",
  "jpeg",
  "jpg",
  "png",
  "svg",
  "webp"
]);

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
}

function getFileExtension(fileName: string, fileUrl = "") {
  const extension = (source: string) =>
    source
      .split(/[?#]/)[0]
      .match(/\.([^.\/]+)$/)?.[1]
      ?.toLowerCase() ?? "";
  return extension(fileName) || extension(fileUrl);
}

function ResultBadge({ result }: { result: string }) {
  const passed = result.toLowerCase() === "pass";
  const failed = result.toLowerCase() === "fail";
  if (!passed && !failed)
    return (
      <span className="text-xs font-medium text-gray-400">Not recorded</span>
    );
  const Icon = passed ? Check : X;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${passed ? "border-teal-400 bg-teal-50 text-teal-600" : "border-red-400 bg-red-50 text-red-600"}`}
    >
      <Icon className="h-3 w-3" />
      {passed ? "PASS" : "FAIL"}
    </span>
  );
}

function ChecklistItem({
  item,
  index,
  onPreviewAttachment
}: {
  item: InspectionDetailItem;
  index: number;
  onPreviewAttachment: (attachment: InspectionDetailAttachment) => void;
}) {
  const failed = item.result.toLowerCase() === "fail";
  const isNumber = item.itemType.toLowerCase() === "number";
  const acceptableRange =
    item.expectedRange ||
    (isNumber ? `${item.itemMinValue} to ${item.itemMaxValue}` : "");
  return (
    <article className="border-t border-gray-100 px-3 py-4 first:border-t-0 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800">
            {index + 1}. {item.label}
          </p>
          {acceptableRange && (
            <p className="mt-1 text-[10px] text-gray-400">
              Acceptable range: {acceptableRange}
            </p>
          )}
        </div>
        <ResultBadge result={item.result} />
      </div>
      {item.attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {item.attachments.map((attachment, attachmentIndex) => {
            const extension = getFileExtension(attachment.name, attachment.url);
            const isImage = IMAGE_FILE_EXTENSIONS.has(extension);
            return attachment.url ? (
              <button
                type="button"
                key={`${attachment.id}-${attachmentIndex}`}
                onClick={() => onPreviewAttachment(attachment)}
                className={`group relative flex overflow-hidden rounded-md border border-gray-200 bg-gray-50 text-left transition hover:border-primary-300 hover:bg-primary-50 ${isImage ? (isNumber ? "h-12 w-12" : "h-20 w-20") : "h-12 max-w-56 items-center gap-2 px-2.5"}`}
                title={`Preview ${attachment.name}`}
              >
                {isImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </>
                ) : (
                  <>
                    <File className="h-4 w-4 shrink-0 text-primary-500" />
                    <span className="truncate text-[10px] font-medium text-gray-600">
                      {attachment.name}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div
                key={`${attachment.id}-${attachmentIndex}`}
                className="flex h-9 max-w-44 items-center gap-1.5 overflow-hidden rounded border border-gray-200 bg-gray-50 px-2 text-[10px] text-gray-500"
              >
                <FileImage className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <span className="truncate">{attachment.name}</span>
              </div>
            );
          })}
        </div>
      )}
      {isNumber ? (
        <div className="mt-2 space-y-0.5 text-[10px] text-gray-400">
          <p>
            Measured value:{" "}
            <span className="font-semibold text-gray-700">
              {item.numberValue}
            </span>
          </p>
          <p>Notes: {item.notes || "-"}</p>
        </div>
      ) : (
        item.notes && (
          <div
            className={`mt-3 rounded-md px-2.5 py-2 text-[10px] ${failed ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}
          >
            <span className="font-semibold">
              {failed ? "Inspector note:" : "Notes:"}
            </span>
            <br />
            {item.notes}
          </div>
        )
      )}
    </article>
  );
}

export function InspectionDetailView({
  inspectionId
}: {
  inspectionId: string;
}) {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { collapsed } = useSidebar();
  const { data: me } = useAuthMe();
  const hasRunInspectionFullAccess = useMemo(() => {
    const modules = me?.rbac?.modules ?? [];
    const hasFullAccess = (key: string) =>
      modules.some(
        (module) =>
          (module.key === key && module.access_level === "full_access") ||
          module.sub_modules?.some(
            (sub) => sub.key === key && sub.access_level === "full_access"
          )
      );
    return hasFullAccess("inspection-feature");
  }, [me?.rbac?.modules]);
  const { data: inspection, isLoading } = useInspectionDetail(inspectionId);
  const verifyInspection = useVerifyInspection(inspectionId);
  const declineInspection = useDeclineInspection(inspectionId);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<OfficeFilePreview | null>(
    null
  );
  const groups = useMemo(() => {
    if (!inspection) return [] as [string, InspectionDetailItem[]][];
    return Object.entries(
      inspection.items.reduce<Record<string, InspectionDetailItem[]>>(
        (all, item) => {
          (all[item.section] ??= []).push(item);
          return all;
        },
        {}
      )
    );
  }, [inspection]);
  if (isLoading)
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
      </div>
    );
  if (!inspection)
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Inspection details could not be found.
      </div>
    );
  const passed = inspection.items.filter(
    (item) => item.result.toLowerCase() === "pass"
  ).length;
  const failed = inspection.items.filter(
    (item) => item.result.toLowerCase() === "fail"
  ).length;
  const total = inspection.items.length;
  const passPercent = total ? (passed / total) * 100 : 0;
  const canReview =
    APPROVABLE_STATUSES.includes(inspection.status) &&
    hasRunInspectionFullAccess;
  const isVerified = inspection.status === "INSPECTION_STATUS_VERIFIED";
  const verifyButtonLabel = isVerified ? "Accept" : "Verify";

  function handlePreviewAttachment(attachment: InspectionDetailAttachment) {
    const fileName =
      attachment.name || attachment.storageKey.split("/").pop() || "attachment";
    setPreviewFile({
      fileId: attachment.id || attachment.storageKey || attachment.url,
      displayName: fileName,
      fileName,
      fileUrl: attachment.url,
      fileType: getFileExtension(fileName, attachment.url)
    });
  }

  function handleVerify() {
    verifyInspection.mutate(
      {
        approval_by: user?.name ?? user?.id ?? ""
      },
      {
        onSuccess: () => {
          router.push("/app/inspection/run-inspection");
        }
      }
    );
  }

  function handleReject(
    values: RejectInspectionValues,
    closeDialog: () => void
  ) {
    declineInspection.mutate(
      {
        approval_by: user?.name ?? user?.id ?? "",
        is_general: values.isGeneral,
        reason: values.reason,
        item_rejects: values.itemRejects
      },
      {
        onSuccess: () => {
          closeDialog();
          router.push("/app/inspection/run-inspection");
        }
      }
    );
  }

  return (
    <div
      className={`mx-auto max-w-7xl space-y-3 ${canReview ? "pb-24" : "pb-10"}`}
    >
      <button
        type="button"
        onClick={() => router.push("/app/inspection/run-inspection")}
        className="flex items-center gap-2 py-1 text-sm font-semibold text-gray-900 hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {inspection.templateName || inspection.name || "Inspection details"}
      </button>
      <section className="rounded-xl border border-gray-200 bg-white px-3 py-4 sm:px-5">
        <p className="text-[10px] font-medium uppercase text-slate-400">
          Inspection details
        </p>
        <div className="mt-2 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[10px] text-slate-400">Template Name</p>
            <p className="font-semibold text-gray-800">
              {inspection.templateName || inspection.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Asset Name</p>
            <p className="font-semibold text-gray-800">
              {inspection.equipmentName || "-"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Date Completed</p>
            <p className="font-semibold text-gray-800">
              {formatDate(inspection.completedAt)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Inspector</p>
            <p className="font-semibold text-gray-800">
              {inspection.inspector || "-"}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-gray-200 bg-white px-3 py-4 sm:px-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase text-slate-400">
            Checklist results
          </p>
          <p className="text-[10px] font-semibold text-gray-700">
            {total} Items Total
          </p>
        </div>
        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="bg-teal-500" style={{ width: `${passPercent}%` }} />
          <div
            className="bg-red-500"
            style={{ width: `${total ? (failed / total) * 100 : 0}%` }}
          />
        </div>
        <div className="mt-2 flex gap-2 text-[10px] font-semibold">
          <span className="rounded bg-teal-50 px-1.5 py-0.5 text-teal-600">
            • {passed} Passed
          </span>
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600">
            • {failed} Failed
          </span>
        </div>
      </section>
      {groups.map(([section, items]) => (
        <section
          key={section}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <h2 className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-800 sm:px-5">
            {section}
          </h2>
          {items.map((item, index) => (
            <ChecklistItem
              key={item.id}
              item={item}
              index={index}
              onPreviewAttachment={handlePreviewAttachment}
            />
          ))}
        </section>
      ))}
      {canReview && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] transition-all duration-300 ease-in-out ${collapsed ? "lg:left-16" : "lg:left-64"}`}
        >
          <div className="mx-auto flex max-w-7xl justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(true)}
              disabled={
                verifyInspection.isPending || declineInspection.isPending
              }
            >
              Reject
            </Button>
            <Button
              onClick={handleVerify}
              disabled={
                verifyInspection.isPending || declineInspection.isPending
              }
            >
              {verifyInspection.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {verifyButtonLabel}
            </Button>
          </div>
        </div>
      )}
      <RejectInspectionDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title={
          inspection.name || inspection.templateName || "Reject inspection"
        }
        items={inspection.items}
        isPending={declineInspection.isPending}
        onReject={handleReject}
      />
      <OfficeFilePreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  );
}

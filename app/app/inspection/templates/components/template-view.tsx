"use client";

import { format } from "date-fns";
import { ArrowLeft, CircleCheck, Paperclip } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OfficeFilePreview } from "@/components/ai-assistant/OfficeFilePreviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useTemplateDetail, useTemplateVersionHistory } from "../use-templates";
import { VersionHistoryPopover } from "./version-history-popover";
import {
  FREQUENCY_LABELS,
  type TemplateCategory,
  type TemplateDetailReference,
  type TemplateStatus
} from "../types";

const OfficeFilePreviewDialog = dynamic(
  () =>
    import("@/components/ai-assistant/OfficeFilePreviewDialog").then(
      (module) => module.OfficeFilePreviewDialog
    ),
  { ssr: false }
);

const STATUS_BADGE_CLASS: Record<TemplateStatus, string> = {
  Draft: "bg-blue-50 text-blue-700",
  Archived: "bg-amber-50 text-amber-700",
  Published: "bg-emerald-50 text-emerald-700"
};

function normalizeStatus(value: string): TemplateStatus | undefined {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized.includes("draft")) return "Draft";
  if (normalized.includes("published") || normalized.includes("publish"))
    return "Published";
  if (normalized.includes("archived") || normalized.includes("archive"))
    return "Archived";
  return undefined;
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() <= 1970) return "";
  return format(date, "MMM d, yyyy");
}

function getFileExtension(fileName: string, fileUrl = "") {
  const extension = (source: string) =>
    source
      .split(/[?#]/)[0]
      .match(/\.([^.\/]+)$/)?.[1]
      ?.toLowerCase() ?? "";
  return extension(fileName) || extension(fileUrl);
}

export function TemplateView({
  familyId,
  templateId,
  category
}: {
  familyId: string;
  templateId: string;
  category: TemplateCategory;
}) {
  const router = useRouter();
  const isAsset = category === "asset";
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>(
    undefined
  );
  const [previewFile, setPreviewFile] = useState<OfficeFilePreview | null>(
    null
  );

  const {
    data: detail,
    isLoading,
    isError,
    error
  } = useTemplateDetail(familyId, templateId, category, selectedVersion);

  const { data: versionHistory, isLoading: versionHistoryLoading } =
    useTemplateVersionHistory(familyId, category, detail?.versionList ?? []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl pb-10">
        <p className="text-sm text-gray-400">Loading template...</p>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="mx-auto max-w-6xl pb-10">
        <p className="text-sm text-red-500">
          Failed to load template.
          {error ? ` ${error.message}` : ""}
        </p>
      </div>
    );
  }

  const status = normalizeStatus(detail.status);
  const titleLabel = isAsset
    ? "Asset Inspection Template"
    : "Quality Inspection Template";

  const handleSelectVersion = (version: number) => {
    setSelectedVersion(version);
  };

  const handlePreviewReference = (reference: TemplateDetailReference) => {
    if (!reference.url) return;
    const fileName =
      reference.storageKey.split("/").pop() || "reference attachment";
    setPreviewFile({
      fileId: reference.id || reference.storageKey || reference.url,
      displayName: fileName,
      fileName,
      fileUrl: reference.url,
      fileType: getFileExtension(fileName, reference.url)
    });
  };

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <button
        onClick={() => router.push("/app/inspection/templates")}
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {titleLabel}
      </button>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded bg-primary-50 px-2 py-1 text-xs font-bold tracking-wide text-primary-700">
          {isAsset ? "ASSET TEMPLATE" : "QUALITY TEMPLATE"}
        </span>
        <VersionHistoryPopover
          currentVersion={detail.version}
          versions={versionHistory}
          isLoading={versionHistoryLoading}
          onSelectVersion={handleSelectVersion}
        />
        {status && (
          <Badge variant="secondary" className={STATUS_BADGE_CLASS[status]}>
            {status}
          </Badge>
        )}
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(
                `/app/inspection/templates/${familyId}/${templateId}/edit?category=${category}`
              )
            }
          >
            Edit
          </Button>
        </div>
      </div>
      <Card className="p-5 sm:p-7">
        <h1 className="text-xl font-bold text-gray-950">
          {detail.name || "Untitled Template"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isAsset
            ? "Asset inspection template details"
            : "Quality inspection template details"}
        </p>

        <Card className="mt-5 gap-0 rounded-lg p-4 sm:p-5">
          <div className="grid gap-5 md:grid-cols-2">
            {isAsset ? (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Equipment
                  </label>
                  <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {detail.equipmentName || detail.equipmentId || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Inspection frequency
                  </label>
                  <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800">
                    {detail.frequency
                      ? (FREQUENCY_LABELS[detail.frequency] ?? detail.frequency)
                      : "-"}
                  </p>
                </div>
              </>
            ) : (
              <div className="md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Products/Parts
                </label>
                {detail.products.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {detail.products.map((p) => (
                      <span
                        key={p.productId}
                        className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {p.partName} - {p.partNumber}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-400">
                    No products
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Created by
              </label>
              <p className="mt-2 text-sm text-gray-800">
                {detail.createdBy || "-"}
                {detail.createdAt ? ` • ${formatDate(detail.createdAt)}` : ""}
              </p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Last updated by
              </label>
              <p className="mt-2 text-sm text-gray-800">
                {detail.updatedBy || "-"}
                {detail.publishedAt
                  ? ` • ${formatDate(detail.publishedAt)}`
                  : ""}
              </p>
            </div>
          </div>

          {isAsset && (
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <Switch
                  checked={detail.isUsageTracking}
                  disabled
                  aria-label="Usage Tracking"
                />
                <span className="text-sm font-semibold text-gray-900">
                  Usage Tracking
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Adds a usage/meter reading (hours, mileage, or cycles) from the
                machine&apos;s own data that the Engineer records during
                inspection, alongside the checklist.
              </p>
            </div>
          )}

          {detail.references.length > 0 && (
            <div className="mt-5">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Reference files
              </span>
              <div className="mt-2 space-y-2">
                {detail.references.map((ref) => {
                  const fileName =
                    ref.storageKey.split("/").pop() || "reference";
                  return (
                    <button
                      type="button"
                      key={ref.id}
                      disabled={!ref.url}
                      onClick={() => handlePreviewReference(ref)}
                      className="flex w-full items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-left text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      title={ref.url ? `Preview ${fileName}` : fileName}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate font-medium text-gray-700">
                          {fileName}
                        </span>
                        <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        <div className="mt-5 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">
            Checklist Sections
          </h2>
        </div>
        <div className="mt-3 space-y-3">
          {detail.sections.length === 0 ? (
            <p className="text-sm text-gray-400">No sections defined.</p>
          ) : (
            detail.sections.map((section) => (
              <Card
                key={section.id}
                className="gap-0 overflow-hidden rounded-lg p-0"
              >
                <CardHeader className="flex-row items-center gap-2 bg-gray-50 p-3 space-y-0">
                  <span className="text-sm font-semibold text-gray-900">
                    {section.name || "Untitled section"}
                  </span>
                </CardHeader>
                <CardContent className="space-y-2 p-3">
                  {section.items.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-gray-400">
                      No items in this section.
                    </p>
                  ) : (
                    section.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-2 rounded-md bg-gray-50 p-2"
                      >
                        <span className="flex-1 text-sm text-gray-800">
                          {item.label || "Untitled item"}
                        </span>
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-600"
                        >
                          {item.type === "number" ? "Number" : "Pass/Fail"}
                        </Badge>
                        {item.type === "number" && (
                          <span className="text-xs text-gray-500">
                            {item.minValue || "0"} to {item.maxValue || "0"}
                          </span>
                        )}
                        {item.controlPoints.length > 0 && (
                          <div className="flex w-full flex-wrap items-center gap-1.5 pl-1 pt-0.5">
                            {item.controlPoints.map((cp) => (
                              <span
                                key={cp.control_point_id}
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white"
                                style={{ backgroundColor: cp.color }}
                              >
                                <span className="h-2 w-2 shrink-0 rounded-full bg-white/80" />
                                {cp.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Card>
      <OfficeFilePreviewDialog
        file={previewFile}
        onOpenChange={(open) => !open && setPreviewFile(null)}
      />
    </div>
  );
}

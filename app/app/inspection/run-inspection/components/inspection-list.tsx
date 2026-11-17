"use client";

import { ClipboardList, Eye, Layers, Pencil, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TableColumn } from "@/types/type";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import {
  RunInspectionDialog,
  type ItemResult,
  type RunInspectionItem
} from "./run-inspection-dialog";
import {
  EMPTY_INSPECTION_USAGE_TRACKING,
  useInspectionDetail,
  useInspectionUsageTracking,
  useUpdateInspection
} from "../use-available-inspections";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTemplateDetail } from "../../templates/use-templates";

const axios = axiosConfig(env.apiBaseUrl);
const INSPECTION_URL = "/v1/manufacturing/inspection";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type InspectionRun = {
  id: string;
  name: string;
  category: "Asset" | "Quality";
  status: string;
  startedAt: string;
};

function normalizeInspection(raw: unknown): InspectionRun {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const category = String(row.category ?? "");
  const startedAt = String(row.started_at ?? "");
  let formattedDate = "-";
  if (startedAt) {
    const date = new Date(startedAt);
    if (!isNaN(date.getTime())) {
      formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  }
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? "Untitled"),
    category: category === "quality" ? "Quality" : "Asset",
    status: String(row.status ?? ""),
    startedAt: formattedDate
  };
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("progress") || s.includes("draft"))
    return "bg-amber-100 text-amber-700";
  if (s.includes("accept") || s.includes("checked"))
    return "bg-emerald-100 text-emerald-700";
  if (s.includes("reject") || s.includes("fail"))
    return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

function formatStatus(status: string): string {
  const s = status.replace("INSPECTION_STATUS_", "").toLowerCase();
  return s
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type InspectionType = "asset" | "quality";

const inspectionTypeOptions: {
  value: InspectionType;
  title: string;
  description: string;
  icon: typeof Settings2;
}[] = [
  {
    value: "asset",
    title: "Asset Inspection",
    description: "Recurring Checklist tied to a specific Asset",
    icon: Settings2
  },
  {
    value: "quality",
    title: "Quality Inspection",
    description: "Check a product or part after a process finishes",
    icon: Layers
  }
];

export function InspectionList() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | InspectionRun["category"]>(
    "All"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [inspectionType, setInspectionType] = useState<InspectionType>("asset");
  const [editInspectionId, setEditInspectionId] = useState<string | null>(null);

  const { user } = useCurrentUser();
  const inspectionDetail = useInspectionDetail(editInspectionId);
  const editDetail = inspectionDetail.data;
  const editIsAsset = editDetail?.category === "asset";
  const editTemplateDetail = useTemplateDetail(
    editDetail?.templateFamilyId,
    editDetail?.templateId,
    editDetail?.category ?? "asset",
    editDetail?.templateVersion || undefined
  );
  const editUsageTrackingEnabled =
    editIsAsset &&
    (editTemplateDetail.data?.isUsageTracking ??
      editDetail?.isUsageTracking ??
      false);
  const editUsageTracking = useInspectionUsageTracking(
    editTemplateDetail.data?.equipmentId || editDetail?.equipmentId,
    editUsageTrackingEnabled,
    editTemplateDetail.data?.equipmentUsage
  );
  const updateInspection = useUpdateInspection(editInspectionId);

  const { data, isLoading, isError, refetch } = useQuery<
    InspectionRun[],
    AxiosError<ApiResponseError>
  >({
    queryKey: ["inspections"],
    queryFn: async () => {
      const inspections: InspectionRun[] = [];
      const seenTokens = new Set<string>();
      let pageToken = "";

      do {
        const res = await axios.get(INSPECTION_URL, {
          params: {
            page_size: 100,
            ...(pageToken ? { page_token: pageToken } : {})
          }
        });
        const body = (res.data?.data ?? res.data) as Record<string, unknown>;
        const rows = Array.isArray(body.rows)
          ? body.rows
          : Array.isArray(body.items)
            ? body.items
            : Array.isArray(body.results)
              ? body.results
              : [];
        inspections.push(...rows.map(normalizeInspection));

        const nextToken = String(
          body.next_page_token ?? body.nextPageToken ?? ""
        );
        if (!nextToken || seenTokens.has(nextToken)) break;
        seenTokens.add(nextToken);
        pageToken = nextToken;
      } while (pageToken);

      return inspections;
    },
    meta: { errorMessage: "Failed to load inspections" }
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const inspections = data ?? [];
    return inspections.filter(
      (inspection) =>
        (category === "All" || inspection.category === category) &&
        (!query || inspection.name.toLowerCase().includes(query))
    );
  }, [data, search, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedInspections = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const editItems = useMemo<RunInspectionItem[]>(() => {
    const detail = inspectionDetail.data;
    if (!detail) return [];
    const templateItems = editTemplateDetail.data?.sections.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        sectionId: section.id,
        sectionName: section.name
      }))
    ) ?? [];
    const templateItemsById = new Map(
      templateItems.map((item, index) => [item.id, { ...item, index }])
    );

    return detail.items
      .map((item, index): RunInspectionItem => {
        const templateItem = templateItemsById.get(item.itemId);
        return {
          id: item.itemId,
          label: templateItem?.label || item.label || `Item ${index + 1}`,
          type: item.itemType === "number" ? "number" : "pass_fail",
          minValue: item.itemMinValue,
          maxValue: item.itemMaxValue,
          sectionId: templateItem?.sectionId,
          sectionName: templateItem?.sectionName || item.section || "General"
        };
      })
      .sort(
        (a, b) =>
          (templateItemsById.get(a.id)?.index ?? Number.MAX_SAFE_INTEGER) -
          (templateItemsById.get(b.id)?.index ?? Number.MAX_SAFE_INTEGER)
      );
  }, [inspectionDetail.data, editTemplateDetail.data]);

  const editSections = useMemo(() => {
    if (
      editTemplateDetail.data?.sections &&
      editTemplateDetail.data.sections.length > 0
    ) {
      return editTemplateDetail.data.sections
        .filter((s) => s.items && s.items.length > 0)
        .map((s) => ({ id: s.id, name: s.name }));
    }
    return undefined;
  }, [editTemplateDetail.data]);

  const editInitialResults = useMemo<Record<string, ItemResult>>(() => {
    const detail = inspectionDetail.data;
    if (!detail) return {};
    const results: Record<string, ItemResult> = {};
    for (const item of detail.items) {
      const resultLower = item.result.toLowerCase();
      results[item.itemId] = {
        value: item.numberValue ? String(item.numberValue) : "",
        passed:
          resultLower === "pass"
            ? true
            : resultLower === "fail"
              ? false
              : undefined,
        notes: item.notes,
        file_names: item.attachments.map((att) => att.name),
        files: []
      };
    }
    return results;
  }, [inspectionDetail.data]);

  const editTitle = useMemo(() => {
    const detail = inspectionDetail.data;
    if (!detail) return "";
    return detail.equipmentName || detail.name || "Edit Inspection";
  }, [inspectionDetail.data]);

  const columns: TableColumn<InspectionRun>[] = [
    {
      key: "name",
      header: "Inspection",
      render: (row) => (
        <span className="font-semibold text-primary-700">{row.name}</span>
      )
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <Badge
          variant="secondary"
          className={
            row.category === "Asset"
              ? "bg-teal-100 text-teal-700"
              : "bg-primary-100 text-primary-700"
          }
        >
          {row.category}
        </Badge>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant="secondary" className={statusBadgeClass(row.status)}>
          {formatStatus(row.status)}
        </Badge>
      )
    },
    {
      key: "startedAt",
      header: "Started",
      className: "text-muted-foreground"
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label={`View ${row.name}`}
            onClick={() =>
              router.push(`/app/inspection/run-inspection/view/${row.id}`)
            }
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {row.status.includes("IN_PROGRESS") && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
              aria-label={`Edit ${row.name}`}
              onClick={() => setEditInspectionId(row.id)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Inspection"
        subtitle="Run checklist and manage sign-off"
        addBtnLabel="Start New Inspection"
        handleAdd={() => setStartDialogOpen(true)}
      />

      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50">
              <ClipboardList className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <DialogTitle>Start a new inspection</DialogTitle>
              <DialogDescription className="mt-1">
                Select the type of inspection you want to run
              </DialogDescription>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {inspectionTypeOptions.map((option) => {
              const selected = inspectionType === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setInspectionType(option.value)}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    selected
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    {option.title}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStartDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setStartDialogOpen(false);
                router.push(
                  `/app/inspection/run-inspection/new?type=${inspectionType}`
                );
              }}
            >
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading inspections...
        </div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Inspection data could not be loaded.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={paginatedInspections}
          getRowId={(row) => row.id}
          name="inspection"
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder="Search inspections..."
          filters={[
            {
              key: "category",
              placeholder: "All Categories",
              value: category,
              onChange: (value) => {
                setCategory(value as "All" | InspectionRun["category"]);
                setPage(1);
              },
              options: [
                { label: "All Categories", value: "All" },
                { label: "Asset", value: "Asset" },
                { label: "Quality", value: "Quality" }
              ]
            }
          ]}
          emptyState={
            search.trim() || category !== "All"
              ? { description: "Try changing your search or filters." }
              : {
                  description: "Get started by running your first inspection.",
                  actionLabel: "Start New Inspection",
                  onAction: () => setStartDialogOpen(true)
                }
          }
          pagination={{
            page: currentPage,
            pageSize,
            totalEntries: filtered.length,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            }
          }}
        />
      )}

      <RunInspectionDialog
        key={
          editInspectionId && inspectionDetail.data
            ? `${editInspectionId}-${inspectionDetail.data.templateVersion}-${
                editUsageTracking.data ? "usage-ready" : "base"
              }`
            : "edit-inspection"
        }
        open={editInspectionId !== null}
        onOpenChange={(open) => {
          if (!open) setEditInspectionId(null);
        }}
        title={editTitle}
        items={editItems}
        sections={editSections}
        templateId={inspectionDetail.data?.templateId}
        initialResults={editInitialResults}
        initialCurrentUsage={
          inspectionDetail.data?.currentUsage ||
          editUsageTracking.data?.currentUsage
        }
        usageTracking={
          editUsageTrackingEnabled
            ? (editUsageTracking.data ?? EMPTY_INSPECTION_USAGE_TRACKING)
            : undefined
        }
        isLoading={
          inspectionDetail.isLoading ||
          (Boolean(editDetail?.templateFamilyId) &&
            editTemplateDetail.isLoading) ||
          (editUsageTrackingEnabled && editUsageTracking.isLoading)
        }
        isSubmitting={updateInspection.isPending}
        onSubmit={(isDraft, results, currentUsage) => {
          const detail = inspectionDetail.data;
          if (!detail || !user) return;
          const payloadItems = detail.items
            .map((item) => {
              const result = results[item.itemId];
              if (
                !result ||
                (result.passed === undefined &&
                  result.value.trim().length === 0 &&
                  result.notes.trim().length === 0 &&
                  result.file_names.length === 0)
              ) {
                return null;
              }
              const status =
                result.passed === true
                  ? "pass"
                  : result.passed === false
                    ? "fail"
                    : "null";
              return {
                is_pass: result.passed ?? false,
                item_id: item.id,
                notes: result.notes,
                number_value: Number(result.value) || 0,
                status,
                template_item_id: item.itemId
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
          const filesByItem: Record<string, File[]> = {};
          for (const item of detail.items) {
            const result = results[item.itemId];
            if (result?.files && result.files.length > 0) {
              filesByItem[item.itemId] = result.files;
            }
          }
          updateInspection.mutate(
            {
              is_draft: isDraft,
              items: payloadItems,
              updated_by: user.name ?? user.id ?? "",
              ...(editUsageTrackingEnabled
                ? {
                    current_usage: currentUsage ?? "",
                    is_usage_tracking: true
                  }
                : {}),
              ...(Object.keys(filesByItem).length > 0 ? { filesByItem } : {})
            },
            {
              onSuccess: () => {
                setEditInspectionId(null);
              }
            }
          );
        }}
      />
    </div>
  );
}

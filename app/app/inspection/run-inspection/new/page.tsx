"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TableColumn } from "@/types/type";
import {
  EMPTY_INSPECTION_USAGE_TRACKING,
  useAvailableInspections,
  useInspectionUsageTracking,
  useSubmitInspection,
  type AvailableInspectionItem,
  type SubmitInspectionPayload
} from "../use-available-inspections";
import { useTemplateDetail } from "../../templates/use-templates";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  RunInspectionDialog,
  SelectProductDialog,
  type RunInspectionItem,
  type ProductOption
} from "../components/run-inspection-dialog";

const API_PAGE_SIZE = 100;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function StartNewInspectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") === "quality" ? "quality" : "asset";
  const isAsset = type === "asset";

  const query = useAvailableInspections(type, {
    page_size: API_PAGE_SIZE
  });
  const items = useMemo(
    () => (query.data?.items ?? []).filter((item) => item.isAvailable),
    [query.data?.items]
  );

  const { user } = useCurrentUser();
  const submitInspection = useSubmitInspection(type);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [selectedTemplate, setSelectedTemplate] = useState<{
    templateId: string;
    familyId: string;
    name: string;
    productId?: string;
    version?: number;
  } | null>(null);

  const { data: templateDetail, isLoading: detailLoading } = useTemplateDetail(
    selectedTemplate?.familyId,
    selectedTemplate?.templateId,
    type,
    selectedTemplate?.version
  );
  const isUsageTracking = isAsset && templateDetail?.isUsageTracking === true;
  const usageTracking = useInspectionUsageTracking(
    templateDetail?.equipmentId,
    isUsageTracking,
    templateDetail?.equipmentUsage
  );

  const runItems = useMemo<RunInspectionItem[]>(() => {
    if (!templateDetail) return [];
    const items: RunInspectionItem[] = [];
    for (const section of templateDetail.sections) {
      for (const item of section.items) {
        const cpValue = item.controlPoints[0]?.value?.toLowerCase();
        const controlPoint =
          cpValue === "hold_point"
            ? "HOLD_POINT"
            : cpValue === "witness"
              ? "WITNESS"
              : cpValue === "surveillance"
                ? "SURVEILLANCE"
                : undefined;
        items.push({
          id: item.id,
          label: item.label,
          type: item.type === "number" ? "number" : "pass_fail",
          minValue: item.minValue ? Number(item.minValue) : undefined,
          maxValue: item.maxValue ? Number(item.maxValue) : undefined,
          controlPoint,
          holdPoint: cpValue === "hold_point",
          sectionId: section.id,
          sectionName: section.name
        });
      }
    }
    return items;
  }, [templateDetail]);

  const inspectionSections = useMemo(() => {
    if (!templateDetail?.sections) return [];
    return templateDetail.sections
      .filter((section) => section.items && section.items.length > 0)
      .map((section) => ({
        id: section.id,
        name: section.name
      }));
  }, [templateDetail]);

  const [productDialogItem, setProductDialogItem] = useState<{
    name: string;
    templateId: string;
    familyId: string;
    products: ProductOption[];
    version: number;
  } | null>(null);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return items;
    return items.filter((item) =>
      [
        item.name,
        item.templateName,
        item.code,
        ...item.products.map((p) => p.label)
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [search, items]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const title = isAsset ? "Select a Asset" : "Select a Quality Checklist";
  const subtitle = isAsset
    ? "Choose the Asset to inspect. Only Assets with a published template are available."
    : "Choose the checklist template that applies to your part or product";

  const revisionColumn: TableColumn<AvailableInspectionItem> = {
    key: "revision",
    header: "Revisions",
    render: (row) =>
      row.revision ? (
        <Badge variant="secondary" className="bg-primary-50 text-primary-700">
          {row.revision}
        </Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
  };
  const columns: TableColumn<AvailableInspectionItem>[] = [
    ...(isAsset
      ? ([
          {
            key: "name",
            header: "Asset",
            render: (row) => (
              <span className="font-semibold text-primary-700">{row.name}</span>
            )
          },
          {
            key: "templateName",
            header: "Template",
            className: "text-muted-foreground"
          },
          revisionColumn,
          {
            key: "status",
            header: "Out Status",
            render: (row) =>
              row.status ? (
                <Badge variant="outline">{row.status}</Badge>
              ) : (
                <span className="text-muted-foreground">-</span>
              )
          }
        ] satisfies TableColumn<AvailableInspectionItem>[])
      : ([
          {
            key: "templateName",
            header: "Template",
            render: (row) => (
              <span className="font-semibold text-primary-700">
                {row.templateName || row.name}
              </span>
            )
          },
          revisionColumn,
          {
            key: "products",
            header: "Applies To",
            render: (row) => (
              <span className="block max-w-64 whitespace-normal text-muted-foreground">
                {row.products.map((product) => product.label).join(", ") || "-"}
              </span>
            )
          }
        ] satisfies TableColumn<AvailableInspectionItem>[])),
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end">
          <Button
            size="icon"
            className="h-8 w-8"
            aria-label={`Start inspection for ${isAsset ? row.name : row.templateName || row.name}`}
            onClick={() => {
              if (isAsset) {
                setSelectedTemplate({
                  templateId: row.id,
                  familyId: row.familyId,
                  name: row.name,
                  version: row.version
                });
              } else {
                setProductDialogItem({
                  name: row.templateName || row.name,
                  templateId: row.id,
                  familyId: row.familyId,
                  products: row.products,
                  version: row.version
                });
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.push("/app/inspection/run-inspection")}
          className="mt-1 inline-flex items-center text-gray-800"
          aria-label="Back to inspections"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PageHeader title={title} subtitle={subtitle} />
      </div>

      {query.isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading available inspections...
        </div>
      ) : query.isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Available inspections could not be loaded.
          </p>
          <Button variant="outline" onClick={() => query.refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={paginated}
          getRowId={(row) => row.id}
          name={isAsset ? "asset" : "quality checklist"}
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          searchPlaceholder={
            isAsset
              ? "Search assets or templates..."
              : "Search checklists or products..."
          }
          emptyState={{
            description: search.trim()
              ? "Try changing your search."
              : "Only items with a published inspection template are available."
          }}
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

      <SelectProductDialog
        open={productDialogItem !== null}
        onOpenChange={(open) => {
          if (!open) setProductDialogItem(null);
        }}
        title={productDialogItem?.name ?? ""}
        products={productDialogItem?.products ?? []}
        onSelect={(productId) => {
          setProductDialogItem(null);
          setSelectedTemplate({
            templateId: productDialogItem!.templateId,
            familyId: productDialogItem!.familyId,
            name: productDialogItem!.name,
            productId,
            version: productDialogItem!.version
          });
        }}
      />

      <RunInspectionDialog
        key={`${selectedTemplate?.templateId ?? "new-inspection"}-${
          isUsageTracking && usageTracking.data ? "usage-ready" : "base"
        }`}
        open={selectedTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTemplate(null);
        }}
        title={selectedTemplate?.name ?? ""}
        items={runItems}
        sections={inspectionSections}
        templateId={selectedTemplate?.templateId}
        initialCurrentUsage={usageTracking.data?.currentUsage}
        usageTracking={
          isUsageTracking
            ? (usageTracking.data ?? EMPTY_INSPECTION_USAGE_TRACKING)
            : undefined
        }
        isLoading={
          detailLoading || (isUsageTracking && usageTracking.isLoading)
        }
        isSubmitting={submitInspection.isPending}
        onSubmit={(isDraft, results, currentUsage) => {
          if (!selectedTemplate || !user) return;
          const inspectionItems = runItems
            .filter((item) => Boolean(results[item.id]))
            .map((item) => {
              const result = results[item.id];
              return {
                template_item_id: item.id,
                is_pass: result.passed ?? false,
                notes: result.notes,
                number_value:
                  item.type === "number" ? Number(result.value) || 0 : 0,
                file_names: result.file_names
              };
            });
          const filesByItem: Record<string, File[]> = {};
          for (const item of runItems) {
            const result = results[item.id];
            if (result?.files && result.files.length > 0) {
              filesByItem[item.id] = result.files;
            }
          }
          const payload: SubmitInspectionPayload = {
            created_by: user.name ?? user.id ?? "",
            is_draft: isDraft,
            template_id: selectedTemplate.templateId,
            items: inspectionItems
          };
          if (isUsageTracking) {
            payload.current_usage = currentUsage ?? "";
          }
          if (selectedTemplate.productId) {
            payload.product_id = selectedTemplate.productId;
          }
          if (Object.keys(filesByItem).length > 0) {
            payload.filesByItem = filesByItem;
          }
          submitInspection.mutate(payload, {
            onSuccess: () => {
              setSelectedTemplate(null);
              router.push("/app/inspection/run-inspection");
            }
          });
        }}
      />
    </div>
  );
}

export default function StartNewInspectionPage() {
  return (
    <Suspense>
      <StartNewInspectionContent />
    </Suspense>
  );
}

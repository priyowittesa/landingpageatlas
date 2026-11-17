"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Check,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  icons,
  type LucideIcon,
} from "lucide-react";

import ConfirmationModal from "@/components/ConfirmationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toKebabIconName } from "@/lib/lucide-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type PortalEnumOption,
  type PortalModule,
  type PortalModulePayload,
  useCreatePortalModule,
  useDeletePortalModule,
  usePortalEnums,
  usePortalModules,
  useUpdatePortalModule,
} from "./use-portal-applications";

type EditorState = {
  kind: "module" | "feature";
  item: PortalModule | null;
};

const EMPTY_STATUS_OPTIONS: PortalEnumOption[] = [];

export function ModulesSettings() {
  const modulesQuery = usePortalModules();
  const enumsQuery = usePortalEnums();
  const createModule = useCreatePortalModule();
  const updateModule = useUpdatePortalModule();
  const deleteModule = useDeletePortalModule();
  const [selectedId, setSelectedId] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [featureSearch, setFeatureSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"assignments" | "details">(
    "assignments",
  );
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PortalModule | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);

  const allItems = modulesQuery.data ?? [];
  const parentModules = useMemo(
    () => allItems.filter((item) => !item.parent_id),
    [allItems],
  );
  const selectedModule = parentModules.find((item) => item.id === selectedId);
  const features = useMemo(
    () => allItems.filter((item) => item.parent_id === selectedId),
    [allItems, selectedId],
  );

  useEffect(() => {
    if (parentModules.length === 0) {
      setSelectedId("");
      return;
    }
    if (!parentModules.some((item) => item.id === selectedId)) {
      setSelectedId(parentModules[0].id);
    }
  }, [parentModules, selectedId]);

  useEffect(() => setPage(1), [featureSearch, rowsPerPage, selectedId]);

  const visibleModules = useMemo(() => {
    const query = moduleSearch.trim().toLowerCase();
    if (!query) return parentModules;
    return parentModules.filter((item) =>
      [item.name, item.key, item.description].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [moduleSearch, parentModules]);

  const filteredFeatures = useMemo(() => {
    const query = featureSearch.trim().toLowerCase();
    if (!query) return features;
    return features.filter((item) =>
      [item.name, item.key, item.description, item.version].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [featureSearch, features]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFeatures.length / rowsPerPage),
  );
  const currentPage = Math.min(page, totalPages);
  const paginatedFeatures = filteredFeatures.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );
  const firstRow =
    filteredFeatures.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const lastRow = Math.min(currentPage * rowsPerPage, filteredFeatures.length);

  const saveEditor = async (payload: PortalModulePayload) => {
    if (!editor) return;
    try {
      if (editor.item) {
        await updateModule.mutateAsync({ id: editor.item.id, payload });
      } else {
        const created = await createModule.mutateAsync(payload);
        if (editor.kind === "module" && created?.id) {
          setSelectedId(created.id);
        }
      }
      setEditor(null);
    } catch {
      // Global query feedback handles the API error and the dialog stays open.
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteModule.mutateAsync(deleteTarget.id);
      if (deleteTarget.id === selectedId) setSelectedId("");
      setDeleteTarget(null);
    } catch {
      // Global query feedback handles the API error and keeps confirmation open.
    }
  };

  const isSaving = createModule.isPending || updateModule.isPending;

  return (
    <section className="min-h-[560px] overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="grid min-h-[560px] md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="border-b border-gray-200 bg-gray-50/70 md:border-b-0 md:border-r">
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-950">Modules</h2>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-white"
                onClick={() => setEditor({ kind: "module", item: null })}
                disabled={enumsQuery.isLoading}
                aria-label="Add module"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <Input
                value={moduleSearch}
                onChange={(event) => setModuleSearch(event.target.value)}
                placeholder="Search by name"
                className="h-9 bg-white pl-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 p-2">
            {modulesQuery.isLoading && (
              <div className="flex items-center justify-center gap-2 py-10 text-xs text-gray-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            )}
            {!modulesQuery.isLoading &&
              visibleModules.map((item) => {
                const childCount = allItems.filter(
                  (child) => child.parent_id === item.id,
                ).length;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id);
                      setActiveTab("assignments");
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl border bg-white p-2 text-left transition",
                      selectedId === item.id
                        ? "border-primary-500 ring-1 ring-primary-200"
                        : "border-gray-200 hover:border-gray-300",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                      <SavedLucideIcon name={item.icon} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold text-gray-950">
                        {item.name}
                      </span>
                      <span className="block truncate text-[9px] text-gray-500">
                        ${item.monthly_price}/mo · ${item.yearly_price}/yr · v
                        {item.version}
                      </span>
                      <span className="block text-[9px] text-gray-400">
                        {childCount} feature{childCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                );
              })}
            {!modulesQuery.isLoading && visibleModules.length === 0 && (
              <p className="px-2 py-10 text-center text-xs text-gray-500">
                No modules found.
              </p>
            )}
          </div>
        </aside>

        <div className="min-w-0">
          {selectedModule ? (
            <>
              <header className="flex items-center gap-3 border-b border-gray-200 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white">
                  <SavedLucideIcon
                    name={selectedModule.icon}
                    className="h-5 w-5"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-gray-950">
                    {selectedModule.name}
                  </h3>
                  <p className="truncate text-xs text-gray-500">
                    {selectedModule.description || selectedModule.key}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setEditor({ kind: "module", item: selectedModule })
                  }
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-red-600"
                  onClick={() => setDeleteTarget(selectedModule)}
                  aria-label={`Delete ${selectedModule.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </header>

              <div className="grid grid-cols-2 border-b border-gray-200">
                <ModuleTab
                  active={activeTab === "assignments"}
                  onClick={() => setActiveTab("assignments")}
                >
                  Feature assignments
                </ModuleTab>
                <ModuleTab
                  active={activeTab === "details"}
                  onClick={() => setActiveTab("details")}
                >
                  Feature details
                </ModuleTab>
              </div>

              {activeTab === "assignments" ? (
                <div className="p-2">
                  <div className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center">
                    <Select
                      value={String(rowsPerPage)}
                      onValueChange={(value) => setRowsPerPage(Number(value))}
                    >
                      <SelectTrigger className="h-9 w-24 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 20].map((count) => (
                          <SelectItem key={count} value={String(count)}>
                            {count} Rows
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={featureSearch}
                        onChange={(event) =>
                          setFeatureSearch(event.target.value)
                        }
                        placeholder="Search by feature name"
                        className="h-9 pl-8 text-xs"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => modulesQuery.refetch()}
                      disabled={modulesQuery.isFetching}
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          modulesQuery.isFetching && "animate-spin",
                        )}
                      />
                      Refresh
                    </Button>
                    <Button
                      size="sm"
                      className="h-9"
                      onClick={() => setEditor({ kind: "feature", item: null })}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      New Feature
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-[560px] text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-3 py-2.5 font-medium">
                            Feature Name
                          </th>
                          <th className="px-3 py-2.5 font-medium">
                            Description
                          </th>
                          <th className="px-3 py-2.5 font-medium">Version</th>
                          <th className="w-20 px-3 py-2.5 text-right font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {paginatedFeatures.map((feature) => (
                          <tr key={feature.id}>
                            <td className="px-3 py-2.5 font-medium text-gray-900">
                              {feature.name}
                            </td>
                            <td className="max-w-64 truncate px-3 py-2.5 text-gray-600">
                              {feature.description || "-"}
                            </td>
                            <td className="px-3 py-2.5 text-gray-600">
                              {feature.version}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() =>
                                    setEditor({
                                      kind: "feature",
                                      item: feature,
                                    })
                                  }
                                  aria-label={`Edit ${feature.name}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  className="h-7 w-7 bg-red-500 hover:bg-red-600"
                                  onClick={() => setDeleteTarget(feature)}
                                  aria-label={`Delete ${feature.name}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!modulesQuery.isLoading &&
                      paginatedFeatures.length === 0 && (
                        <div className="flex min-h-44 flex-col items-center justify-center text-center">
                          <Search className="h-8 w-8 text-gray-400" />
                          <p className="mt-3 text-xs font-semibold text-gray-900">
                            No matching features
                          </p>
                          <p className="mt-1 text-[10px] text-gray-500">
                            Clear your search or create the first feature.
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-gray-500">
                    <span>
                      Showing {firstRow}–{lastRow} of {filteredFeatures.length}{" "}
                      features
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1,
                      ).map((pageNumber) => (
                        <Button
                          key={pageNumber}
                          variant={
                            pageNumber === currentPage ? "default" : "outline"
                          }
                          size="sm"
                          className="h-9 min-w-9 px-2"
                          aria-label={`Page ${pageNumber}`}
                          aria-current={
                            pageNumber === currentPage ? "page" : undefined
                          }
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <ModuleDetails module={selectedModule} />
              )}
            </>
          ) : (
            <div className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center">
              <Box className="h-10 w-10 text-gray-300" />
              <h3 className="mt-3 text-sm font-semibold text-gray-900">
                No module selected
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Create a module from the button in the left panel.
              </p>
            </div>
          )}
        </div>
      </div>

      <ModuleEditorDialog
        editor={editor}
        parentId={editor?.kind === "feature" ? selectedId : ""}
        parentName={selectedModule?.name ?? ""}
        parentCategory={selectedModule?.category ?? ""}
        statusOptions={
          enumsQuery.data?.portal_module_status ?? EMPTY_STATUS_OPTIONS
        }
        pending={isSaving}
        onClose={() => setEditor(null)}
        onSubmit={saveEditor}
      />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "item"}?`}
        description={
          deleteTarget && !deleteTarget.parent_id
            ? "The module and its feature relationships will be removed from the portal."
            : "The feature will be removed from its parent module."
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        isLoading={deleteModule.isPending}
      />
    </section>
  );
}

function ModuleTab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "border-b-2 px-3 py-2.5 text-xs",
        active
          ? "border-primary-600 font-medium text-primary-700"
          : "border-transparent text-gray-500 hover:text-gray-800",
      )}
    >
      {children}
    </button>
  );
}

function ModuleDetails({ module }: { module: PortalModule }) {
  const rows = [
    ["Name", module.name],
    ["Key", module.key || "-"],
    ["Category", module.category || "-"],
    ["Href", module.href || "-"],
    ["Monthly price", `$${module.monthly_price}`],
    ["Yearly price", `$${module.yearly_price}`],
    ["Version", module.version],
    ["Status", module.status],
    ["Show as menu", module.is_menu ? "Yes" : "No"],
  ];
  return (
    <div className="p-4">
      <dl className="overflow-hidden rounded-lg border border-gray-200">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid border-b border-gray-100 px-4 py-3 last:border-0 sm:grid-cols-[140px_1fr]"
          >
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-xs font-medium text-gray-900">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 rounded-lg border border-gray-200 p-4">
        <p className="text-xs text-gray-500">Description</p>
        <p className="mt-1 text-sm text-gray-700">
          {module.description || "No description."}
        </p>
      </div>
    </div>
  );
}

function ModuleEditorDialog({
  editor,
  parentId,
  parentName,
  parentCategory,
  statusOptions,
  pending,
  onClose,
  onSubmit,
}: {
  editor: EditorState | null;
  parentId: string;
  parentName: string;
  parentCategory: string;
  statusOptions: PortalEnumOption[];
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: PortalModulePayload) => void | Promise<void>;
}) {
  const [form, setForm] = useState<PortalModulePayload>(() =>
    emptyPayload("module", "", statusOptions),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editor) return;
    const nextForm = editor.item
      ? modulePayload(editor.item)
      : emptyPayload(editor.kind, parentId, statusOptions);
    if (editor.kind === "feature" && !editor.item) {
      nextForm.category = parentCategory;
    }
    setForm(nextForm);
    setErrors({});
  }, [editor, parentCategory, parentId, statusOptions]);

  const update = <K extends keyof PortalModulePayload>(
    key: K,
    value: PortalModulePayload[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.key.trim()) nextErrors.key = "Key is required.";
    if (!form.category.trim()) nextErrors.category = "Category is required.";
    if (!Number.isFinite(form.monthly_price) || form.monthly_price < 0) {
      nextErrors.monthly_price = "Monthly price must be zero or greater.";
    }
    if (!Number.isFinite(form.yearly_price) || form.yearly_price < 0) {
      nextErrors.yearly_price = "Yearly price must be zero or greater.";
    }
    if (!Number.isInteger(form.order) || form.order < 0) {
      nextErrors.order = "Order must be a non-negative whole number.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSubmit({
      ...form,
      category: isNewFeature ? parentCategory.trim() : form.category.trim(),
      description: form.description.trim(),
      href: form.href.trim(),
      icon: form.icon.trim(),
      key: form.key.trim(),
      monthly_price: isNewFeature ? 0 : form.monthly_price,
      name: form.name.trim(),
      parent_id: editor?.kind === "feature" ? parentId : "",
      version: isNewFeature ? "1" : form.version.trim() || "1",
      yearly_price: isNewFeature ? 0 : form.yearly_price,
    });
  };

  const statuses = withCurrentStatus(statusOptions, form.status);
  const isNewFeature = editor?.kind === "feature" && !editor.item;
  const title = `${editor?.item ? "Edit" : "New"} ${
    editor?.kind === "feature" ? "Feature" : "Module"
  }`;

  return (
    <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-y-0 left-auto right-0 top-0 flex h-screen w-full max-w-xl translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-r-0 p-0 sm:max-w-xl"
      >
        <DialogHeader className="border-b border-gray-200 px-6 py-5 text-left">
          <div className="pr-10">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="mt-1">
              {editor?.kind === "feature"
                ? `This feature will be assigned to ${parentName}.`
                : "Configure the module shown in the portal catalog."}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto px-6 py-6 sm:grid-cols-2">
          <EditorField label="Name" error={errors.name} required>
            <Input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              placeholder="e.g. Labour Rostering"
              className="w-full"
            />
          </EditorField>
          <EditorField label="Key" error={errors.key} required>
            <Input
              value={form.key}
              onChange={(event) => update("key", event.target.value)}
              placeholder="e.g. labour-rostering"
              className="w-full"
            />
          </EditorField>
          <EditorField label="Category" error={errors.category} required>
            <Input
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
              placeholder="e.g. Construction"
              className="w-full"
            />
          </EditorField>
          <EditorField label="Href">
            <Input
              value={form.href}
              onChange={(event) => update("href", event.target.value)}
              placeholder="e.g. /labour-rostering"
              className="w-full"
            />
          </EditorField>
          {editor?.kind === "feature" && editor.item && (
            <EditorField label="Order" error={errors.order} required>
              <Input
                type="number"
                min={0}
                step={1}
                value={form.order}
                onChange={(event) =>
                  update("order", Number(event.target.value))
                }
                placeholder="0"
                className="w-full"
              />
            </EditorField>
          )}
          <EditorField label="Icon">
            <LucideIconPicker
              value={form.icon}
              onChange={(value) => update("icon", value)}
            />
          </EditorField>
          {!isNewFeature && (
            <>
              <EditorField
                label="Monthly price (USD)"
                error={errors.monthly_price}
              >
                <div className="relative w-full">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    $
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(form.monthly_price)}
                    onChange={(event) =>
                      update(
                        "monthly_price",
                        parseMoneyInput(event.target.value),
                      )
                    }
                    placeholder="0"
                    className="w-full pl-7"
                  />
                </div>
              </EditorField>
              <EditorField
                label="Yearly price (USD)"
                error={errors.yearly_price}
              >
                <div className="relative w-full">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    $
                  </span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={formatMoneyInput(form.yearly_price)}
                    onChange={(event) =>
                      update(
                        "yearly_price",
                        parseMoneyInput(event.target.value),
                      )
                    }
                    placeholder="0"
                    className="w-full pl-7"
                  />
                </div>
              </EditorField>
              <EditorField label="Version">
                <Input
                  value={form.version}
                  onChange={(event) => update("version", event.target.value)}
                  placeholder="1"
                  className="w-full"
                />
              </EditorField>
            </>
          )}
          <EditorField label="Status">
            <Select
              value={form.status}
              onValueChange={(value) => update("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </EditorField>
          <EditorField label="Show as menu">
            <div className="flex h-10 w-full items-center justify-between rounded-md border px-3">
              <span className="text-xs text-gray-600">
                {form.is_menu ? "Visible in menu" : "Hidden from menu"}
              </span>
              <Switch
                checked={form.is_menu}
                onCheckedChange={(value) => update("is_menu", value)}
              />
            </div>
          </EditorField>
          <EditorField label="Description" className="sm:col-span-2">
            <Textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              rows={3}
              placeholder="Describe this module or feature."
              className="w-full"
            />
          </EditorField>
          {editor?.kind === "feature" && editor.item && (
            <div className="sm:col-span-2">
              <Badge variant="outline">Parent ID: {parentId}</Badge>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={pending}>
              {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditorField({
  label,
  required,
  error,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      )}
    </label>
  );
}

type LucideIconOption = {
  name: string;
  icon: LucideIcon;
};

const ALL_LUCIDE_ICON_OPTIONS: LucideIconOption[] = Object.entries(
  icons as Record<string, LucideIcon>,
)
  .map(([exportName, icon]) => ({
    name: toKebabIconName(exportName),
    icon,
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

const LUCIDE_ICONS_BY_NAME = new Map(
  ALL_LUCIDE_ICON_OPTIONS.map((option) => [option.name, option]),
);

const POPULAR_ICON_NAMES = [
  "box",
  "boxes",
  "briefcase-business",
  "building-2",
  "calendar-days",
  "chart-column",
  "circle-dollar-sign",
  "clipboard-check",
  "drafting-compass",
  "factory",
  "clock",
  "file-text",
  "folder",
  "hard-hat",
  "house",
  "layout-dashboard",
  "layers-3",
  "package",
  "ruler",
  "settings",
  "shield-check",
  "shopping-cart",
  "sparkles",
  "target",
  "test-tube",
  "truck",
  "user",
  "users",
  "workflow",
  "wrench",
];

const POPULAR_LUCIDE_ICON_OPTIONS = POPULAR_ICON_NAMES.flatMap((name) => {
  const option = LUCIDE_ICONS_BY_NAME.get(name);
  return option ? [option] : [];
});

function LucideIconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedIcon = LUCIDE_ICONS_BY_NAME.get(value);
  const visibleIcons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query) {
      return ALL_LUCIDE_ICON_OPTIONS.filter((option) =>
        option.name.includes(query),
      ).slice(0, 60);
    }
    if (
      selectedIcon &&
      !POPULAR_LUCIDE_ICON_OPTIONS.some(
        (option) => option.name === selectedIcon.name,
      )
    ) {
      return [selectedIcon, ...POPULAR_LUCIDE_ICON_OPTIONS];
    }
    return POPULAR_LUCIDE_ICON_OPTIONS;
  }, [search, selectedIcon]);

  const SelectedIcon = selectedIcon?.icon;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
            {SelectedIcon ? (
              <SelectedIcon className="h-4 w-4" />
            ) : (
              <Box className="h-4 w-4" />
            )}
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              !value && "text-muted-foreground",
            )}
          >
            {value || "Select a Lucide icon"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        className="w-[var(--radix-popover-trigger-width)] p-3"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Lucide icons..."
            className="w-full pl-9"
          />
        </div>
        <div className="mt-3 grid max-h-72 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
          {visibleIcons.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.name}
                type="button"
                title={iconLabel(option.name)}
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                  setSearch("");
                }}
                className={cn(
                  "relative flex min-w-0 flex-col items-center gap-1 rounded-lg border p-2 text-gray-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700",
                  value === option.name &&
                    "border-primary-500 bg-primary-50 text-primary-700",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="w-full truncate text-center text-[9px]">
                  {iconLabel(option.name)}
                </span>
                {value === option.name && (
                  <Check className="absolute right-1 top-1 h-3 w-3" />
                )}
              </button>
            );
          })}
        </div>
        {visibleIcons.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-500">
            No Lucide icon found.
          </p>
        )}
        {search.trim() && visibleIcons.length === 60 && (
          <p className="mt-2 text-center text-[10px] text-gray-400">
            Refine your search to see more icons.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function iconLabel(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SavedLucideIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = LUCIDE_ICONS_BY_NAME.get(name)?.icon ?? Box;
  return <Icon className={className} />;
}

function emptyPayload(
  kind: "module" | "feature",
  parentId: string,
  statuses: PortalEnumOption[],
): PortalModulePayload {
  return {
    category: "",
    description: "",
    href: "",
    icon: "",
    is_menu: kind === "module",
    key: "",
    monthly_price: 0,
    name: "",
    order: 0,
    parent_id: kind === "feature" ? parentId : "",
    status: statuses[0]?.value ?? "active",
    version: "1",
    yearly_price: 0,
  };
}

function modulePayload(module: PortalModule): PortalModulePayload {
  return {
    category: module.category,
    description: module.description,
    href: module.href,
    icon: module.icon,
    is_menu: module.is_menu,
    key: module.key,
    monthly_price: module.monthly_price,
    name: module.name,
    order: module.order,
    parent_id: module.parent_id,
    status: module.status,
    version: module.version,
    yearly_price: module.yearly_price,
  };
}

function withCurrentStatus(
  options: PortalEnumOption[],
  current: string,
): PortalEnumOption[] {
  if (!current || options.some((option) => option.value === current)) {
    return options;
  }
  return [{ label: current, value: current }, ...options];
}

function formatMoneyInput(value: number): string {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.trunc(value)));
}

function parseMoneyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

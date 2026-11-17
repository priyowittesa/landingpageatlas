"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AppWindow,
  Archive,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CloudCheck,
  Copy,
  Ellipsis,
  Layers3,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import ConfirmationModal from "@/components/ConfirmationModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type PortalEnumOption,
  type PortalPackage,
  type PortalPackagePayload,
  type PortalModulePayload,
  useCreatePortalPackage,
  useDeletePortalModule,
  useDeletePortalPackage,
  usePortalEnums,
  usePortalModules,
  usePortalPackages,
  useSyncPortalPackageModules,
  useUpdatePortalModule,
  useUpdatePortalPackage,
} from "./use-portal-applications";

type AppStatus = string;
type Assignment = { enabled: boolean };
type AssignmentMap = Record<string, Assignment>;

type AdminApplication = {
  id: string;
  name: string;
  code: string;
  description: string;
  version: string;
  status: AppStatus;
  updatedAt: string;
  assignments: AssignmentMap;
  icon: string;
  monthlyPrice: number;
  yearlyPrice: number;
};

type CatalogFeature = {
  id: string;
  name: string;
  order: number;
  code: string;
  category: string;
  description: string;
  href: string;
  status: AppStatus;
  monthlyPrice: number;
  yearlyPrice: number;
  icon: string;
  isMenu: boolean;
  key: string;
  parentId: string;
  version: string;
};

const EMPTY_APP_FORM = {
  name: "",
  description: "",
  icon: "",
  monthlyPrice: "",
  yearlyPrice: "",
  version: "1",
  status: "active" as AppStatus,
};

const EMPTY_MODULE_FORM = {
  name: "",
  description: "",
  href: "",
  icon: "",
  isMenu: true,
  key: "",
  monthlyPrice: "",
  yearlyPrice: "",
  category: "",
  status: "active" as AppStatus,
  version: "1",
};

function cloneAssignments(assignments: AssignmentMap): AssignmentMap {
  return Object.fromEntries(
    Object.entries(assignments).map(([featureId, assignment]) => [
      featureId,
      { ...assignment },
    ]),
  );
}

function assignmentFor(
  assignments: AssignmentMap,
  featureId: string,
): Assignment {
  return assignments[featureId] ?? { enabled: false };
}

function statusKind(status: string): "active" | "inactive" | "archived" {
  const normalized = status.toLowerCase();
  if (normalized === "inactive" || normalized.endsWith("_inactive")) {
    return "inactive";
  }
  if (normalized === "archived" || normalized.endsWith("_archived")) {
    return "archived";
  }
  if (normalized === "active" || normalized.endsWith("_active")) {
    return "active";
  }
  return "inactive";
}

function statusOptionsWithCurrent(
  options: PortalEnumOption[],
  current: string,
): PortalEnumOption[] {
  if (!current || options.some((option) => option.value === current)) {
    return options;
  }
  return [{ label: current, value: current }, ...options];
}

function formatUpdatedAt(value: unknown): string {
  if (!value) return "-";
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }
  if (typeof value === "object") {
    const object = value as Record<string, unknown>;
    const seconds = Number(object.seconds ?? 0);
    if (seconds) return new Date(seconds * 1000).toLocaleString();
  }
  return "-";
}

function packagePayload(
  application: Pick<
    AdminApplication,
    | "description"
    | "icon"
    | "monthlyPrice"
    | "name"
    | "status"
    | "version"
    | "yearlyPrice"
  >,
  assignments: AssignmentMap,
): PortalPackagePayload {
  return {
    description: application.description,
    icon: application.icon,
    module_ids: Object.entries(assignments)
      .filter(([, assignment]) => assignment.enabled)
      .map(([moduleId]) => moduleId),
    monthly_price: application.monthlyPrice,
    name: application.name,
    status: application.status,
    version: application.version.trim() || "1",
    yearly_price: application.yearlyPrice,
  };
}

export function PackageSettings() {
  const packagesQuery = usePortalPackages();
  const modulesQuery = usePortalModules();
  const enumsQuery = usePortalEnums();
  const createPackage = useCreatePortalPackage();
  const updatePackage = useUpdatePortalPackage();
  const syncPackageModules = useSyncPortalPackageModules();
  const deletePackage = useDeletePortalPackage();
  const updateModule = useUpdatePortalModule();
  const deleteModule = useDeletePortalModule();
  const packageStatusOptions = enumsQuery.data?.portal_package_status ?? [];
  const moduleStatusOptions = enumsQuery.data?.portal_module_status ?? [];

  const features = useMemo<CatalogFeature[]>(
    () =>
      (modulesQuery.data ?? [])
        .filter((module) => !module.parent_id)
        .map((module) => ({
          id: module.id,
          name: module.name,
          order: module.order,
          code: module.icon || module.id,
          category: module.category || "Uncategorized",
          description: module.description,
          href: module.href,
          status: module.status,
          monthlyPrice: module.monthly_price,
          yearlyPrice: module.yearly_price,
          icon: module.icon,
          isMenu: module.is_menu,
          key: module.key,
          parentId: module.parent_id,
          version: module.version,
        })),
    [modulesQuery.data],
  );
  const applications = useMemo<AdminApplication[]>(
    () =>
      (packagesQuery.data ?? []).map((application: PortalPackage) => ({
        id: application.id,
        name: application.name,
        code: application.icon || application.id,
        description: application.description,
        version: application.version,
        status: application.status,
        updatedAt: formatUpdatedAt(application.updated_at),
        icon: application.icon,
        monthlyPrice: application.monthly_price,
        yearlyPrice: application.yearly_price,
        assignments: Object.fromEntries(
          application.module_ids.map((moduleId) => [
            moduleId,
            { enabled: true },
          ]),
        ),
      })),
    [packagesQuery.data],
  );
  const [selectedId, setSelectedId] = useState("");
  const selectedApp = applications.find(
    (application) => application.id === selectedId,
  );
  const [draftAssignments, setDraftAssignments] = useState<AssignmentMap>({});
  const [appSearch, setAppSearch] = useState("");
  const [featureSearch, setFeatureSearch] = useState("");
  const [featureCategory, setFeatureCategory] = useState("all");
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [appDrawerOpen, setAppDrawerOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<AdminApplication | null>(null);
  const [appForm, setAppForm] = useState(EMPTY_APP_FORM);
  const [appErrors, setAppErrors] = useState<Record<string, string>>({});
  const [moduleDrawerOpen, setModuleDrawerOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CatalogFeature | null>(
    null,
  );
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE_FORM);
  const [moduleErrors, setModuleErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminApplication | null>(
    null,
  );
  const [deleteModuleTarget, setDeleteModuleTarget] =
    useState<CatalogFeature | null>(null);
  const [pendingTargetId, setPendingTargetId] = useState<string | null>(null);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [activeTab, setActiveTab] = useState<"features" | "details">(
    "features",
  );

  useEffect(() => {
    if (applications.length === 0) {
      setSelectedId("");
      setDraftAssignments({});
      return;
    }
    if (!applications.some((application) => application.id === selectedId)) {
      setSelectedId(applications[0].id);
      setDraftAssignments(cloneAssignments(applications[0].assignments));
    }
  }, [applications, selectedId]);

  const isDirty =
    Boolean(selectedApp) &&
    Object.entries(draftAssignments)
      .filter(([, assignment]) => assignment.enabled)
      .map(([moduleId]) => moduleId)
      .sort()
      .join(",") !==
      Object.entries(selectedApp?.assignments ?? {})
        .filter(([, assignment]) => assignment.enabled)
        .map(([moduleId]) => moduleId)
        .sort()
        .join(",");

  const filteredApplications = useMemo(() => {
    const query = appSearch.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter((application) =>
      [application.name, application.code, application.description].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [appSearch, applications]);

  const categories = useMemo(
    () => Array.from(new Set(features.map((feature) => feature.category))),
    [features],
  );

  const filteredFeatures = useMemo(() => {
    const query = featureSearch.trim().toLowerCase();
    return features.filter((feature) => {
      const matchesSearch =
        !query ||
        [feature.name, feature.code, feature.description].some((value) =>
          value.toLowerCase().includes(query),
        );
      const matchesCategory =
        featureCategory === "all" || feature.category === featureCategory;
      const matchesAssigned =
        !showAssignedOnly ||
        assignmentFor(draftAssignments, feature.id).enabled;
      return matchesSearch && matchesCategory && matchesAssigned;
    });
  }, [
    draftAssignments,
    featureCategory,
    featureSearch,
    features,
    showAssignedOnly,
  ]);

  const enabledCount = features.filter(
    (feature) => assignmentFor(draftAssignments, feature.id).enabled,
  ).length;
  const catalogValue = features.reduce((total, feature) => {
    const assignment = assignmentFor(draftAssignments, feature.id);
    return total + (assignment.enabled ? feature.monthlyPrice : 0);
  }, 0);

  const selectApplication = (applicationId: string) => {
    if (applicationId === selectedId) return;
    if (isDirty) {
      setPendingTargetId(applicationId);
      setSwitchDialogOpen(true);
      return;
    }
    commitSelection(applicationId);
  };

  const commitSelection = (applicationId: string) => {
    const next = applications.find(
      (application) => application.id === applicationId,
    );
    if (!next) return;
    setSelectedId(applicationId);
    setDraftAssignments(cloneAssignments(next.assignments));
    setSyncError(false);
    setActiveTab("features");
  };

  const discardChanges = () => {
    if (!selectedApp) return;
    setDraftAssignments(cloneAssignments(selectedApp.assignments));
    setSyncError(false);
  };

  const updateAssignment = (featureId: string, update: Partial<Assignment>) => {
    setDraftAssignments((current) => ({
      ...current,
      [featureId]: {
        ...assignmentFor(current, featureId),
        ...update,
      },
    }));
    setSyncError(false);
  };

  const saveAndSync = async () => {
    if (!selectedApp || !isDirty) return;
    setSyncError(false);
    try {
      await syncPackageModules.mutateAsync({
        id: selectedApp.id,
        payload: packagePayload(selectedApp, draftAssignments),
      });
    } catch {
      setSyncError(true);
    }
  };

  const openNewApplication = () => {
    setEditingApp(null);
    setAppForm({
      ...EMPTY_APP_FORM,
      status: packageStatusOptions[0]?.value ?? "active",
    });
    setAppErrors({});
    setAppDrawerOpen(true);
  };

  const openEditApplication = () => {
    if (!selectedApp) return;
    setEditingApp(selectedApp);
    setAppForm({
      name: selectedApp.name,
      description: selectedApp.description,
      icon: selectedApp.icon,
      monthlyPrice: String(selectedApp.monthlyPrice),
      yearlyPrice: String(selectedApp.yearlyPrice),
      version: selectedApp.version || "1",
      status: selectedApp.status,
    });
    setAppErrors({});
    setAppDrawerOpen(true);
  };

  const submitApplication = async () => {
    const errors: Record<string, string> = {};
    if (!appForm.name.trim()) errors.name = "Application name is required.";
    if (!appForm.description.trim()) {
      errors.description = "Description is required.";
    }
    if (
      appForm.monthlyPrice === "" ||
      !Number.isFinite(Number(appForm.monthlyPrice)) ||
      Number(appForm.monthlyPrice) < 0
    ) {
      errors.monthlyPrice = "Monthly price must be zero or greater.";
    }
    if (
      appForm.yearlyPrice === "" ||
      !Number.isFinite(Number(appForm.yearlyPrice)) ||
      Number(appForm.yearlyPrice) < 0
    ) {
      errors.yearlyPrice = "Yearly price must be zero or greater.";
    }
    setAppErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const applicationData = {
      description: appForm.description.trim(),
      icon: appForm.icon.trim(),
      monthlyPrice: Number(appForm.monthlyPrice),
      name: appForm.name.trim(),
      status: appForm.status,
      version: appForm.version.trim() || "1",
      yearlyPrice: Number(appForm.yearlyPrice),
    };

    try {
      if (editingApp) {
        await updatePackage.mutateAsync({
          id: editingApp.id,
          payload: packagePayload(
            applicationData,
            editingApp.id === selectedId
              ? draftAssignments
              : editingApp.assignments,
          ),
        });
      } else {
        const created = await createPackage.mutateAsync(
          packagePayload(applicationData, {}),
        );
        if (created?.id) {
          setSelectedId(created.id);
          setDraftAssignments({});
        }
      }
      setAppDrawerOpen(false);
    } catch {
      // The global query provider displays the API error and keeps the form open.
    }
  };

  const openEditModule = (module: CatalogFeature) => {
    setEditingModule(module);
    setModuleForm({
      name: module.name,
      description: module.description,
      href: module.href,
      icon: module.icon,
      isMenu: module.isMenu,
      key: module.key,
      monthlyPrice: String(module.monthlyPrice),
      yearlyPrice: String(module.yearlyPrice),
      category: module.category,
      status: module.status,
      version: module.version || "1",
    });
    setModuleErrors({});
    setModuleDrawerOpen(true);
  };

  const submitModule = async () => {
    const errors: Record<string, string> = {};
    if (!moduleForm.name.trim()) errors.name = "Module name is required.";
    if (!moduleForm.key.trim()) errors.key = "Module key is required.";
    if (!moduleForm.category.trim()) {
      errors.category = "Category is required.";
    }
    if (
      moduleForm.monthlyPrice === "" ||
      !Number.isFinite(Number(moduleForm.monthlyPrice)) ||
      Number(moduleForm.monthlyPrice) < 0
    ) {
      errors.monthlyPrice = "Monthly price must be zero or greater.";
    }
    if (
      moduleForm.yearlyPrice === "" ||
      !Number.isFinite(Number(moduleForm.yearlyPrice)) ||
      Number(moduleForm.yearlyPrice) < 0
    ) {
      errors.yearlyPrice = "Yearly price must be zero or greater.";
    }
    setModuleErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: PortalModulePayload = {
      category: moduleForm.category.trim(),
      description: moduleForm.description.trim(),
      href: moduleForm.href.trim(),
      icon: moduleForm.icon.trim(),
      is_menu: moduleForm.isMenu,
      key: moduleForm.key.trim(),
      monthly_price: Number(moduleForm.monthlyPrice),
      name: moduleForm.name.trim(),
      order: editingModule?.order ?? 0,
      parent_id: editingModule?.parentId ?? "",
      status: moduleForm.status,
      version: moduleForm.version.trim() || "1",
      yearly_price: Number(moduleForm.yearlyPrice),
    };

    if (!editingModule) return;
    try {
      await updateModule.mutateAsync({ id: editingModule.id, payload });
      setModuleDrawerOpen(false);
    } catch {
      // The global query provider displays the API error and keeps the form open.
    }
  };

  const deleteSelectedModule = async () => {
    if (!deleteModuleTarget) return;
    try {
      await deleteModule.mutateAsync(deleteModuleTarget.id);
      setDraftAssignments((current) => {
        const next = { ...current };
        delete next[deleteModuleTarget.id];
        return next;
      });
      setDeleteModuleTarget(null);
    } catch {
      // The global query provider displays the API error and keeps the modal open.
    }
  };

  const duplicateApplication = async () => {
    if (!selectedApp) return;
    try {
      const duplicate = await createPackage.mutateAsync(
        packagePayload(
          { ...selectedApp, name: `${selectedApp.name} Copy` },
          selectedApp.assignments,
        ),
      );
      if (duplicate?.id) {
        setSelectedId(duplicate.id);
        setDraftAssignments(cloneAssignments(selectedApp.assignments));
      }
    } catch {
      // The global query provider displays the API error.
    }
  };

  const deleteApplication = async () => {
    if (!deleteTarget) return;
    try {
      await deletePackage.mutateAsync(deleteTarget.id);
      if (deleteTarget.id === selectedId) {
        setSelectedId("");
        setDraftAssignments({});
      }
      setDeleteTarget(null);
    } catch {
      // The global query provider displays the API error and keeps the modal open.
    }
  };

  const saving = syncPackageModules.isPending;
  const submittingApplication =
    createPackage.isPending || updatePackage.isPending;
  const submittingModule = updateModule.isPending;

  return (
    <div className="space-y-6 pb-28">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5",
                packagesQuery.isError ||
                  modulesQuery.isError ||
                  enumsQuery.isError
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              <CloudCheck className="h-3.5 w-3.5" />
              {packagesQuery.isError ||
              modulesQuery.isError ||
              enumsQuery.isError
                ? "API connection error"
                : "Runtime connected"}
            </Badge>
            <span className="text-xs text-slate-400">
              {packagesQuery.isFetching ||
              modulesQuery.isFetching ||
              enumsQuery.isFetching
                ? "Syncing..."
                : "Data synced from Portal API"}
            </span>
          </div>
          <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-slate-950">
            Application Master Data
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-500">
            Manage ATLAS applications, package pricing, and module availability
            from one workspace.
          </p>
        </div>
        <Button
          onClick={openNewApplication}
          className="h-10 rounded-lg bg-primary-700 px-4 shadow-sm"
          disabled={packagesQuery.isLoading || enumsQuery.isLoading}
        >
          <Plus />
          New Application
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={AppWindow}
          label="Applications"
          value={String(applications.length)}
          helper={`${applications.filter((app) => statusKind(app.status) === "active").length} active`}
          tone="violet"
        />
        <MetricCard
          icon={Layers3}
          label="Feature catalog"
          value={String(features.length)}
          helper={`${features.filter((feature) => statusKind(feature.status) === "active").length} available`}
          tone="blue"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Assigned to selected"
          value={String(enabledCount)}
          helper={`of ${features.length} features`}
          tone="emerald"
        />
        <MetricCard
          icon={CircleDollarSign}
          label="Catalog value"
          value={`$${catalogValue}`}
          helper="assigned module total"
          tone="amber"
        />
      </section>

      <section className="grid min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)] xl:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Applications
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {applications.length} records in total
                </p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 bg-white"
                onClick={openNewApplication}
                disabled={enumsQuery.isLoading}
                aria-label="Add application"
              >
                <Plus />
              </Button>
            </div>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={appSearch}
                onChange={(event) => setAppSearch(event.target.value)}
                placeholder="Search name or icon..."
                className="w-full bg-white pl-9"
              />
            </div>
          </div>

          <div className="max-h-[560px] space-y-2 overflow-y-auto p-3">
            {packagesQuery.isLoading && (
              <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Loading applications...
              </div>
            )}
            {packagesQuery.isError && (
              <div className="px-4 py-12 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                <p className="mt-3 text-sm font-medium text-slate-700">
                  Applications could not be loaded
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => packagesQuery.refetch()}
                >
                  <RefreshCw />
                  Retry
                </Button>
              </div>
            )}
            {!packagesQuery.isLoading &&
              !packagesQuery.isError &&
              filteredApplications.map((application) => {
                const activeAssignments = Object.values(
                  application.assignments,
                ).filter((assignment) => assignment.enabled).length;
                const isSelected = application.id === selectedId;
                return (
                  <button
                    key={application.id}
                    onClick={() => selectApplication(application.id)}
                    className={cn(
                      "group w-full rounded-xl border p-3.5 text-left transition-all",
                      isSelected
                        ? "border-primary-200 bg-white shadow-sm ring-1 ring-primary-100"
                        : "border-transparent hover:border-slate-200 hover:bg-white",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          isSelected
                            ? "bg-primary-100 text-primary-700"
                            : "bg-slate-200/70 text-slate-600",
                        )}
                      >
                        <AppWindow className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {application.name}
                          </p>
                          <StatusDot status={application.status} />
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          ${application.monthlyPrice}/mo · $
                          {application.yearlyPrice}/yr · v{application.version}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {activeAssignments} feature
                          {activeAssignments === 1 ? "" : "s"} enabled
                        </p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "mt-2 h-4 w-4 shrink-0 transition-transform",
                          isSelected
                            ? "translate-x-0 text-primary-600"
                            : "-translate-x-1 text-slate-300 group-hover:translate-x-0",
                        )}
                      />
                    </div>
                  </button>
                );
              })}
            {!packagesQuery.isLoading &&
              !packagesQuery.isError &&
              filteredApplications.length === 0 && (
                <div className="px-4 py-16 text-center">
                  <Search className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-700">
                    No applications found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try a different name or icon.
                  </p>
                </div>
              )}
          </div>
        </aside>

        {selectedApp ? (
          <div className="min-w-0">
            <div className="border-b border-slate-200 px-5 py-5 lg:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
                    <AppWindow className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-xl font-semibold text-slate-950">
                        {selectedApp.name}
                      </h2>
                      <StatusBadge status={selectedApp.status} />
                    </div>
                    <p className="mt-1 max-w-xl text-sm text-slate-500">
                      {selectedApp.description}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Monthly{" "}
                        <strong className="font-mono font-medium text-slate-700">
                          ${selectedApp.monthlyPrice}
                        </strong>
                      </span>
                      <span>
                        Yearly{" "}
                        <strong className="font-mono font-medium text-slate-700">
                          ${selectedApp.yearlyPrice}
                        </strong>
                      </span>
                      <span>
                        Version{" "}
                        <strong className="font-medium text-slate-700">
                          {selectedApp.version}
                        </strong>
                      </span>
                      <span>Updated {selectedApp.updatedAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openEditApplication}
                  >
                    <Pencil />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Application actions"
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onClick={duplicateApplication}>
                        <Copy />
                        Duplicate application
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => setDeleteTarget(selectedApp)}
                      >
                        <Trash2 />
                        Delete application
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="flex border-b border-slate-200 px-5 lg:px-7">
              <TabButton
                active={activeTab === "features"}
                onClick={() => setActiveTab("features")}
              >
                Feature assignments
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                  {enabledCount}
                </span>
              </TabButton>
              <TabButton
                active={activeTab === "details"}
                onClick={() => setActiveTab("details")}
              >
                Application details
              </TabButton>
            </div>

            {activeTab === "features" ? (
              <div>
                {statusKind(selectedApp.status) !== "active" && (
                  <div className="m-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 lg:mx-7">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Assignments are locked
                      </p>
                      <p className="mt-0.5 text-xs leading-5 text-amber-700">
                        Change this application to Active before enabling or
                        pricing features.
                      </p>
                    </div>
                  </div>
                )}

                {syncError && (
                  <div className="m-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center lg:mx-7">
                    <div className="flex flex-1 gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                      <div>
                        <p className="text-sm font-semibold text-red-900">
                          Runtime sync failed
                        </p>
                        <p className="mt-0.5 text-xs text-red-700">
                          Pending changes were retained. Check your connection
                          and retry.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 bg-white text-red-700"
                      onClick={saveAndSync}
                    >
                      <RefreshCw />
                      Retry
                    </Button>
                  </div>
                )}

                <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:px-7">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={featureSearch}
                      onChange={(event) => setFeatureSearch(event.target.value)}
                      placeholder="Search feature name, code, or description..."
                      className="w-full pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={featureCategory}
                      onValueChange={setFeatureCategory}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={showAssignedOnly ? "secondary" : "outline"}
                      className="h-10"
                      onClick={() => setShowAssignedOnly((current) => !current)}
                    >
                      <Settings2 />
                      Assigned only
                    </Button>
                    <Button
                      variant="outline"
                      className="h-10"
                      onClick={() => modulesQuery.refetch()}
                      disabled={modulesQuery.isFetching}
                    >
                      <RefreshCw
                        className={cn(
                          modulesQuery.isFetching && "animate-spin",
                        )}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto border-y border-slate-200">
                  <table className="w-full min-w-[820px] table-fixed text-left">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      <tr>
                        <th className="w-16 px-5 py-3 text-center lg:px-7">
                          On
                        </th>
                        <th className="px-3 py-3">Feature</th>
                        <th className="w-36 px-3 py-3">Category</th>
                        <th className="w-44 px-5 py-3 lg:px-7">
                          Module pricing
                        </th>
                        <th className="w-24 px-3 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {!modulesQuery.isLoading &&
                        !modulesQuery.isError &&
                        filteredFeatures.map((feature) => {
                          const assignment = assignmentFor(
                            draftAssignments,
                            feature.id,
                          );
                          const locked =
                            statusKind(selectedApp.status) !== "active" ||
                            statusKind(feature.status) !== "active";
                          return (
                            <tr
                              key={feature.id}
                              className={cn(
                                "transition-colors",
                                assignment.enabled
                                  ? "bg-primary-50/35"
                                  : "hover:bg-slate-50/70",
                                statusKind(feature.status) !== "active" &&
                                  "opacity-60",
                              )}
                            >
                              <td className="px-5 py-4 text-center lg:px-7">
                                <Checkbox
                                  checked={assignment.enabled}
                                  disabled={locked}
                                  onCheckedChange={(checked) =>
                                    updateAssignment(feature.id, {
                                      enabled: checked === true,
                                    })
                                  }
                                  aria-label={`Assign ${feature.name}`}
                                  className="h-[18px] w-[18px] border-2 border-slate-300 text-primary-600 focus:ring-0 focus:ring-offset-0"
                                />
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={cn(
                                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                      assignment.enabled
                                        ? "bg-primary-100 text-primary-700"
                                        : "bg-slate-100 text-slate-500",
                                    )}
                                  >
                                    <Sparkles className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="truncate text-sm font-semibold text-slate-900">
                                        {feature.name}
                                      </p>
                                      {statusKind(feature.status) !==
                                        "active" && (
                                        <Badge
                                          variant="outline"
                                          className="border-slate-200 bg-slate-50 text-[10px] text-slate-500"
                                        >
                                          {feature.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                      {feature.description}
                                    </p>
                                    {/* <p className="mt-1 font-mono text-[10px] text-slate-400">
                                    {feature.code}
                                  </p> */}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 bg-white font-medium text-slate-600"
                                >
                                  {feature.category}
                                </Badge>
                              </td>
                              <td className="px-5 py-4 lg:px-7">
                                <div
                                  className={cn(
                                    "space-y-0.5 text-xs",
                                    !assignment.enabled && "opacity-50",
                                  )}
                                >
                                  <p className="font-medium text-slate-800">
                                    ${feature.monthlyPrice} / month
                                  </p>
                                  <p className="text-slate-500">
                                    ${feature.yearlyPrice} / year
                                  </p>
                                </div>
                              </td>
                              <td className="px-3 py-4">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => openEditModule(feature)}
                                    aria-label={`Edit ${feature.name}`}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      setDeleteModuleTarget(feature)
                                    }
                                    aria-label={`Delete ${feature.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {modulesQuery.isLoading && (
                    <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-slate-500">
                      <LoaderCircle className="h-5 w-5 animate-spin" />
                      Loading modules...
                    </div>
                  )}
                  {modulesQuery.isError && (
                    <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
                      <AlertCircle className="h-9 w-9 text-red-400" />
                      <p className="mt-3 text-sm font-semibold text-slate-800">
                        Modules could not be loaded
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => modulesQuery.refetch()}
                      >
                        <RefreshCw />
                        Retry
                      </Button>
                    </div>
                  )}
                  {!modulesQuery.isLoading &&
                    !modulesQuery.isError &&
                    filteredFeatures.length === 0 && (
                      <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
                        <Search className="h-9 w-9 text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-800">
                          No matching features
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Clear your search or change the category filter.
                        </p>
                      </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-slate-500 lg:px-7">
                  <span>
                    Showing {filteredFeatures.length} of {features.length}{" "}
                    catalog features
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CloudCheck className="h-4 w-4 text-emerald-500" />
                    Atomic publish with Runtime sync
                  </span>
                </div>
              </div>
            ) : (
              <ApplicationDetails application={selectedApp} />
            )}
          </div>
        ) : (
          <div className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center">
            <AppWindow className="h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-semibold text-slate-800">
              No application selected
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create an application to start assigning features.
            </p>
          </div>
        )}
      </section>

      {isDirty && selectedApp && (
        <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-2xl border border-slate-700 bg-slate-950 p-3 text-white shadow-2xl sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-amber-300">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Unsaved changes</p>
                <p className="truncate text-xs text-slate-400">
                  Review and publish changes to {selectedApp.name}.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-slate-300 hover:bg-white/10 hover:text-white"
                onClick={discardChanges}
                disabled={saving}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-primary-500 px-4 hover:bg-primary-400"
                onClick={saveAndSync}
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle className="animate-spin" />
                ) : (
                  <CloudCheck />
                )}
                {saving ? "Publishing..." : "Save & Sync"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ApplicationDrawer
        open={appDrawerOpen}
        onOpenChange={setAppDrawerOpen}
        editing={Boolean(editingApp)}
        form={appForm}
        errors={appErrors}
        statusOptions={packageStatusOptions}
        isSubmitting={submittingApplication}
        onChange={(field, value) =>
          setAppForm((current) => ({ ...current, [field]: value }))
        }
        onSubmit={submitApplication}
      />

      <ModuleDrawer
        open={moduleDrawerOpen}
        onOpenChange={setModuleDrawerOpen}
        form={moduleForm}
        errors={moduleErrors}
        statusOptions={moduleStatusOptions}
        isSubmitting={submittingModule}
        onChange={(field, value) =>
          setModuleForm((current) => ({ ...current, [field]: value }))
        }
        onSubmit={submitModule}
      />

      <ConfirmationModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "application"}?`}
        description="The application and all of its feature assignments will be deleted from the portal."
        confirmLabel="Delete Application"
        onConfirm={deleteApplication}
        isLoading={deletePackage.isPending}
      />

      <ConfirmationModal
        open={Boolean(deleteModuleTarget)}
        onOpenChange={(open) => !open && setDeleteModuleTarget(null)}
        title={`Delete ${deleteModuleTarget?.name ?? "module"}?`}
        description="The module will be removed from the portal catalog and may no longer be available to assigned applications."
        confirmLabel="Delete Module"
        onConfirm={deleteSelectedModule}
        isLoading={deleteModule.isPending}
      />

      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave with unsaved changes?</DialogTitle>
            <DialogDescription>
              Your feature assignment changes have not been published. Discard
              them to open another application, or keep editing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setPendingTargetId(null);
                setSwitchDialogOpen(false);
              }}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingTargetId) commitSelection(pendingTargetId);
                setPendingTargetId(null);
                setSwitchDialogOpen(false);
              }}
            >
              Discard & Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone,
}: {
  icon: typeof AppWindow;
  label: string;
  value: string;
  helper: string;
  tone: "violet" | "blue" | "emerald" | "amber";
}) {
  const tones = {
    violet: "bg-primary-50 text-primary-700",
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          tones[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className="mt-0.5 flex items-baseline gap-2">
          <p className="text-xl font-bold text-slate-950">{value}</p>
          <span className="truncate text-[11px] text-slate-400">{helper}</span>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: AppStatus }) {
  const kind = statusKind(status);
  return (
    <span
      className={cn(
        "h-2 w-2 shrink-0 rounded-full",
        kind === "active" && "bg-emerald-500",
        kind === "inactive" && "bg-amber-400",
        kind === "archived" && "bg-slate-400",
      )}
      title={status}
    />
  );
}

function StatusBadge({ status }: { status: AppStatus }) {
  const kind = statusKind(status);
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        kind === "active" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        kind === "inactive" && "border-amber-200 bg-amber-50 text-amber-700",
        kind === "archived" && "border-slate-200 bg-slate-100 text-slate-600",
      )}
    >
      <StatusDot status={status} />
      {status}
    </Badge>
  );
}

function TabButton({
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
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-b-2 px-1 py-3.5 text-sm transition-colors first:mr-6",
        active
          ? "border-primary-600 font-semibold text-primary-700"
          : "border-transparent text-slate-500 hover:text-slate-800",
      )}
    >
      {children}
    </button>
  );
}

function ApplicationDetails({
  application,
}: {
  application: AdminApplication;
}) {
  const rows = [
    ["Application name", application.name],
    ["Icon", application.icon || "-"],
    ["Monthly price", `$${application.monthlyPrice}`],
    ["Yearly price", `$${application.yearlyPrice}`],
    ["Version", application.version],
    ["Status", application.status],
    ["Last updated", application.updatedAt],
  ];
  return (
    <div className="p-5 lg:p-7">
      <div className="max-w-3xl">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Application information
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Identifiers and metadata used across the ATLAS platform.
          </p>
        </div>
        <dl className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 border-b border-slate-100 px-4 py-3.5 last:border-b-0 sm:grid-cols-[180px_1fr]"
            >
              <dt className="text-xs font-medium text-slate-500">{label}</dt>
              <dd
                className={cn(
                  "text-sm font-medium text-slate-900",
                  label === "Icon" && "font-mono",
                  label === "Status" && "capitalize",
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500">Description</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {application.description}
          </p>
        </div>
        <div className="mt-5 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Archive className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Deletion</p>
            <p className="mt-1 text-xs leading-5 text-blue-700">
              Deleting an application also removes its package-to-module
              assignments from the portal catalog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DrawerScaffold({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: typeof AppWindow;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-y-0 left-auto right-0 top-0 flex h-screen w-full max-w-xl translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-y-0 border-r-0 p-0 sm:max-w-xl"
      >
        <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
          <div className="flex items-start gap-3 pr-9">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg">{title}</DialogTitle>
              <DialogDescription className="mt-1 leading-5">
                {description}
              </DialogDescription>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-5 top-5 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex justify-end gap-2">{footer}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ApplicationDrawer({
  open,
  onOpenChange,
  editing,
  form,
  errors,
  statusOptions,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: typeof EMPTY_APP_FORM;
  errors: Record<string, string>;
  statusOptions: PortalEnumOption[];
  isSubmitting: boolean;
  onChange: (
    field: keyof typeof EMPTY_APP_FORM,
    value: string | AppStatus,
  ) => void;
  onSubmit: () => void;
}) {
  const availableStatuses = statusOptionsWithCurrent(
    statusOptions,
    form.status,
  );
  return (
    <DrawerScaffold
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Application" : "New Application"}
      description={
        editing
          ? "Update the application identity and availability."
          : "Register a product that can receive features from the catalog."
      }
      icon={AppWindow}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : editing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isSubmitting
              ? "Saving..."
              : editing
                ? "Save Application"
                : "Create Application"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormField label="Application name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="e.g. ATLAS Enterprise"
            className="w-full"
            autoFocus
          />
        </FormField>
        <FormField label="Icon" hint="Icon name or URL used by the portal.">
          <Input
            value={form.icon}
            onChange={(event) => onChange("icon", event.target.value)}
            placeholder="e.g. layout-dashboard"
            className="w-full"
          />
        </FormField>
        <FormField label="Description" required error={errors.description}>
          <textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Describe the audience and purpose of this application."
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Monthly price (USD)"
            required
            error={errors.monthlyPrice}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyPrice}
              onChange={(event) => onChange("monthlyPrice", event.target.value)}
              placeholder="0"
              className="w-full"
            />
          </FormField>
          <FormField
            label="Yearly price (USD)"
            required
            error={errors.yearlyPrice}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.yearlyPrice}
              onChange={(event) => onChange("yearlyPrice", event.target.value)}
              placeholder="0"
              className="w-full"
            />
          </FormField>
          <FormField label="Version" hint='Defaults to "1" when left empty.'>
            <Input
              value={form.version}
              onChange={(event) => onChange("version", event.target.value)}
              placeholder="1"
              className="w-full"
            />
          </FormField>
          <FormField label="Status" required>
            <Select
              value={form.status}
              onValueChange={(value: AppStatus) => onChange("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="flex gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
          <p className="text-xs leading-5 text-primary-800">
            Features are assigned after the application is created. Inactive
            applications cannot publish feature assignments.
          </p>
        </div>
      </div>
    </DrawerScaffold>
  );
}

function ModuleDrawer({
  open,
  onOpenChange,
  form,
  errors,
  statusOptions,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: typeof EMPTY_MODULE_FORM;
  errors: Record<string, string>;
  statusOptions: PortalEnumOption[];
  isSubmitting: boolean;
  onChange: (
    field: keyof typeof EMPTY_MODULE_FORM,
    value: string | boolean | AppStatus,
  ) => void;
  onSubmit: () => void;
}) {
  const availableStatuses = statusOptionsWithCurrent(
    statusOptions,
    form.status,
  );
  return (
    <DrawerScaffold
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Module"
      description="Update module metadata and availability in the portal catalog."
      icon={PackagePlus}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isSubmitting ? "Saving..." : "Save Module"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <FormField label="Module name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="e.g. Campaign Brief"
            className="w-full"
            autoFocus
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Key" required error={errors.key}>
            <Input
              value={form.key}
              onChange={(event) => onChange("key", event.target.value)}
              placeholder="e.g. labour-rostering"
              className="w-full"
            />
          </FormField>
          <FormField label="Href">
            <Input
              value={form.href}
              onChange={(event) => onChange("href", event.target.value)}
              placeholder="e.g. /labour-rostering"
              className="w-full"
            />
          </FormField>
          <FormField label="Category" required error={errors.category}>
            <Input
              value={form.category}
              onChange={(event) => onChange("category", event.target.value)}
              placeholder="e.g. Marketing"
              className="w-full"
            />
          </FormField>
          <FormField label="Icon" hint="Icon name or URL used by the portal.">
            <Input
              value={form.icon}
              onChange={(event) => onChange("icon", event.target.value)}
              placeholder="e.g. megaphone"
              className="w-full"
            />
          </FormField>
        </div>

        <FormField label="Description">
          <textarea
            value={form.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Describe what this module provides."
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Monthly price (USD)"
            required
            error={errors.monthlyPrice}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyPrice}
              onChange={(event) => onChange("monthlyPrice", event.target.value)}
              placeholder="0"
              className="w-full"
            />
          </FormField>
          <FormField
            label="Yearly price (USD)"
            required
            error={errors.yearlyPrice}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.yearlyPrice}
              onChange={(event) => onChange("yearlyPrice", event.target.value)}
              placeholder="0"
              className="w-full"
            />
          </FormField>
          <FormField label="Version" hint='Defaults to "1" when left empty.'>
            <Input
              value={form.version}
              onChange={(event) => onChange("version", event.target.value)}
              placeholder="1"
              className="w-full"
            />
          </FormField>
          <FormField label="Status" required>
            <Select
              value={form.status}
              onValueChange={(value: AppStatus) => onChange("status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Show as menu">
            <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 px-3">
              <span className="text-xs text-slate-500">
                {form.isMenu ? "Visible" : "Hidden"}
              </span>
              <Switch
                checked={form.isMenu}
                onCheckedChange={(value) => onChange("isMenu", value)}
              />
            </div>
          </FormField>
        </div>
      </div>
    </DrawerScaffold>
  );
}

function FormField({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

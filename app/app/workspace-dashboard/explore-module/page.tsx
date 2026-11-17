"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  CircleDollarSign,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { useAuthMe } from "@/hooks/useAuthMe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  getIcon,
  useGetModules,
  useGetPackages,
  type ApiModule,
  type ApiPackage,
  type CatalogBillingCycle
} from "./use-packages";

type ModuleItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  subscribed?: boolean;
  isMenu: boolean;
};

type PackageItem = {
  id: string;
  name: string;
  subtitle: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  icon: string;
  moduleIds: string[];
  included: ModuleItem[];
};

function getSubscribedPackageIds(subscription: unknown): string[] {
  const ids = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === "string" && value) ids.add(value);
    else if (value && typeof value === "object") {
      const item = value as Record<string, unknown>;
      add(item.package_id ?? item.id);
    }
  };

  const subscriptions = Array.isArray(subscription)
    ? subscription
    : subscription && typeof subscription === "object"
      ? [subscription]
      : [];
  subscriptions.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const data = entry as Record<string, unknown>;
    add(data.package_id);
    if (Array.isArray(data.package_ids)) data.package_ids.forEach(add);
    add(data.package);
    if (Array.isArray(data.packages)) data.packages.forEach(add);
    if (Array.isArray(data.items)) {
      data.items.forEach((value) => {
        if (!value || typeof value !== "object") return;
        const item = value as Record<string, unknown>;
        if (item.item_type === "package" || item.type === "package") {
          add(item.package_id ?? item.reference_id ?? item.id);
        }
      });
    }
  });
  return [...ids];
}

function getActiveModuleIds(
  subscription: unknown,
  rbacModules: Array<{ id: string; sub_modules?: unknown[] }> = []
): string[] {
  const ids = new Set<string>();
  const visitRbac = (
    modules: Array<{ id: string; sub_modules?: unknown[] }>
  ) => {
    modules.forEach((module) => {
      if (module.id) ids.add(module.id);
      if (Array.isArray(module.sub_modules)) {
        visitRbac(
          module.sub_modules as Array<{ id: string; sub_modules?: unknown[] }>
        );
      }
    });
  };
  visitRbac(rbacModules);

  const subscriptions = Array.isArray(subscription)
    ? subscription
    : subscription && typeof subscription === "object"
      ? [subscription]
      : [];
  subscriptions.forEach((entry) => {
    if (entry && typeof entry === "object") {
      const data = entry as Record<string, unknown>;
      const add = (value: unknown) => {
        if (typeof value === "string" && value) ids.add(value);
        else if (value && typeof value === "object") {
          const item = value as Record<string, unknown>;
          add(item.module_id ?? item.reference_id ?? item.id);
        }
      };
      [
        data.module_ids,
        data.addon_module_ids,
        data.modules,
        data.addons
      ].forEach((value) => {
        if (Array.isArray(value)) value.forEach(add);
      });
    }
  });
  return [...ids];
}

function mapApiModule(mod: ApiModule): ModuleItem {
  return {
    id: mod.id,
    title: mod.name,
    description: mod.description,
    icon: mod.icon,
    monthlyPrice: mod.monthly_price,
    yearlyPrice: mod.yearly_price,
    isMenu: mod.is_menu
  };
}

function isCatalogAvailable(status: string): boolean {
  const normalized = status.toLowerCase();
  return !["inactive", "archived", "disabled", "draft"].some(
    (value) => normalized === value || normalized.endsWith(`_${value}`)
  );
}

function cycleLabel(cycle: CatalogBillingCycle): string {
  return cycle === "yearly" ? "Year" : "Month";
}

function itemPrice(
  item: Pick<ModuleItem | PackageItem, "monthlyPrice" | "yearlyPrice">,
  cycle: CatalogBillingCycle
): number | null {
  return cycle === "yearly" ? item.yearlyPrice : item.monthlyPrice;
}

function formatPrice(value: number | null): string {
  return value == null ? "Not available" : `$${value.toLocaleString("en-US")}`;
}

function mapApiPackage(
  pkg: ApiPackage,
  moduleCatalog: ApiModule[]
): PackageItem {
  const embedded = new Map(
    pkg.included_modules.map((module) => [module.id, module])
  );
  const moduleIds =
    pkg.module_ids.length > 0
      ? pkg.module_ids
      : pkg.included_modules.map((module) => module.id);
  const included = moduleIds.flatMap((moduleId) => {
    const module =
      embedded.get(moduleId) ||
      moduleCatalog.find((item) => item.id === moduleId);
    return module && isCatalogAvailable(module.status)
      ? [mapApiModule(module)]
      : [];
  });

  return {
    id: pkg.id,
    name: pkg.name,
    subtitle: pkg.description,
    monthlyPrice: pkg.monthly_price,
    yearlyPrice: pkg.yearly_price,
    icon: pkg.icon,
    moduleIds,
    included
  };
}

function ModuleIcon({ icon: iconName }: { icon: string }) {
  const Icon = getIcon(iconName);
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
      <Icon className="h-4 w-4" strokeWidth={1.8} />
    </span>
  );
}

function IncludedModule({ item }: { item: ModuleItem }) {
  return (
    <article className="flex min-h-[76px] items-start gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <ModuleIcon icon={item.icon} />
      <div className="min-w-0 pt-0.5">
        <h4 className="text-sm font-semibold leading-4 text-gray-900">
          {item.title}
        </h4>
        <p className="mt-1 text-xs leading-[1.4] text-gray-500">
          {item.description}
        </p>
      </div>
    </article>
  );
}

function AddOnModule({
  item,
  active,
  selected,
  billingCycle,
  onBillingCycleChange,
  onToggle,
  disabled = false
}: {
  item: ModuleItem;
  active: boolean;
  selected: boolean;
  billingCycle: CatalogBillingCycle;
  onBillingCycleChange: (cycle: CatalogBillingCycle) => void;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex min-h-[76px] items-start gap-3 rounded-lg border bg-white p-3 transition-colors",
        active && selected
          ? "border-primary-600 ring-1 ring-primary-600"
          : "border-gray-200"
      )}
    >
      <ModuleIcon icon={item.icon} />
      <div className="min-w-0 flex-1 pt-0.5">
        <h4 className="text-sm font-semibold leading-4 text-gray-900">
          {item.title}
        </h4>
        <p className="mt-1 text-xs leading-[1.4] text-gray-500">
          {item.description}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-1 text-[10px] leading-3">
          <span className="font-semibold text-primary-700">
            {formatPrice(itemPrice(item, billingCycle))} /
            {cycleLabel(billingCycle)}
          </span>
          {item.subscribed && (
            <span className="font-semibold text-primary-600">
              Already Subscribed
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        <Select
          value={billingCycle}
          onValueChange={(value) =>
            onBillingCycleChange(value as CatalogBillingCycle)
          }
        >
          <SelectTrigger
            aria-label={`${item.title} billing cycle`}
            className="h-7 w-24 rounded-md px-2 text-[10px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly" disabled={item.yearlyPrice == null}>
              Yearly
            </SelectItem>
          </SelectContent>
        </Select>
        {!item.subscribed && (
          <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={cn(
              "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded px-2 text-[10px] font-semibold transition-colors",
              disabled
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : selected
                  ? "border border-red-400 bg-white text-red-500 hover:bg-red-50"
                  : "bg-primary-700 text-white hover:bg-primary-800"
            )}
            aria-label={`${selected ? "Remove" : "Add"} ${item.title}`}
          >
            {selected ? (
              <X className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            {disabled ? "Active" : selected ? "Remove" : "Add-on"}
          </button>
        )}
      </div>
    </article>
  );
}

function PackageCard({
  packageItem,
  availableModules,
  selectedPackage,
  selectedAddOns,
  billingCycle,
  search,
  addOnBillingCycles,
  onAddOnBillingCycleChange,
  onBillingCycleChange,
  onSearch,
  onSelect,
  onToggleAddOn,
  isActiveSubscription,
  activeModuleIds
}: {
  packageItem: PackageItem;
  availableModules: ModuleItem[];
  selectedPackage: string | null;
  selectedAddOns: string[];
  billingCycle: CatalogBillingCycle;
  search: string;
  addOnBillingCycles: Record<string, CatalogBillingCycle>;
  onAddOnBillingCycleChange: (id: string, cycle: CatalogBillingCycle) => void;
  onBillingCycleChange: (cycle: CatalogBillingCycle) => void;
  onSearch: (value: string) => void;
  onSelect: () => void;
  onToggleAddOn: (id: string) => void;
  isActiveSubscription: boolean;
  activeModuleIds: string[];
}) {
  const isSelected = selectedPackage === packageItem.id;
  const addOns = useMemo<ModuleItem[]>(
    () =>
      availableModules.filter(
        (module) => module.isMenu && !packageItem.moduleIds.includes(module.id)
      ),
    [availableModules, packageItem.moduleIds]
  );
  const visibleAddOns = addOns.filter((item) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  });
  const selectedAddOnItems = addOns.filter((item) =>
    selectedAddOns.includes(item.id)
  );
  const packagePrice = itemPrice(packageItem, billingCycle);
  const selectedAddOnPrices = selectedAddOnItems.map((item) =>
    itemPrice(item, addOnBillingCycles[item.id] ?? "monthly")
  );
  const yearlyAvailable = packageItem.yearlyPrice != null;
  const mixedCycles = isSelected && selectedAddOnItems.some(
    (item) => (addOnBillingCycles[item.id] ?? "monthly") !== billingCycle
  );
  const totalPrice =
    packagePrice == null || selectedAddOnPrices.some((price) => price == null)
      ? null
      : packagePrice +
        (isSelected
          ? selectedAddOnPrices.reduce<number>(
              (sum, price) => sum + (price ?? 0),
              0
            )
          : 0);
  const selectedAddOnCount = isSelected ? selectedAddOnItems.length : 0;

  return (
    <section
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        isSelected ? "border-primary-600" : "border-gray-200"
      )}
    >
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-gray-200 px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {(() => {
            const PackageIcon = getIcon(packageItem.icon);
            return <PackageIcon className="h-5 w-5" />;
          })()}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold leading-5 text-gray-950">
              {packageItem.name}
            </h2>
            {isActiveSubscription && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold text-green-700">
                Active
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-4 text-gray-600">
            {packageItem.subtitle}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-5">
          <p className="text-sm font-bold text-gray-950">
            {formatPrice(packagePrice)}
            <span className="font-normal text-gray-500">
              {" "}
              /{cycleLabel(billingCycle)}
            </span>
          </p>
          <Select
            value={billingCycle}
            onValueChange={(value) =>
              onBillingCycleChange(value as CatalogBillingCycle)
            }
          >
            <SelectTrigger
              aria-label={`${packageItem.name} billing cycle`}
              className="h-9 w-28 rounded-md text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly" disabled={!yearlyAvailable}>
                Yearly
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="flex min-h-0 flex-col border-gray-200 p-4 lg:border-r">
          <h3 className="text-sm font-semibold text-gray-950">
            Included Modules
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            These modules are part of the {packageItem.name} package.
          </p>
          <div className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {packageItem.included.map((item) => (
              <IncludedModule key={item.id} item={item} />
            ))}
            {packageItem.included.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-gray-500">
                No modules are included in this package.
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col border-t border-gray-200 p-4 lg:border-t-0">
          <h3 className="text-sm font-semibold text-gray-950">
            Add-on Modules
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Enhance your packages with additional capabilities.
          </p>
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search"
              className="h-8 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-[11px] text-gray-800 outline-none placeholder:text-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <div className="mt-2.5 min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {visibleAddOns.map((item) => (
              <AddOnModule
                key={item.id}
                item={item}
                active={isSelected}
                selected={selectedAddOns.includes(item.id)}
                billingCycle={addOnBillingCycles[item.id] ?? "monthly"}
                onBillingCycleChange={(cycle) => onAddOnBillingCycleChange(item.id, cycle)}
                onToggle={() => onToggleAddOn(item.id)}
                disabled={
                  isActiveSubscription || activeModuleIds.includes(item.id)
                }
              />
            ))}
            {visibleAddOns.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-200 text-xs text-gray-500">
                No add-on modules found.
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3 border-t border-gray-200 bg-gray-50/60 px-4 py-3">
        <p className="text-xs text-gray-500">
          <strong className="text-sm text-gray-900">
            {packageItem.included.length + selectedAddOnCount}
          </strong>{" "}
          Total Modules
        </p>
        <p className="text-xs text-gray-500">
          <strong className="text-sm text-gray-900">
            {packageItem.included.length}
          </strong>{" "}
          Included Modules
        </p>
        <p className="text-xs text-gray-500">
          <strong className="text-sm text-gray-900">
            {selectedAddOnCount}
          </strong>{" "}
          Add-ons
        </p>

        <div className="ml-auto flex items-center gap-4">
          <p className="text-sm font-bold text-primary-700">
            {formatPrice(totalPrice)}
            <span className="font-normal text-gray-500">
              {" "}
              {mixedCycles ? "due initially" : `/${cycleLabel(billingCycle)}`}
            </span>
          </p>
          {isActiveSubscription ? (
            <button
              type="button"
              disabled
              className="h-8 cursor-not-allowed rounded-md bg-green-100 px-3 text-xs font-semibold text-green-700"
            >
              Already Active
            </button>
          ) : isSelected ? (
            <button
              type="button"
              onClick={onSelect}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-red-400 bg-white px-3 text-xs font-semibold text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={onSelect}
              className="h-8 cursor-pointer rounded-md bg-primary-700 px-3 text-xs font-semibold text-white hover:bg-primary-800"
            >
              Add All Modules
            </button>
          )}
        </div>
      </footer>
    </section>
  );
}

export default function ExploreModulePage() {
  const router = useRouter();
  const { collapsed } = useSidebar();
  const packagesQuery = useGetPackages();
  const modulesQuery = useGetModules();
  const authMe = useAuthMe();
  const [packageSearch, setPackageSearch] = useState("");
  const [moduleSearches, setModuleSearches] = useState<Record<string, string>>(
    {}
  );
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [activePackage, setActivePackage] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] =
    useState<CatalogBillingCycle>("monthly");
  const [addOnBillingCycles, setAddOnBillingCycles] = useState<Record<string, CatalogBillingCycle>>({});
  const [packagePanelCollapsed, setPackagePanelCollapsed] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<
    Record<string, string[]>
  >({});

  const availableModules = useMemo<ModuleItem[]>(
    () =>
      (modulesQuery.data?.items ?? [])
        .filter((module) => isCatalogAvailable(module.status))
        .map(mapApiModule),
    [modulesQuery.data]
  );
  const packages = useMemo<PackageItem[]>(
    () =>
      (packagesQuery.data?.items ?? [])
        .filter((pkg) => isCatalogAvailable(pkg.status))
        .map((pkg) => mapApiPackage(pkg, modulesQuery.data?.items ?? [])),
    [modulesQuery.data, packagesQuery.data]
  );

  useEffect(() => {
    if (!activePackage && packages.length > 0) {
      setActivePackage(packages[0].id);
    }
    setSelectedPackages((current) =>
      current.filter((id) => packages.some((item) => item.id === id))
    );
  }, [activePackage, packages]);

  const visiblePackages = useMemo(() => {
    const query = packageSearch.trim().toLowerCase();
    if (!query) return packages;
    return packages.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  }, [packageSearch, packages]);

  function togglePackage(id: string) {
    if (subscribedPackageIds.includes(id)) return;
    setSelectedPackages((current) =>
      current.includes(id)
        ? current.filter((packageId) => packageId !== id)
        : [...current, id]
    );
  }

  function toggleAddOn(packageId: string, addOnId: string) {
    if (subscribedPackageIds.includes(packageId)) return;
    setSelectedPackages((current) =>
      current.includes(packageId) ? current : [...current, packageId]
    );
    setSelectedAddOns((current) => {
      const items = current[packageId] ?? [];
      return {
        ...current,
        [packageId]: items.includes(addOnId)
          ? items.filter((id) => id !== addOnId)
          : [...items, addOnId]
      };
    });
  }

  const selectedPackageItems = packages.filter((item) =>
    selectedPackages.includes(item.id)
  );
  const validSelectedAddOnsByPackage = Object.fromEntries(
    selectedPackageItems.map((packageItem) => [
      packageItem.id,
      (selectedAddOns[packageItem.id] ?? []).filter(
        (id) =>
          availableModules.some(
            (module) => module.id === id && module.isMenu
          ) && !packageItem.moduleIds.includes(id)
      )
    ])
  ) as Record<string, string[]>;
  const selectedCount = Object.values(validSelectedAddOnsByPackage).reduce(
    (sum, ids) => sum + ids.length,
    0
  );
  const selectedIncludedCount = selectedPackageItems.reduce(
    (sum, item) => sum + item.included.length,
    0
  );
  const grandTotalModules = selectedIncludedCount + selectedCount;
  const isLoading = packagesQuery.isLoading || modulesQuery.isLoading;
  const isError = packagesQuery.isError || modulesQuery.isError;
  const activePackageItem = packages.find((item) => item.id === activePackage);
  const subscribedPackageIds = useMemo(
    () =>
      authMe.data?.subscription_expired
        ? []
        : getSubscribedPackageIds(authMe.data?.subscription),
    [authMe.data?.subscription, authMe.data?.subscription_expired]
  );
  const activeModuleIds = useMemo(
    () =>
      authMe.data?.subscription_expired
        ? []
        : getActiveModuleIds(
            authMe.data?.subscription,
            authMe.data?.rbac?.modules ?? []
          ),
    [
      authMe.data?.rbac?.modules,
      authMe.data?.subscription,
      authMe.data?.subscription_expired
    ]
  );

  useEffect(() => {
    if (activeModuleIds.length === 0 && subscribedPackageIds.length === 0)
      return;
    setSelectedAddOns((current) =>
      Object.fromEntries(
        Object.entries(current).map(([packageId, moduleIds]) => [
          packageId,
          subscribedPackageIds.includes(packageId)
            ? []
            : moduleIds.filter((id) => !activeModuleIds.includes(id))
        ])
      )
    );
    setSelectedPackages((current) =>
      current.filter((id) => !subscribedPackageIds.includes(id))
    );
  }, [activeModuleIds, subscribedPackageIds]);

  function changeBillingCycle(cycle: CatalogBillingCycle) {
    if (cycle === "monthly") {
      setBillingCycle(cycle);
      return;
    }
    const packagesToPrice =
      selectedPackageItems.length > 0
        ? selectedPackageItems
        : activePackageItem
          ? [activePackageItem]
          : [];
    const yearlyAvailable = packagesToPrice.every((item) => item.yearlyPrice != null);
    if (yearlyAvailable) setBillingCycle(cycle);
  }

  function continueToReview() {
    if (selectedPackages.length === 0) return;

    const params = new URLSearchParams({
      billing_cycle: billingCycle,
      package: selectedPackages[0],
      packages: selectedPackages.join(",")
    });
    const includedIds = new Set(selectedPackageItems.flatMap((item) => item.moduleIds));
    const addOns = [...new Set(Object.values(validSelectedAddOnsByPackage).flat())]
      .filter((id) => !includedIds.has(id));
    if (addOns.length) {
      params.set("addons", addOns.join(","));
      params.set("addon_billing_cycles", JSON.stringify(Object.fromEntries(
        addOns.map((id) => [id, addOnBillingCycles[id] ?? "monthly"])
      )));
    }
    router.push(`/app/workspace-dashboard/review-order?${params.toString()}`);
  }

  return (
    <div className="flex h-[calc(100vh-6.5rem)] min-h-0 flex-col overflow-hidden pb-14">
      <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/app/workspace-dashboard"
          className="inline-flex w-fit items-center gap-2 text-lg font-bold text-gray-950 hover:text-primary-700"
        >
          <ArrowLeft className="h-5 w-5" />
          Explore Modules
        </Link>
      </div>

      <div
        className={cn(
          "grid min-h-0 flex-1 items-stretch gap-4 overflow-hidden transition-[grid-template-columns] duration-300",
          packagePanelCollapsed
            ? "lg:grid-cols-[60px_minmax(0,1fr)]"
            : "lg:grid-cols-[260px_minmax(0,1fr)]"
        )}
      >
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-3 transition-all duration-300">
          <div
            className={cn(
              "mb-3 flex items-center px-1",
              packagePanelCollapsed ? "justify-center" : "justify-between"
            )}
          >
            {!packagePanelCollapsed && (
              <span className="text-xs font-medium text-gray-500">Section</span>
            )}
            <button
              type="button"
              onClick={() => setPackagePanelCollapsed((current) => !current)}
              aria-label={
                packagePanelCollapsed
                  ? "Expand package navigation"
                  : "Collapse package navigation"
              }
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md bg-primary-700 text-white hover:bg-primary-800"
            >
              {packagePanelCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </button>
          </div>
          {!packagePanelCollapsed && (
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={packageSearch}
                onChange={(event) => setPackageSearch(event.target.value)}
                placeholder="Search ..."
                className="h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-xs outline-none focus:border-primary-400"
              />
            </label>
          )}
          <nav className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {visiblePackages.map((item) => {
              const Icon = getIcon(item.icon);
              const isActive = activePackage === item.id;
              const isSelected = selectedPackages.includes(item.id);
              const isSubscribed = subscribedPackageIds.includes(item.id);
              const addOnCount = selectedAddOns[item.id]?.length ?? 0;
              const totalModuleCount = item.included.length + addOnCount;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActivePackage(item.id)}
                  title={packagePanelCollapsed ? item.name : undefined}
                  className={cn(
                    "flex h-10 w-full items-center rounded-md text-left text-xs font-semibold transition-colors",
                    packagePanelCollapsed
                      ? "justify-center px-0"
                      : "gap-2 px-3",
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {!packagePanelCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {!packagePanelCollapsed && isSubscribed && (
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[8px] font-bold text-green-700">
                      Active
                    </span>
                  )}
                  {!packagePanelCollapsed && isSelected && (
                    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] text-white">
                      {totalModuleCount}
                    </span>
                  )}
                  {!packagePanelCollapsed && (
                    <ChevronRight
                      className={cn("h-3.5 w-3.5", !isSelected && "ml-auto")}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-h-0 overflow-hidden">
          {isLoading && (
            <div className="flex min-h-64 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          )}

          {isError && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-red-300 bg-red-50 text-center">
              <PackageCheck className="h-9 w-9 text-red-400" />
              <p className="mt-3 text-sm font-semibold text-gray-800">
                Failed to load packages
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Please retry loading the portal catalog.
              </p>
              <button
                type="button"
                onClick={() => {
                  packagesQuery.refetch();
                  modulesQuery.refetch();
                }}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && activePackageItem && (
            <PackageCard
              key={activePackageItem.id}
              packageItem={activePackageItem}
              availableModules={availableModules}
              selectedPackage={
                selectedPackages.includes(activePackageItem.id)
                  ? activePackageItem.id
                  : null
              }
              selectedAddOns={selectedAddOns[activePackageItem.id] ?? []}
              billingCycle={billingCycle}
              search={moduleSearches[activePackageItem.id] ?? ""}
              onBillingCycleChange={changeBillingCycle}
              addOnBillingCycles={addOnBillingCycles}
              onAddOnBillingCycleChange={(id, cycle) => setAddOnBillingCycles((current) => ({ ...current, [id]: cycle }))}
              onSearch={(value) =>
                setModuleSearches((current) => ({
                  ...current,
                  [activePackageItem.id]: value
                }))
              }
              onSelect={() => togglePackage(activePackageItem.id)}
              onToggleAddOn={(id) => toggleAddOn(activePackageItem.id, id)}
              isActiveSubscription={subscribedPackageIds.includes(
                activePackageItem.id
              )}
              activeModuleIds={activeModuleIds}
            />
          )}

          {!isLoading && !isError && visiblePackages.length === 0 && (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center">
              <PackageCheck className="h-9 w-9 text-primary-400" />
              <p className="mt-3 text-sm font-semibold text-gray-800">
                No packages found
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Try another package name.
              </p>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] backdrop-blur transition-[left] duration-300",
          collapsed ? "lg:left-16" : "lg:left-64"
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-950">
              {grandTotalModules} Total Modules
            </p>
            <p className="mt-0.5 text-[10px] text-gray-500">
              {selectedIncludedCount} Included Modules | {selectedCount} Add-ons
            </p>
          </div>
          <button
            type="button"
            onClick={continueToReview}
            disabled={selectedPackages.length === 0}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-gray-950 px-4 text-xs font-semibold text-white shadow-lg hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CircleDollarSign className="h-4 w-4" />
            Add to Workspace ({grandTotalModules})
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

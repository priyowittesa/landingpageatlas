"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PortalModule } from "../catalog";
import type { ModuleConnection } from "../connections";
import { ConnectionCatalogPicker } from "./ConnectionCatalogPicker";
import { DesignIcon } from "./shared";

export function ModuleConnectionsPanel({
  items,
  error,
  isLoading,
  selected,
  onChange,
  retry,
  submodules,
  submodulesError,
  submodulesLoading,
  retrySubmodules,
  activeSubmodule,
  onSelectSubmodule,
  selectionDisabled,
  scope,
  onCatalogBusyChange
}: {
  items: ModuleConnection[] | undefined;
  error: unknown;
  isLoading: boolean;
  selected: string[];
  onChange: (update: (current: string[]) => string[]) => void;
  retry: () => void;
  submodules: PortalModule[] | undefined;
  submodulesError: unknown;
  submodulesLoading: boolean;
  retrySubmodules: () => void;
  activeSubmodule: PortalModule | undefined;
  onSelectSubmodule: (id: string) => void;
  selectionDisabled: boolean;
  scope: string | null;
  onCatalogBusyChange: (delta: number) => void;
}) {
  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <DesignIcon name="sub-modules" small />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">Module Data Sources</h2>
          <p className="text-sm text-gray-500">
            Choose databases, schemas and tables for this module.
          </p>
        </div>
        {items && (
          <span className="rounded-full bg-primary-50 px-2 py-1 text-xs text-primary-700">
            {selected.length} table{selected.length === 1 ? "" : "s"} selected
          </span>
        )}
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border md:flex">
        <aside
          aria-label="Sub-modules"
          className="border-b md:w-64 md:shrink-0 md:border-b-0 md:border-r"
        >
          <div className="flex justify-between border-b px-4 py-3 text-xs font-medium uppercase text-gray-500">
            <span>Sub-modules</span>
            {submodules && <span>{submodules.length}</span>}
          </div>
          {submodulesLoading ? (
            <p role="status" className="p-4 text-sm text-gray-500">
              Loading sub-modules...
            </p>
          ) : submodulesError || !submodules ? (
            <div role="alert" className="space-y-2 p-4 text-sm text-gray-500">
              <p>Unable to load sub-modules.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retrySubmodules}
              >
                Try again
              </Button>
            </div>
          ) : submodules.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No sub-modules found.</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto md:max-h-none">
              {submodules.map((submodule) => (
                <li key={submodule.id} className="border-b last:border-b-0">
                  <button
                    type="button"
                    disabled={selectionDisabled}
                    onClick={() => onSelectSubmodule(submodule.id)}
                    aria-pressed={activeSubmodule?.id === submodule.id}
                    aria-label={`Select ${submodule.name}`}
                    className={cn(
                      "flex w-full items-center gap-2 border-l-2 border-l-transparent px-4 py-3 text-left text-sm hover:bg-primary-50 disabled:opacity-50",
                      activeSubmodule?.id === submodule.id &&
                        "border-l-primary-500 bg-primary-50 text-primary-700"
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {submodule.name}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {submodule.key}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">
          <div>
            <h3 className="text-lg font-semibold">
              {activeSubmodule?.name ?? "Sub-module Connections"}
            </h3>
            <p className="text-sm text-gray-500">
              Select a sub-module to configure the databases, schemas and tables
              it reads.
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Check or uncheck tables and schemas, then save your changes.
            Removing saved selections requires confirmation.
          </p>
          {!activeSubmodule ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Select an available sub-module to view its connections.
            </p>
          ) : isLoading ? (
            <p role="status" className="py-8 text-center text-sm text-gray-500">
              Loading connections...
            </p>
          ) : error || !items ? (
            <div role="alert" className="rounded-lg border p-6 text-center">
              <p className="mb-3 text-sm text-gray-500">
                Unable to load module connections. Existing selections have not
                been changed.
              </p>
              <Button type="button" variant="outline" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : (
            <ConnectionCatalogPicker
              key={activeSubmodule.id}
              scope={scope}
              selected={selected}
              onChange={onChange}
              onBusyChange={onCatalogBusyChange}
            />
          )}
        </div>
      </div>
    </section>
  );
}

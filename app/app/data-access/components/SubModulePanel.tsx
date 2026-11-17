"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { connectionKey } from "../connections";
import { changeDatabase, configuredCount, sourceDatabase } from "../model";
import type {
  DataAccessDatabase,
  DataAccessModule,
  DataAccessSubModule
} from "../types";
import { DatabaseSelect } from "./DatabaseSelect";
import { DesignIcon } from "./shared";
import { TablePicker } from "./TablePicker";

export function SubModulePanel({
  draft,
  databases,
  onChange,
  onHistory
}: {
  draft: DataAccessModule;
  databases: DataAccessDatabase[];
  onChange: (module: DataAccessModule) => void;
  onHistory: () => void;
}) {
  const [selectedId, setSelectedId] = useState(draft.subModules[0]?.id);
  const [editingSource, setEditingSource] = useState(false);
  const [editingOutput, setEditingOutput] = useState(false);
  const selected = draft.subModules.find((sub) => sub.id === selectedId);
  const source = selected ? sourceDatabase(draft, selected) : null;
  const database = databases.find((item) => item.id === source);
  const configured = configuredCount(draft);
  const previewItems = database
    ? [
        {
          id: database.id,
          module_id: draft.id,
          database_name: database.id,
          selected: false,
          schemas: database.schemas.map((schema) => ({
            id: schema.name,
            schema_name: schema.name,
            tables: schema.tables.map((table) => ({
              id: table.id,
              table_name: table.name,
              selected: false
            }))
          }))
        }
      ]
    : [];
  const previewKeys = new Map(
    database?.schemas.flatMap((schema) =>
      schema.tables.map(
        (table) =>
          [
            table.id,
            connectionKey({
              database_name: database.id,
              schema_name: schema.name,
              table_name: table.name
            })
          ] as const
      )
    ) ?? []
  );

  const updateSub = (update: Partial<DataAccessSubModule>) => {
    if (!selected) return;
    onChange({
      ...draft,
      subModules: draft.subModules.map((sub) =>
        sub.id === selected.id ? { ...sub, ...update } : sub
      )
    });
  };

  return (
    <section className="rounded-xl border bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <DesignIcon name="sub-modules" small />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold">Sub-module Data Sources</h2>
          <p className="text-sm text-gray-500">
            Each sub-module gets its own schemas and tables. Databases shown
            here are sample connections.
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
          {configured} of {draft.subModules.length} sub-modules configured
        </span>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border md:flex">
        <div className="border-b md:w-64 md:shrink-0 md:border-b-0 md:border-r">
          <div className="flex justify-between border-b px-4 py-3 text-xs font-medium uppercase text-gray-500">
            <span>Sub-modules</span>
            <span>{draft.subModules.length}</span>
          </div>
          <div className="max-h-64 overflow-y-auto md:max-h-none">
            {draft.subModules.map((sub) => {
              const isConfigured = Boolean(
                sourceDatabase(draft, sub) && sub.tables.length
              );
              return (
                <button
                  key={sub.id}
                  type="button"
                  aria-pressed={selectedId === sub.id}
                  onClick={() => {
                    setSelectedId(sub.id);
                    setEditingSource(false);
                    setEditingOutput(false);
                  }}
                  className={cn(
                    "flex w-full gap-2 border-b border-l-2 border-l-transparent px-3 py-3 text-left text-sm last:border-b-0 hover:bg-gray-50",
                    selectedId === sub.id &&
                      "border-l-primary-500 bg-primary-50/60 text-primary-700"
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full",
                      isConfigured ? "bg-green-600" : "border border-gray-400"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {sub.name}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {sub.tables.length
                        ? `${sub.tables.length} table${sub.tables.length === 1 ? "" : "s"} selected`
                        : "No tables selected"}
                    </span>
                  </span>
                </button>
              );
            })}
            {draft.subModules.length === 0 && (
              <p className="p-4 text-sm text-gray-500">
                No sub-modules available.
              </p>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          {selected ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold">{selected.name}</h3>
                  <p className="text-sm text-gray-500">
                    Pick the schemas and tables this sub-module reads.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={onHistory}>
                  Change History
                </Button>
              </div>
              <div className="space-y-3 rounded-lg border p-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <span className="text-gray-500">Reads from</span>
                  <div className="min-w-0">
                    {editingSource ? (
                      <div className="space-y-1">
                        <DatabaseSelect
                          label={`Source database for ${selected.name}`}
                          value={selected.database}
                          databases={databases}
                          emptyLabel="Module default"
                          onChange={(value) => {
                            onChange(changeDatabase(draft, value, selected.id));
                            setEditingSource(false);
                          }}
                        />
                        <p className="text-xs text-gray-500">
                          Changing the source clears this sub-module&apos;s
                          selected tables.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{source ?? "Not set"}</span>
                        {!selected.database && source && (
                          <span className="text-xs text-gray-500">
                            module default
                          </span>
                        )}
                        <button
                          type="button"
                          className="text-primary-700 hover:underline"
                          onClick={() => setEditingSource(true)}
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                  <span className="text-gray-500">Writes result to</span>
                  <div className="min-w-0">
                    {editingOutput ? (
                      <DatabaseSelect
                        label={`Output database for ${selected.name}`}
                        value={selected.outputDatabase}
                        databases={databases}
                        emptyLabel="Not set"
                        onChange={(value) => {
                          updateSub({ outputDatabase: value });
                          setEditingOutput(false);
                        }}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {selected.outputDatabase && (
                          <span>{selected.outputDatabase}</span>
                        )}
                        <button
                          type="button"
                          className="text-primary-700 hover:underline"
                          onClick={() => setEditingOutput(true)}
                        >
                          {selected.outputDatabase
                            ? "Change"
                            : "+ Add output database"}
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">
                      Only for sub-modules that save results somewhere else
                    </p>
                  </div>
                </div>
              </div>
              <TablePicker
                key={`${selected.id}:${source ?? ""}`}
                items={previewItems}
                selected={selected.tables.flatMap(
                  (id) => previewKeys.get(id) ?? []
                )}
                locked={[]}
                onChange={(keys) =>
                  updateSub({
                    tables: [...previewKeys]
                      .filter(([, key]) => keys.includes(key))
                      .map(([id]) => id)
                  })
                }
              />
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">
              Select a sub-module to configure its data sources.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronRight, Minus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { connectionKey, type ModuleConnection } from "../connections";

export function selectionState(
  ids: string[],
  selected: string[]
): boolean | "indeterminate" {
  const count = ids.filter((id) => selected.includes(id)).length;
  return count === 0 ? false : count === ids.length ? true : "indeterminate";
}

export function updateSelection(
  selected: string[],
  ids: string[],
  checked: boolean
) {
  const affected = new Set(ids);
  return checked
    ? [...selected, ...ids.filter((id) => !selected.includes(id))]
    : selected.filter((id) => !affected.has(id));
}

function TreeIcon({ name }: { name: "database" | "folder" | "table" }) {
  return (
    <Image
      src={`/images/data-access/tree-${name}.svg`}
      alt=""
      width={18}
      height={18}
      unoptimized
    />
  );
}

function TreeCheckbox({
  ids,
  selected,
  locked,
  onChange,
  label
}: {
  ids: string[];
  selected: string[];
  locked: string[];
  onChange: (ids: string[]) => void;
  label: string;
}) {
  const checked = selectionState(ids, selected);
  const allLocked = ids.length > 0 && ids.every((id) => locked.includes(id));
  return (
    <span className="relative flex shrink-0 items-center justify-center">
      <Checkbox
        aria-label={label}
        checked={checked}
        disabled={!ids.length || allLocked}
        onCheckedChange={(value) =>
          onChange([
            ...new Set([
              ...locked,
              ...updateSelection(selected, ids, value === true)
            ])
          ])
        }
        className={cn(
          checked === "indeterminate" &&
            "border-primary-600 bg-primary-600 [&_[data-slot=checkbox-indicator]]:invisible"
        )}
      />
      {checked === "indeterminate" && (
        <Minus
          aria-hidden="true"
          className="pointer-events-none absolute size-3 text-white"
        />
      )}
    </span>
  );
}

export function TablePicker({
  items,
  selected,
  locked,
  onChange
}: {
  items: ModuleConnection[];
  selected: string[];
  locked: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const term = search.trim().toLowerCase();
  const databases = items
    .map((database) => ({
      ...database,
      schemas: database.schemas
        .map((schema) => ({
          ...schema,
          tables: schema.tables.filter(
            (table) =>
              !term ||
              database.database_name.toLowerCase().includes(term) ||
              schema.schema_name.toLowerCase().includes(term) ||
              table.table_name.toLowerCase().includes(term)
          )
        }))
        .filter((schema) => !term || schema.tables.length > 0)
    }))
    .filter((database) => !term || database.schemas.length > 0);
  const isOpen = (id: string) => Boolean(term) || expanded.includes(id);
  const toggle = (id: string) =>
    setExpanded((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-3 size-4 text-gray-500"
          />
          <Input
            aria-label="Search schemas and tables"
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch("");
            setExpanded([]);
          }}
        >
          Collapse all
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-gray-500">
          No connections are available for this module.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Database / Schema / Table
          </div>
          {databases.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-500">
              No databases, schemas or tables match your search.
            </p>
          ) : (
            databases.map((database) => {
              const databaseNode = `database:${database.id}`;
              const allIds = database.schemas.flatMap((schema) =>
                schema.tables.map((table) =>
                  connectionKey({
                    database_name: database.database_name,
                    schema_name: schema.schema_name,
                    table_name: table.table_name
                  })
                )
              );
              return (
                <div key={database.id}>
                  <div className="flex min-h-10 items-center gap-2 border-b px-3 text-sm">
                    <button
                      type="button"
                      aria-label={`${isOpen(databaseNode) ? "Collapse" : "Expand"} ${database.database_name}`}
                      aria-expanded={isOpen(databaseNode)}
                      onClick={() => toggle(databaseNode)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    >
                      {isOpen(databaseNode) ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </button>
                    <TreeIcon name="database" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {database.database_name}
                    </span>
                    <TreeCheckbox
                      ids={allIds}
                      selected={selected}
                      locked={locked}
                      onChange={onChange}
                      label={`Select tables in ${database.database_name}`}
                    />
                  </div>
                  {isOpen(databaseNode) &&
                    database.schemas.map((schema) => {
                      const schemaNode = `schema:${database.id}:${schema.id}`;
                      const ids = schema.tables.map((table) =>
                        connectionKey({
                          database_name: database.database_name,
                          schema_name: schema.schema_name,
                          table_name: table.table_name
                        })
                      );
                      return (
                        <div key={schema.id}>
                          <div className="flex min-h-10 items-center gap-2 border-b pl-8 pr-3 text-sm">
                            <button
                              type="button"
                              aria-label={`${isOpen(schemaNode) ? "Collapse" : "Expand"} ${database.database_name}.${schema.schema_name}`}
                              aria-expanded={isOpen(schemaNode)}
                              onClick={() => toggle(schemaNode)}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100"
                            >
                              {isOpen(schemaNode) ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </button>
                            <TreeIcon name="folder" />
                            <span className="min-w-0 flex-1 truncate">
                              {schema.schema_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {ids.filter((id) => selected.includes(id)).length}{" "}
                              of {ids.length}
                            </span>
                            <TreeCheckbox
                              ids={ids}
                              selected={selected}
                              locked={locked}
                              onChange={onChange}
                              label={`Select tables in ${database.database_name}.${schema.schema_name}`}
                            />
                          </div>
                          {isOpen(schemaNode) &&
                            schema.tables.map((table) => {
                              const id = connectionKey({
                                database_name: database.database_name,
                                schema_name: schema.schema_name,
                                table_name: table.table_name
                              });
                              return (
                                <div
                                  key={table.id}
                                  className="flex min-h-10 items-center gap-2 border-b pl-14 pr-3 text-sm"
                                >
                                  <TreeIcon name="table" />
                                  <span className="min-w-0 flex-1 truncate text-gray-600">
                                    {table.table_name}
                                  </span>
                                  <TreeCheckbox
                                    ids={[id]}
                                    selected={selected}
                                    locked={locked}
                                    onChange={onChange}
                                    label={`Select ${database.database_name}.${schema.schema_name}.${table.table_name}`}
                                  />
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

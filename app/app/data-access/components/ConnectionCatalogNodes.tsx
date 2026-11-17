"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { connectionKey, parseConnectionKey } from "../connections";
import {
  connectionSchemasOptions,
  connectionTablesOptions
} from "../use-connection-catalog";
import { selectionState, updateSelection } from "./TablePicker";

export type CatalogSelectionProps = {
  selected: string[];
  onChange: (update: (current: string[]) => string[]) => void;
  onBusyChange: (delta: number) => void;
};

function CatalogIcon({ name }: { name: "database" | "folder" | "table" }) {
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

function CatalogCheckbox({
  checked,
  disabled,
  label,
  onChange
}: {
  checked: boolean | "indeterminate";
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span className="relative flex shrink-0 items-center justify-center">
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onCheckedChange={(value) => onChange(value === true)}
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

function CatalogError({
  message,
  retry
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-2 border-b px-4 py-2 text-sm text-red-600"
    >
      <span>{message}</span>
      <Button type="button" variant="outline" size="sm" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

export function CatalogTable({
  databaseName,
  schemaName,
  tableName,
  selected,
  onChange
}: Omit<CatalogSelectionProps, "onBusyChange"> & {
  databaseName: string;
  schemaName: string;
  tableName: string;
}) {
  const id = connectionKey({
    database_name: databaseName,
    schema_name: schemaName,
    table_name: tableName
  });
  return (
    <div className="flex min-h-10 items-center gap-2 border-b pl-14 pr-3 text-sm">
      <CatalogIcon name="table" />
      <span className="min-w-0 flex-1 truncate text-gray-600">{tableName}</span>
      <CatalogCheckbox
        checked={selected.includes(id)}
        label={`Select ${databaseName}.${schemaName}.${tableName}`}
        onChange={(value) =>
          onChange((current) => updateSelection(current, [id], value))
        }
      />
    </div>
  );
}

export function CatalogSchema({
  databaseName,
  schemaName,
  scope,
  selected,
  onChange,
  onBusyChange
}: CatalogSelectionProps & {
  databaseName: string;
  schemaName: string;
  scope: string | null;
}) {
  const client = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState<boolean | null>(null);
  const options = connectionTablesOptions(scope, databaseName, schemaName);
  const tables = useQuery({ ...options, enabled: Boolean(scope && expanded) });
  const tableKey = (name: string) =>
    connectionKey({
      database_name: databaseName,
      schema_name: schemaName,
      table_name: name
    });
  const ids = tables.data?.map((table) => tableKey(table.name));
  const selectedInSchema = selected.filter((key) => {
    const item = parseConnectionKey(key);
    return (
      item.database_name === databaseName && item.schema_name === schemaName
    );
  });
  const groupIds = ids
    ? [...new Set([...ids, ...selectedInSchema])]
    : undefined;
  const checked = groupIds
    ? selectionState(groupIds, selected)
    : selectedInSchema.length
      ? "indeterminate"
      : false;

  const selectSchema = async (value: boolean) => {
    if (!value) {
      setSelectionError(null);
      onChange((current) =>
        current.filter((key) => {
          const item = parseConnectionKey(key);
          return (
            item.database_name !== databaseName ||
            item.schema_name !== schemaName
          );
        })
      );
      return;
    }
    setSelecting(true);
    setSelectionError(null);
    onBusyChange(1);
    try {
      const available = await client.fetchQuery(options);
      const keys = available.map((table) => tableKey(table.name));
      onChange((current) => updateSelection(current, keys, true));
    } catch {
      setSelectionError(value);
    } finally {
      setSelecting(false);
      onBusyChange(-1);
    }
  };

  return (
    <div>
      <div className="flex min-h-10 items-center gap-2 border-b pl-8 pr-3 text-sm">
        <button
          type="button"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${databaseName}.${schemaName}`}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
        <CatalogIcon name="folder" />
        <span className="min-w-0 flex-1 truncate">{schemaName}</span>
        <span className="text-xs text-gray-500">
          {selecting
            ? "Loading..."
            : `${selectedInSchema.length}${groupIds ? ` of ${groupIds.length}` : ""}`}
        </span>
        <CatalogCheckbox
          checked={checked}
          label={`Select tables in ${databaseName}.${schemaName}`}
          disabled={
            !scope ||
            selecting ||
            Boolean(ids && ids.length === 0 && selectedInSchema.length === 0)
          }
          onChange={(value) => void selectSchema(value)}
        />
      </div>
      {selectionError !== null && (
        <CatalogError
          message="Unable to update this schema selection."
          retry={() => void selectSchema(selectionError)}
        />
      )}
      {expanded &&
        (tables.isLoading ? (
          <p
            role="status"
            className="border-b py-3 pl-14 text-sm text-gray-500"
          >
            Loading tables...
          </p>
        ) : tables.error || !tables.data ? (
          <CatalogError
            message="Unable to load tables."
            retry={() => void tables.refetch()}
          />
        ) : tables.data.length === 0 ? (
          <p className="border-b py-3 pl-14 text-sm text-gray-500">
            No tables found.
          </p>
        ) : (
          tables.data.map((table) => (
            <CatalogTable
              key={table.name}
              databaseName={databaseName}
              schemaName={schemaName}
              tableName={table.name}
              selected={selected}
              onChange={onChange}
            />
          ))
        ))}
    </div>
  );
}

export function CatalogDatabase({
  databaseName,
  scope,
  expanded,
  onToggle,
  ...selection
}: CatalogSelectionProps & {
  databaseName: string;
  scope: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  const schemas = useQuery({
    ...connectionSchemasOptions(scope, databaseName),
    enabled: Boolean(scope && expanded)
  });
  const count = selection.selected.filter(
    (key) => parseConnectionKey(key).database_name === databaseName
  ).length;
  return (
    <div>
      <div className="flex min-h-10 items-center gap-2 border-b px-3 text-sm">
        <button
          type="button"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${databaseName}`}
          aria-expanded={expanded}
          onClick={onToggle}
          className="rounded p-1 text-gray-500 hover:bg-gray-100"
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>
        <CatalogIcon name="database" />
        <span className="min-w-0 flex-1 truncate font-medium">
          {databaseName}
        </span>
        {count > 0 && (
          <span className="text-xs text-gray-500">{count} selected</span>
        )}
      </div>
      {expanded &&
        (schemas.isLoading ? (
          <p role="status" className="border-b py-3 pl-8 text-sm text-gray-500">
            Loading schemas...
          </p>
        ) : schemas.error || !schemas.data ? (
          <CatalogError
            message="Unable to load schemas."
            retry={() => void schemas.refetch()}
          />
        ) : schemas.data.length === 0 ? (
          <p className="border-b py-3 pl-8 text-sm text-gray-500">
            No schemas found.
          </p>
        ) : (
          schemas.data.map((schema) => (
            <CatalogSchema
              key={schema.name}
              databaseName={databaseName}
              schemaName={schema.name}
              scope={scope}
              {...selection}
            />
          ))
        ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectionDatabasesOptions } from "../use-connection-catalog";
import {
  CatalogDatabase,
  type CatalogSelectionProps
} from "./ConnectionCatalogNodes";

export function ConnectionCatalogPicker({
  scope,
  ...selection
}: CatalogSelectionProps & {
  scope: string | null;
}) {
  const databases = useQuery(connectionDatabasesOptions(scope));
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const visible =
    databases.data?.filter((database) =>
      database.name.toLowerCase().includes(search.trim().toLowerCase())
    ) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-3 size-4 text-gray-500"
          />
          <Input
            aria-label="Search databases"
            placeholder="Search databases..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="button" variant="outline" onClick={() => setExpanded([])}>
          Collapse all
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <div className="border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Database / Schema / Table
        </div>
        {databases.isLoading ? (
          <p role="status" className="p-6 text-center text-sm text-gray-500">
            Loading databases...
          </p>
        ) : databases.error || !databases.data ? (
          <div
            role="alert"
            className="space-y-3 p-6 text-center text-sm text-gray-500"
          >
            <p>Unable to load databases.</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => void databases.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">
            {databases.data.length
              ? "No databases match your search."
              : "No databases found."}
          </p>
        ) : (
          visible.map((database) => (
            <CatalogDatabase
              key={database.name}
              databaseName={database.name}
              scope={scope}
              expanded={expanded.includes(database.name)}
              onToggle={() =>
                setExpanded((current) =>
                  current.includes(database.name)
                    ? current.filter((name) => name !== database.name)
                    : [...current, database.name]
                )
              }
              {...selection}
            />
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { queryOptions } from "@tanstack/react-query";
import {
  fetchConnectionDatabases, fetchConnectionSchemas, fetchConnectionTables
} from "./connection-catalog";

export function connectionDatabasesOptions(scope: string | null) {
  return queryOptions({
    queryKey: ["connection-catalog", scope, "databases"] as const,
    queryFn: fetchConnectionDatabases,
    enabled: Boolean(scope),
    staleTime: 60_000,
    meta: { errorMessage: "Unable to load databases." }
  });
}

export function connectionSchemasOptions(scope: string | null, databaseName: string) {
  return queryOptions({
    queryKey: ["connection-catalog", scope, "schemas", databaseName] as const,
    queryFn: () => fetchConnectionSchemas(databaseName),
    enabled: Boolean(scope && databaseName),
    staleTime: 60_000,
    meta: { errorMessage: "Unable to load schemas." }
  });
}

export function connectionTablesOptions(scope: string | null, databaseName: string, schemaName: string) {
  return queryOptions({
    queryKey: ["connection-catalog", scope, "tables", databaseName, schemaName] as const,
    queryFn: () => fetchConnectionTables(databaseName, schemaName),
    enabled: Boolean(scope && databaseName && schemaName),
    staleTime: 60_000,
    meta: { errorMessage: "Unable to load tables." }
  });
}

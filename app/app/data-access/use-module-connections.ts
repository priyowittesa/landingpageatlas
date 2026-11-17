"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import { fetchConnectionTables } from "./connection-catalog";
import {
  buildAdditionsPayload, connectionKey, connectionsResponseSchema, parseConnectionKey, selectedConnectionKeys
} from "./connections";

const axios = axiosConfig(env.apiBaseUrl);

function connectionsUrl(moduleId: string) {
  return `/v1/portal/modules/${encodeURIComponent(moduleId)}/connections`;
}

export async function fetchModuleConnections(moduleId: string) {
  const response = await axios.get(connectionsUrl(moduleId));
  return connectionsResponseSchema.parse(response.data).items;
}

export async function addModuleConnections(moduleId: string, additions: string[], confirmedExisting: boolean) {
  const latest = await fetchModuleConnections(moduleId);
  const { connections, hasNewSelections, hasExistingSelections } = buildAdditionsPayload(latest, additions);
  if (hasNewSelections) {
    if (hasExistingSelections && !confirmedExisting) {
      throw new Error("Existing selections changed. Review them and confirm the save again.");
    }
    const existing = new Set(selectedConnectionKeys(latest));
    const groups = new Map<string, typeof connections>();
    for (const connection of connections) {
      if (existing.has(connectionKey(connection))) continue;
      const key = JSON.stringify([connection.database_name, connection.schema_name]);
      const group = groups.get(key) ?? [];
      group.push(connection);
      groups.set(key, group);
    }
    await Promise.all([...groups.values()].map(async (group) => {
      const tables = await fetchConnectionTables(group[0].database_name, group[0].schema_name);
      const available = new Set(tables.map((table) => table.name));
      if (group.some((table) => !available.has(table.table_name))) {
        throw new Error("Some selected tables are no longer available. Reload the catalog and try again.");
      }
    }));
    await axios.post(connectionsUrl(moduleId), { connections });
  }
}

export async function removeModuleConnections(moduleId: string, removals: string[]) {
  const requested = [...new Set(removals)].map(parseConnectionKey);
  if (!requested.length) return;
  const latest = await fetchModuleConnections(moduleId);
  const selected = new Set(selectedConnectionKeys(latest));
  for (const item of requested) {
    if (!selected.has(connectionKey(item))) continue;
    await axios.delete(`${connectionsUrl(moduleId)}/${encodeURIComponent(item.database_name)}`, {
      params: { schema_name: item.schema_name, table_name: item.table_name }
    });
  }
}

export async function saveModuleConnections(
  moduleId: string, additions: string[], removals: string[], confirmedExisting: boolean
) {
  // Add first so a failed POST cannot remove existing access.
  if (additions.length) await addModuleConnections(moduleId, additions, confirmedExisting);
  await removeModuleConnections(moduleId, removals);
}

export function useModuleConnections(moduleId: string, scope: string | null) {
  const client = useQueryClient();
  const queryKey = ["data-access-connections", scope, moduleId] as const;
  const query = useQuery({
    queryKey,
    queryFn: () => fetchModuleConnections(moduleId),
    enabled: Boolean(scope && moduleId),
    meta: { errorMessage: "Unable to load module connections." }
  });
  const refreshConfiguration = () => Promise.all([
    client.invalidateQueries({ queryKey }),
    client.invalidateQueries({ queryKey: ["data-access-catalog", scope] }),
    client.invalidateQueries({ queryKey: ["data-access-submodules", scope] })
  ]);
  const save = useMutation({
    mutationFn: ({ additions, removals, confirmedExisting }: {
      additions: string[]; removals: string[]; confirmedExisting: boolean;
    }) => {
      if (!scope || !moduleId) throw new Error("Your session or selected sub-module is not ready.");
      return saveModuleConnections(moduleId, additions, removals, confirmedExisting);
    },
    onSuccess: refreshConfiguration,
    onError: () => { void refreshConfiguration(); },
    meta: {
      successMessage: "Module connections saved.",
      errorMessage: "Unable to save module connections."
    }
  });
  return { ...query, save };
}

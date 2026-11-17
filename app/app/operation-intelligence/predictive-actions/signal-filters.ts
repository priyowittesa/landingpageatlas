import type { ApiSignal } from "./use-signals";

export type LocalSignalFilters = {
  kind?: string;
  status?: string;
  moduleName?: string;
  severity?: string;
  searchQuery?: string;
  code?: string;
  flagId?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export function countSignals(signals: readonly ApiSignal[]) {
  return signals.reduce<Record<string, number>>((counts, signal) => {
    const type = signal.type.toLowerCase();
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});
}

export function filterSignals(
  signals: readonly ApiSignal[],
  filters: LocalSignalFilters
) {
  const query = filters.searchQuery?.trim().toLowerCase();
  const moduleName = filters.moduleName?.trim().toLowerCase();
  const code = filters.code?.trim().toLowerCase();
  const flagId = filters.flagId?.trim().toLowerCase();
  return signals.filter((signal) => {
    if (filters.kind && filters.kind !== "all" && signal.type.toLowerCase() !== filters.kind) return false;
    if (filters.status && filters.status !== "all" && signal.status !== filters.status) return false;
    if (moduleName && !signal.module_name.toLowerCase().includes(moduleName)) return false;
    if (filters.severity && filters.severity !== "all" &&
      signal.metadata?.severity?.toLowerCase() !== filters.severity) return false;
    if (code && !signal.code.toLowerCase().includes(code)) return false;
    if (flagId && ![
      ...(signal.flag_ids ?? []),
      ...(signal.flags ?? []).map((flag) => flag.id)
    ].some((id) => id.toLowerCase() === flagId)) return false;

    const createdAt = new Date(signal.created_at).getTime();
    if (filters.createdAfter && createdAt < new Date(filters.createdAfter).getTime()) return false;
    if (filters.createdBefore && createdAt > new Date(filters.createdBefore).getTime()) return false;
    if (!query) return true;
    return [
      signal.title, signal.description, signal.reason_nexa, signal.code,
      signal.module_name, signal.metadata?.entity?.name, signal.metadata?.detector,
      ...(signal.flags ?? []).flatMap((flag) => [flag.name, flag.id]),
      ...(signal.flag_ids ?? [])
    ].some((value) => value?.toLowerCase().includes(query));
  });
}

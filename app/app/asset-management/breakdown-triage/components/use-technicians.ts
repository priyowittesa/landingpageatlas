"use client";

import { useMemo } from "react";
import { useLabourMembers } from "@/app/app/master-data/projects/use-projects";

export type Technician = { id: string; name: string };

/** Labour members across projects, one entry per person (the roster repeats people per project). */
export function useTechnicians(enabled = true) {
  const { data, isLoading } = useLabourMembers({ pageSize: 500 });
  const technicians = useMemo(() => {
    const byId = new Map<string, string>();
    for (const member of data?.members ?? []) {
      if (member.labour_id && !byId.has(member.labour_id)) byId.set(member.labour_id, member.labour_name);
    }
    return [...byId].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);
  return { technicians: enabled ? technicians : [], isLoading: enabled && isLoading };
}

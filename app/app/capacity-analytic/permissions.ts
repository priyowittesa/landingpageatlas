import type { RbacModule } from "@/components/layout/dasbhoard/navigation";
import { hasRouteAccess } from "@/lib/rbac-access";

export function canManageCapacity(modules?: RbacModule[]) {
  if (!hasRouteAccess(modules, "/app/capacity-analytic")) return false;
  const visit = (entry: RbacModule): boolean => {
    const level = entry.access_level?.toUpperCase().replace(/^ACCESS_LEVEL_/, "");
    if (level && !["VIEW_ONLY", "EDIT", "FULL_ACCESS"].includes(level)) return false;
    const target = entry.key === "capacity-analytic" ||
      entry.href?.split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop() === "capacity-analytic";
    return !!(target && (level === "EDIT" || level === "FULL_ACCESS")) ||
      (entry.sub_modules ?? []).some(visit);
  };
  return (modules ?? []).some(visit);
}

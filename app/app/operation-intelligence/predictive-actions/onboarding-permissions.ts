import type { RbacModule } from "@/components/layout/dasbhoard/navigation";
import { hasRouteAccess } from "@/lib/rbac-access";

export const onboardingRoute = "/app/operation-intelligence/predictive-actions";

export function canManageOnboarding(modules?: RbacModule[]): boolean {
  if (!hasRouteAccess(modules, onboardingRoute)) return false;
  const visit = (entry: RbacModule): boolean => {
    const level = entry.access_level?.toUpperCase().replace(/^ACCESS_LEVEL_/, "");
    if (level && !["VIEW_ONLY", "EDIT", "FULL_ACCESS"].includes(level)) return false;
    const target = entry.key === "predictive-actions" ||
      entry.href?.split(/[?#]/)[0].replace(/\/+$/, "").split("/").pop() === "predictive-actions";
    return (target && (level === "EDIT" || level === "FULL_ACCESS")) ||
      (entry.sub_modules ?? []).some(visit);
  };
  return (modules ?? []).some(visit);
}

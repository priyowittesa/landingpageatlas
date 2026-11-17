import type { RbacModule } from "@/components/layout/dasbhoard/navigation";

function isNoAccess(module: RbacModule): boolean {
  return module.access_level?.toUpperCase().endsWith("NO_ACCESS") ?? false;
}

function isGrantedAccess(module: RbacModule): boolean {
  const level = module.access_level?.toUpperCase().replace(/^ACCESS_LEVEL_/, "");
  return level === "VIEW_ONLY" || level === "EDIT" || level === "FULL_ACCESS";
}

/** Resolve API hrefs, which may be relative, app-prefixed, or already nested. */
function modulePath(
  module: RbacModule,
  parentPath = "/app"
): string {
  if (module.key === "capacity-analytic" || module.key === "well-performance") {
    return `/app/${module.key}`;
  }
  const path = normalizePath(module.href || module.key);
  const parentWithoutApp = parentPath.replace(/^\/app(?=\/|$)/, "");
  if (path === "/app" || path.startsWith("/app/")) return path;
  if (
    parentWithoutApp &&
    (path === parentWithoutApp || path.startsWith(`${parentWithoutApp}/`))
  ) {
    return `/app${path}`;
  }
  return path === "/" ? parentPath : `${parentPath}${path}`;
}

function normalizePath(path: string): string {
  let clean = path.trim().split(/[?#]/)[0];
  try {
    clean = decodeURIComponent(clean);
  } catch {
    // Leave malformed paths unmatched rather than treating them as a grant.
  }
  clean = clean.replace(/^\/+|\/+$/g, "");
  return clean ? `/${clean}` : "/";
}

function isWithin(path: string, parent: string): boolean {
  return path === parent || path.startsWith(`${parent}/`);
}

// These shared account/workspace pages have their own policies, not module grants.
const SHARED_ROUTES = [
  "/app/workspace-dashboard",
  "/app/dashboard",
  "/app/profile",
  "/app/role-access-management",
  "/app/master-data",
  "/app/settings",
  "/app/setting",
  "/app/token-usage",
  "/app/signals"
];

// Breakdown Triage is added under Asset Management by the frontend until RBAC
// ships the module (see components/layout/dasbhoard/navigation.ts).
const BREAKDOWN_TRIAGE_ROUTE = "/app/asset-management/breakdown-triage";
const ASSET_MANAGEMENT_ROUTE = "/app/asset-management";

function hasGrantedDescendant(module: RbacModule): boolean {
  return (module.sub_modules ?? []).some(
    (child) => (isGrantedAccess(child) || (!child.access_level && hasGrantedDescendant(child)))
  );
}

/**
 * Access to a frontend-only page under Asset Management, used while RBAC has no
 * entry for it. Mirrors the sidebar: Asset Management must be granted itself,
 * or be a container without its own grant that has an accessible child.
 */
function hasFrontendTriageAccess(modules: RbacModule[] | undefined): boolean | null {
  let parentAccess: boolean | null = null;
  let hasOwnEntry = false;
  const visit = (entries: RbacModule[], parentPath = "/app") => {
    for (const entry of entries) {
      const href = modulePath(entry, parentPath);
      if (isWithin(href, BREAKDOWN_TRIAGE_ROUTE)) hasOwnEntry = true;
      if (href === ASSET_MANAGEMENT_ROUTE) {
        const access = entry.access_level
          ? isGrantedAccess(entry)
          : hasGrantedDescendant(entry);
        parentAccess = (parentAccess ?? true) && access;
      }
      visit(entry.sub_modules ?? [], href);
    }
  };
  visit(modules ?? []);
  // Once RBAC sends its own entry, the regular module rules apply.
  return hasOwnEntry ? null : parentAccess;
}

export function hasRouteAccess(
  modules: RbacModule[] | undefined,
  pathname: string,
  isAdmin = false
): boolean {
  const path = normalizePath(pathname);
  if (isWithin(path, "/app/data-access")) {
    return isAdmin === true;
  }
  // The evaluation preview includes cross-tenant examples, so keep it admin-only.
  if (isWithin(path, "/app/nexa-evaluation")) {
    return isAdmin === true;
  }
  if (isWithin(path, BREAKDOWN_TRIAGE_ROUTE)) {
    const triageAccess = hasFrontendTriageAccess(modules);
    if (triageAccess !== null) return triageAccess;
  }
  // The operational dashboard is another entry point to Well Performance.
  const target = isWithin(path, "/app/operational-dashboard")
    ? path.replace("/app/operational-dashboard", "/app/well-performance/operational-dashboard")
    : path;
  let matched = false;
  let hasGrantedMatch = false;
  let hasDeniedMatch = false;

  const visit = (
    entries: RbacModule[],
    parentPath = "/app",
    parentDenied = false
  ) => {
    for (const entry of entries) {
      const href = modulePath(entry, parentPath);
      const granted = isGrantedAccess(entry);
      const denied = parentDenied || (
        entry.access_level ? !granted : !entry.sub_modules?.length
      );
      if (href !== "/app" && (isWithin(target, href) || isWithin(path, href))) {
        matched = true;
        hasGrantedMatch ||= granted && !denied;
        // A grant must never override a matching child or ancestor denial.
        hasDeniedMatch ||= denied;
      }
      visit(entry.sub_modules ?? [], href, denied);
    }
  };
  visit(modules ?? []);

  return matched ? hasGrantedMatch && !hasDeniedMatch : (
    path === "/app" || SHARED_ROUTES.some((route) => isWithin(path, route))
  );
}

export function hasModuleAccess(
  modules: RbacModule[] | undefined,
  moduleKey: string,
  route: string
): boolean {
  const matches = (module: RbacModule): boolean => {
    if (isNoAccess(module)) return false;

    const href = module.href
      ?.replace(/^\/?(?:app\/)?/, "/")
      .replace(/\/$/, "");
    return (
      module.key === moduleKey ||
      href === route ||
      (module.sub_modules ?? []).some(matches)
    );
  };

  return modules?.some(matches) ?? false;
}

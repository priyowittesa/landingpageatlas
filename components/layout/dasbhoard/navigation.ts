import {
  Activity,
  Boxes,
  BriefcaseBusiness,
  BookOpenText,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheckIcon,
  Coins,
  Database,
  FileText,
  Gauge,
  History,
  LayoutGrid,
  LayoutListIcon,
  Package,
  PackageSearch,
  PlugZap,
  ScrollText,
  Settings,
  TriangleAlert,
  Upload,
  UserRound,
  Users,
  Workflow,
  GitCompareArrows,
  BrainCircuit,
  Wrench,
  ListChecks,
  ShieldCheckIcon,
  ChartNoAxesColumn,
  Cog,
  ChartLineIcon,
  ClipboardCopy,
  FileTypeCornerIcon,
  FileChartLineIcon,
  Siren,
  Lightbulb,
  SlidersHorizontal,
  Settings2,
} from "lucide-react";
import type { ElementType } from "react";

// Temporary: Product Development menu items (until RBAC ships the module).
const ProductDevelopmentIcon: ElementType = PackageSearch;
const RequestsIcon: ElementType = FileText;
const ProjectPlanningIcon: ElementType = TriangleAlert;
const DesignIcon: ElementType = LayoutListIcon;
const PrototypeIcon: ElementType = Package;

export type NavNode = {
  title: string;
  href?: string;
  baseHref?: string;
  icon?: ElementType;
  /** Kebab-case lucide icon name from the API; resolved lazily by NavItem. */
  iconName?: string;
  children?: NavNode[];
  isSectionLabel?: boolean;
  defaultOpen?: boolean;
  preview?: "token-usage";
};

export type NavSection = {
  title: string;
  items: NavNode[];
};

/** A module/sub-module entry as returned by GET /v1/auth/me -> data.rbac.modules */
export type RbacModule = {
  id: string;
  key: string;
  name: string;
  description?: string;
  icon?: string;
  href?: string;
  access_level?: string;
  sub_modules?: RbacModule[];
};

/**
 * Legacy icons for modules whose API payload has no valid Lucide icon name.
 */
const ICON_BY_KEY: Record<string, ElementType> = {
  // Construction
  "labour-rostering": CalendarDays,
  "active-project": BriefcaseBusiness,
  "all-employee": UserRound,
  // Daily Diaries
  sample: Boxes,
  "daily-activity": FileText,
  "daily-activities": FileText,
  // Capacity Analytic
  "capacity-analytic": FileChartLineIcon,
  "loading-vs-capacity": ClipboardCheckIcon,
  "contingency-plan": ShieldCheckIcon,
  "capacity-trend": ChartLineIcon,
  "formula-configuration": FileTypeCornerIcon,
  // Inspection
  inspection: ClipboardCheckIcon,
  templates: LayoutListIcon,
  products: PackageSearch,
  "non-conformance": TriangleAlert,
  // workflow
  "atlas-knowledge-source": GitCompareArrows,
  "/master-connections": PlugZap,
  "/workflow": Workflow,
  "/atlas-knowledge-source": Upload,
  "/knowledge-base": BookOpenText,
  // Product Development
  "product-development": PackageSearch,
  request: FileText,
  "project-planning": TriangleAlert,
  design: LayoutListIcon,
  prototype: Package,
  "synergy-intellegence": BrainCircuit,
  "well-performance": Activity,
  // Asset Management
  "asset-management": Wrench,
  "asset-list": Wrench,
  "preventive-maintenance": Wrench,
  "breakdown-maintenance": TriangleAlert,
  "work-orders": ListChecks,
  "work-order-costs": CircleDollarSign,
  "frequency-type": ChartNoAxesColumn,
  "spare-part": Cog,
  procurement: ClipboardCopy,
  procurment: ClipboardCopy,
  "breakdown-triage": Siren,
};

/** Fallback icon used for any RBAC module/sub-module without a mapped key. */
const FALLBACK_MODULE_ICON: ElementType = Boxes;

// Names are not validated here: that needs the full lucide icon set. NavItem
// falls back to `icon` for names it cannot resolve.
function resolveModuleIconName(name?: string): string | undefined {
  return name?.trim() || undefined;
}

/** Resolve an icon for an RBAC module by its `key`, falling back to a default. */
function resolveModuleIcon(key: string): ElementType {
  return ICON_BY_KEY[key] ?? FALLBACK_MODULE_ICON;
}

// ---------------------------------------------------------------------------
// Static sections
// ---------------------------------------------------------------------------

/** Always rendered, regardless of RBAC. */
export const overviewSection: NavSection = {
  title: "Overview",
  items: [
    {
      title: "Workspace Dashboard",
      href: "/app/workspace-dashboard",
      icon: LayoutGrid,
    },
    // {
    //   title: "Synergy Intelligence",
    //   href: "/app/synergy-intelligence",
    //   icon: BrainCircuit,
    // },
  ],
};

/** Master Data items included in "Others" when the user has RBAC modules. */
export const masterDataSection: NavSection = {
  title: "Master Data",
  items: [
    {
      title: "Master Data",
      icon: Building2,
      defaultOpen: false,
      children: [
        {
          title: "Employee",
          href: "/app/master-data/employee",
          icon: Users,
        },
        {
          title: "Project",
          href: "/app/master-data/projects",
          icon: BriefcaseBusiness,
        },
        {
          title: "Rate Cards",
          href: "/app/master-data/rate-cards",
          icon: CircleDollarSign,
        },
        {
          title: "Equipment / Asset",
          href: "/app/master-data/equipment",
          icon: Package,
        },
        {
          title: "Products",
          href: "/app/master-data/products",
          icon: PackageSearch,
        },
        {
          title: "Product Structure",
          href: "/app/master-data/product-structure",
          icon: ClipboardCheckIcon,
        },
        // {
        //   title: "Shift",
        //   href: "/app/master-data/shifts",
        //   icon: CalendarDays,
        // },
      ],
    },
  ],
};

/** Capacity Analytic is a standalone module alongside Daily Diaries. */
const capacityAnalyticNode: NavNode = {
  title: "Capacity Analytic",
  icon: FileChartLineIcon,
  defaultOpen: false,
  children: [
    {
      title: "Dashboard",
      href: "/app/capacity-analytic/dashboard",
      icon: LayoutGrid,
    },
    {
      title: "Loading vs Capacity",
      href: "/app/capacity-analytic/loading-vs-capacity",
      icon: ClipboardCheckIcon,
    },
    {
      title: "Contingency Plan",
      href: "/app/capacity-analytic/contingency-plan",
      icon: ShieldCheckIcon,
    },
    {
      title: "Capacity Trend",
      href: "/app/capacity-analytic/capacity-trend",
      icon: ChartLineIcon,
    },
    {
      title: "Formula Configuration",
      href: "/app/capacity-analytic/formula-configuration",
      icon: FileTypeCornerIcon,
    },
  ],
};

/** Rendered only when the user has at least one RBAC module. */
export const mainSection: NavSection = {
  title: "Main",
  items: [
    {
      title: "Master Connections",
      href: "/master-connections",
      icon: PlugZap,
    },
    {
      title: "Workflow Studio",
      href: "/workflow",
      icon: Workflow,
    },
  ],
};

/** Knowledge tools available from the ATLAS workspace. */
export const knowledgeSection: NavSection = {
  title: "Knowledge",
  items: [
    {
      title: "ATLAS Knowledge Source",
      href: "/atlas-knowledge-source",
      icon: Upload,
    },
    {
      title: "ATLAS Knowledge Base",
      href: "/atlas-knowledge-base",
      icon: BookOpenText,
    },
  ],
};

/**
 * Rendered only when the user has at least one RBAC module.
 * NOTE: the Sidebar pins the section titled "Others" to the bottom.
 */
export const otherSection: NavSection = {
  title: "Others",
  items: [
    {
      title: "Role Access Management",
      icon: Users,
      href: "/app/role-access-management",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/app/settings",
    },
  ],
};

/** Nav node for "Role Access Management" — conditionally included in "Others". */
const roleAccessManagementNode: NavNode = {
  title: "Role Access Management",
  icon: Users,
  href: "/app/role-access-management",
};

/** Nav node for "Settings" — shown when the user has RBAC modules. */
const settingsNode: NavNode = {
  title: "Settings",
  icon: Settings,
  href: "/app/settings",
};

const dataAccessNode: NavNode = {
  title: "Data Access",
  icon: Database,
  href: "/app/data-access",
};

// ---------------------------------------------------------------------------
// Dynamic (RBAC-driven) sections
// ---------------------------------------------------------------------------

/** Join a parent href with a child href, normalizing slashes and preventing duplicated /app prefix. */
function joinHref(parentHref: string, childHref?: string): string {
  const clean = (value?: string) =>
    (value ?? "").trim().replace(/^\/+|\/+$/g, "");
  const parentClean = clean(parentHref);
  let childClean = clean(childHref);

  // If child already starts with "app" and parent is "app" (or empty), strip the duplicate "app"
  if (parentClean === "app" && (childClean === "app" || childClean.startsWith("app/"))) {
    childClean = childClean.replace(/^app\/?/, "");
  }

  const parts = [parentClean, childClean].filter(Boolean);
  return `/${parts.join("/")}`;
}

/**
 * RBAC module keys that are rendered by the static "Master Data" group and
 * must therefore be skipped when building the dynamic "Modules" section.
 */
const MASTER_DATA_MODULE_KEYS = new Set(["products"]);

function isSignalsModule(module: RbacModule): boolean {
  const href = module.href?.replace(/^\/?(?:app\/)?/, "/").replace(/\/$/, "");
  return module.key === "signals" || href === "/signals";
}

function hasNavigationPermission(module: RbacModule): boolean {
  const level = module.access_level?.toUpperCase().replace(/^ACCESS_LEVEL_/, "");
  const granted = level === "VIEW_ONLY" || level === "EDIT" || level === "FULL_ACCESS";
  if (level && !granted) return false;
  // Containers may omit their own grant, but must contain an accessible child.
  return granted || (module.sub_modules ?? []).some(hasNavigationPermission);
}

const wellPerformancePages: NavNode[] = [
  { title: "Operational Dashboard", href: "/app/operational-dashboard", icon: LayoutGrid },
  { title: "Dashboard", href: "/app/well-performance/dashboard", icon: LayoutGrid },
  { title: "Well Register", href: "/app/well-performance/register", icon: LayoutListIcon },
  { title: "Analytics", href: "/app/well-performance/analytics", icon: ChartLineIcon },
  { title: "Historical Replay", href: "/app/well-performance/monitor", icon: Gauge },
];

const BREAKDOWN_TRIAGE_KEY = "breakdown-triage";

function breakdownTriagePages(href: string): NavNode[] {
  return [
    { title: "Supervisor Queue", href, icon: Siren },
    { title: "AI Insights", href: `${href}/ai-insights`, icon: Lightbulb },
    {
      title: "Configuration",
      icon: Settings2,
      children: [
        { title: "Scoring & Thresholds", href: `${href}/scoring`, icon: SlidersHorizontal },
        // Synonym Dictionary (`/synonyms`) and LLM Attribute Review (`/attribute-review`) are hidden from the menu for now.
      ],
    },
  ];
}

/**
 * Breakdown Triage lives under Asset Management next to Procurement. RBAC does
 * not ship the module yet, so it is added here unless the payload already has
 * it (granted or explicitly denied).
 */
function withBreakdownTriage(module: RbacModule, href: string, children: NavNode[] | undefined): NavNode[] {
  const items = children ?? [];
  const sentByApi = (module.sub_modules ?? []).some((child) => child.key === BREAKDOWN_TRIAGE_KEY);
  if (sentByApi) return items;
  const triageHref = `${href}/${BREAKDOWN_TRIAGE_KEY}`;
  const triage: NavNode = {
    title: "Breakdown Triage",
    icon: Siren,
    baseHref: triageHref,
    children: breakdownTriagePages(triageHref),
  };
  const procurementIndex = items.findIndex((child) => /\/procure?ment$/.test(child.baseHref ?? ""));
  return procurementIndex === -1
    ? [...items, triage]
    : [...items.slice(0, procurementIndex + 1), triage, ...items.slice(procurementIndex + 1)];
}

/** Recursively map an RBAC module (and its sub-modules) to a NavNode. */
function mapRbacModule(
  module: RbacModule,
  parentHref: string,
  companyName?: string
): NavNode {
  const isCapacityAnalytic = module.key === "capacity-analytic";
  const isWellPerformance = module.key === "well-performance";
  const href = isCapacityAnalytic
    ? "/app/capacity-analytic"
    : isWellPerformance
      ? "/app/well-performance"
      : joinHref(parentHref, module.href);
  // `products` is omitted only when it is a top-level Master Data module.
  // Inspection has its own Products child route, so nested modules must remain
  // intact here instead of applying the top-level exclusion recursively.
  const subModules = (module.sub_modules ?? []).filter(
    (child) =>
      !isSignalsModule(child) &&
      hasNavigationPermission(child)
  );
  let children =
    subModules.length > 0
      ? subModules.map((child) => mapRbacModule(child, href, companyName))
      : undefined;
  if (isCapacityAnalytic && !children && !module.sub_modules?.length) {
    children = capacityAnalyticNode.children;
  }
  if (isWellPerformance && !children && !module.sub_modules?.length) {
    children = wellPerformancePages;
  }

  // Procurement is a section in the product navigation. Some RBAC payloads
  // still expose it as a leaf (and use the legacy `procurment` key), so keep
  // the UI shape consistent while the remaining procurement pages are added.
  if (["procurement", "procurment"].includes(module.key)) {
    const deniedHrefs = new Set(
      (module.sub_modules ?? [])
        .filter((child) => !hasNavigationPermission(child))
        .map((child) => joinHref(href, child.href))
    );
    const hasPurchaseRequests = children?.some((child) => child.href === href);
    const approvalsInboxHref = `${href}/approvals-inbox`;
    const hasApprovalsInbox = children?.some((child) => child.href === approvalsInboxHref);
    const receiveListHref = `${href}/receive-list`;
    const hasReceiveList = children?.some((child) => child.href === receiveListHref);
    children = [
      ...(!hasPurchaseRequests && !deniedHrefs.has(href)
        ? [{ title: "Purchase Requests", href, icon: ClipboardCopy }]
        : []),
      ...(!hasApprovalsInbox && !deniedHrefs.has(approvalsInboxHref)
        ? [{ title: "Approvals Inbox", href: approvalsInboxHref, icon: ListChecks }]
        : []),
      ...(children ?? []),
      ...(!hasReceiveList && !deniedHrefs.has(receiveListHref)
        ? [{ title: "Receive List", href: receiveListHref, icon: ListChecks }]
        : []),
    ];
  }

  if (module.key === BREAKDOWN_TRIAGE_KEY && !children) {
    children = breakdownTriagePages(href);
  }
  if (module.key === "asset-management") {
    children = withBreakdownTriage(module, href, children);
  }

  return {
    title: module.name === "Synergy Intelligence"
      ? companyName === "Pertamina Group"
        ? "Pertamina Intelligence"
        : "NEXA Intelligence"
      : module.name,
    iconName: resolveModuleIconName(module.icon),
    icon: resolveModuleIcon(module.key),
    baseHref: href,
    // A node with children renders as a collapsible group; a leaf renders as a
    // link. NavItem prioritizes `href` over `children`, so only set one.
    ...(children ? { children } : { href }),
  };
}

/** Build the single "Modules" section from the RBAC modules array. */
export function buildModulesSection(
  modules: RbacModule[],
  companyName?: string
): NavSection {
  const items = modules
    .filter(
      (module) =>
        !MASTER_DATA_MODULE_KEYS.has(module.key) &&
        !isSignalsModule(module) &&
        hasNavigationPermission(module)
    )
    .map((module) => mapRbacModule(module, "/app", companyName));
  return {
    title: "Modules",
    items,
  };
}

/** Context passed to buildNavigation, derived from GET /v1/auth/me. */
export type NavContext = {
  modules?: RbacModule[];
  roles?: string[] | null;
  subscription?: unknown;
  subscriptionExpired?: boolean;
  hasSubscription?: boolean;
  isAdmin?: boolean;
  companyName?: string;
};

/** Roles that grant access to "Role Access Management". */
const ROLE_ACCESS_ROLES = [
  "default-roles-atlas - development",
  "default-roles-atlas",
];

/**
 * Whether "Role Access Management" should be visible.
 *
 * Shown when the user has one of the privileged atlas roles, OR when they have
 * an active (non-null, non-expired) subscription.
 */
function canShowRoleAccessManagement(ctx: NavContext): boolean {
  const hasPrivilegedRole =
    !!ctx.roles && ctx.roles.some((role) => ROLE_ACCESS_ROLES.includes(role));
  const hasActiveSubscription =
    Array.isArray(ctx.subscription) &&
    ctx.subscription.length > 0 &&
    ctx.subscriptionExpired === false;
  return hasPrivilegedRole || hasActiveSubscription;
}

/** Build the "Others" section, conditionally including items. */
function buildOthersSection(ctx: NavContext): NavSection {
  const items: NavNode[] = [];
  if ((ctx.modules ?? []).length > 0) {
    items.push(...masterDataSection.items);
  }
  if (canShowRoleAccessManagement(ctx)) {
    items.push(roleAccessManagementNode);
  }
  if (ctx.isAdmin === true) {
    items.push(dataAccessNode);
    items.push({
      title: "NEXA Evaluation",
      href: "/app/nexa-evaluation",
      icon: ListChecks,
    });
  }
  // "Settings" is shown when the user has at least one RBAC module.
  if ((ctx.modules ?? []).length > 0) {
    items.push(settingsNode);
  }
  // "Token Usage" is shown when the user has at least one subscription, or
  // when they are an admin (admins can access Clients, Audit Trail, etc.).
  if (canShowTokenUsage(ctx) || ctx.isAdmin === true) {
    items.push(buildTokenUsageNode(ctx));
  }
  return { title: "Others", items };
}

/**
 * Whether the "Token Usage" menu should be visible.
 *
 * Shown to any tenant with at least one subscription on GET /v1/auth/me.
 * `subscription` is the raw array from the payload; `has_subscription` is
 * honoured as well so the flag alone is enough once the array is trimmed.
 */
function canShowTokenUsage(ctx: NavContext): boolean {
  return (
    ctx.hasSubscription === true ||
    (Array.isArray(ctx.subscription) && ctx.subscription.length > 0)
  );
}

/**
 * "Token Usage" nav node, nested under the "Others" section. Monitoring,
 * Clients and Audit Trail are tenant-wide admin actions (per-client policy
 * overrides, bulk updates and the compliance audit log), so they are only
 * listed for admins.
 */
function buildTokenUsageNode(ctx: NavContext): NavNode {
  const children: NavNode[] = [
    {
      title: "Overview",
      href: "/app/token-usage/overview",
      icon: Gauge,
    },
    {
      title: "Usage History",
      href: "/app/token-usage/usage-history",
      icon: History,
    },
  ];

  if (ctx.isAdmin) {
    children.push(
      {
        title: "Monitoring",
        href: "/app/token-usage/monitoring",
        icon: Activity,
      },
      {
        title: "Clients",
        href: "/app/token-usage/clients",
        icon: Users,
      },
      {
        title: "Upcoming Changes",
        href: "/app/token-usage/upcoming-changes",
        icon: CalendarDays,
      },
      {
        title: "Audit Trail",
        href: "/app/token-usage/audit-trail",
        icon: ScrollText,
      },
    );
  }

  return {
    title: "Token Usage",
    icon: Coins,
    defaultOpen: false,
    preview: "token-usage",
    children,
  };
}

/** Temporary: hardcoded "My Modules → Product Development" menu. */
export const productDevelopmentSection: NavSection = {
  title: "My Modules",
  items: [
    {
      title: "Product Development",
      icon: ProductDevelopmentIcon,
      defaultOpen: true,
      children: [
        {
          title: "Requests",
          href: "/app/product-development/requests",
          icon: RequestsIcon,
        },
        {
          title: "Project Planning",
          href: "/app/product-development/project-planning",
          icon: ProjectPlanningIcon,
        },
        {
          title: "Design",
          href: "/app/product-development/design",
          icon: DesignIcon,
        },
        {
          title: "Prototype",
          href: "/app/product-development/prototype",
          icon: PrototypeIcon,
        },
      ],
    },
  ],
};

/**
 * Compose the full sidebar navigation based on the user's RBAC modules.
 *
 * Rules:
 * - "Overview" is always shown; "Others" (bottom-pinned) is shown when non-empty.
 * - When there is at least one RBAC module, also show the dynamic "Modules" section.
 * - "Data Access" is included in "Others" only when is_admin is true.
 * - "Master Data" and "Settings" are included when the user has RBAC modules.
 * - "Role Access Management" is shown only when the user has a privileged atlas
 *   role or an active subscription.
 * - "Token Usage" is shown when the user has at least one subscription; its
 *   "Monitoring" child is admin-only.
 *
 * Temporary: a hardcoded "My Modules → Product Development" section is always
 * injected so the menu is reachable while the RBAC payload is still being
 * finalised. Remove once the backend returns the module under rbac.modules.
 */
export function buildNavigation(ctx: NavContext = {}): NavSection[] {
  const modules = ctx.modules ?? [];
  const sections: NavSection[] = [overviewSection];

  // Temporary: always-on Product Development menu (Requests + Project Planning).
  // sections.push(productDevelopmentSection);

  if (modules.length > 0) {
    sections.push(
      buildModulesSection(modules, ctx.companyName),
      // mainSection,
      // knowledgeSection,
    );
  }

  const othersSection = buildOthersSection(ctx);
  if (othersSection.items.length > 0) {
    sections.push(othersSection);
  }

  return sections;
}

/**
 * Normalize a route path by removing query parameters, hash fragments,
 * and trailing slashes (while preserving root '/').
 */
export function normalizePath(path?: string | null): string {
  if (!path) return "";
  const withoutQuery = path.split("?")[0].split("#")[0];
  const trimmed = withoutQuery.trim().replace(/\/+$/, "");
  return trimmed || "/";
}

/**
 * Recursively collect all navigable hrefs defined in the sidebar sections.
 */
export function extractNavHrefs(sections: NavSection[]): string[] {
  const hrefs: string[] = [];
  function walk(nodes: NavNode[]) {
    for (const node of nodes) {
      if (node.href) {
        hrefs.push(node.href);
      }
      if (node.children) {
        walk(node.children);
      }
    }
  }
  for (const section of sections) {
    walk(section.items);
  }
  return hrefs;
}

/**
 * Given the current pathname and all available sidebar hrefs, finds the best
 * matching sidebar href.
 * 
 * 1. Checks for exact match.
 * 2. If no exact match, checks for prefix match (sub-pages) ensuring path boundaries
 *    (e.g. '/app/employee/create' matches '/app/employee').
 *    Picks the longest matching href (most specific match).
 */
export function findActiveNavHref(
  allHrefs: string[],
  currentPath: string
): string | null {
  const path = normalizePath(currentPath);
  if (!path) return null;

  // 1. Exact match
  const exact = allHrefs.find((href) => normalizePath(href) === path);
  if (exact) return exact;

  // 2. Prefix match for sub-pages (longest prefix wins)
  const prefixMatches = allHrefs.filter((href) => {
    const normHref = normalizePath(href);
    if (!normHref || normHref === "/") return false;
    return path.startsWith(`${normHref}/`);
  });

  if (prefixMatches.length > 0) {
    prefixMatches.sort((a, b) => b.length - a.length);
    return prefixMatches[0];
  }

  return null;
}

/**
 * Checks if a specific NavNode is active given the resolved activeHref or current pathname.
 */
export function isNodeActive(
  node: NavNode,
  activeHref: string | null,
  currentPath?: string
): boolean {
  if (!node.href) return false;
  if (activeHref) {
    return normalizePath(node.href) === normalizePath(activeHref);
  }
  if (currentPath) {
    const normHref = normalizePath(node.href);
    const normPath = normalizePath(currentPath);
    return (
      normHref === normPath ||
      (normHref !== "/" && normPath.startsWith(`${normHref}/`))
    );
  }
  return false;
}

/**
 * Checks if a NavNode itself is active or contains any active descendant.
 */
export function nodeContainsActive(
  node: NavNode,
  activeHref: string | null,
  currentPath?: string
): boolean {
  if (isNodeActive(node, activeHref, currentPath)) {
    return true;
  }
  if (node.children) {
    if (
      node.children.some((child) =>
        nodeContainsActive(child, activeHref, currentPath)
      )
    ) {
      return true;
    }
  }
  if (currentPath && node.baseHref) {
    const normBase = normalizePath(node.baseHref);
    const normPath = normalizePath(currentPath);
    if (
      normBase &&
      normBase !== "/" &&
      normBase !== "/app" &&
      (normPath === normBase || normPath.startsWith(`${normBase}/`))
    ) {
      return true;
    }
  }
  return false;
}

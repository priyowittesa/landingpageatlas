import { z } from "zod";
import type { DataAccessModule, DataAccessState } from "./types";

export const portalModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  description: z.string().nullish(),
  parent_id: z.string().nullish(),
  is_menu: z.boolean().optional(),
  is_configured: z.boolean().optional(),
  updated_at: z.string().datetime({ offset: true }).nullish()
});

const modulesPageSchema = z.object({
  items: z.array(portalModuleSchema),
  next_page_token: z.string().nullish()
});

export type PortalModule = z.infer<typeof portalModuleSchema>;
export type PortalModuleRow = PortalModule & { subModules: PortalModule[] };
export type ConfigurationFilter = "all" | "configured" | "not-configured";

export function moduleRows(catalog: PortalModule[]): PortalModuleRow[] {
  const children = new Map<string, PortalModule[]>();
  for (const item of catalog) {
    if (!item.parent_id) continue;
    const siblings = children.get(item.parent_id) ?? [];
    siblings.push(item);
    children.set(item.parent_id, siblings);
  }
  return catalog
    .filter((item) => !item.parent_id && item.is_menu !== false)
    .map((item) => ({ ...item, subModules: children.get(item.id) ?? [] }));
}

export function filterModuleRows(
  modules: PortalModuleRow[],
  query: string,
  filter: ConfigurationFilter
) {
  const search = query.trim().toLowerCase();
  return modules.filter((module) => (
    `${module.name} ${module.key}`.toLowerCase().includes(search) &&
    (filter === "all" || (filter === "configured" ? module.is_configured === true : !module.is_configured))
  ));
}

export async function loadPortalModules(
  getPage: (pageToken?: string) => Promise<unknown>
): Promise<PortalModule[]> {
  const items: PortalModule[] = [];
  const seenTokens = new Set<string>();
  let pageToken: string | undefined;
  do {
    const page = modulesPageSchema.parse(await getPage(pageToken));
    items.push(...page.items);
    pageToken = page.next_page_token || undefined;
    if (pageToken && seenTokens.has(pageToken)) {
      throw new Error("The module catalog returned a repeated page token.");
    }
    if (pageToken) seenTokens.add(pageToken);
  } while (pageToken);
  return items;
}

export function mergeCatalog(
  catalog: PortalModule[],
  saved: DataAccessState
): DataAccessState {
  const savedModules = new Map(saved.modules.map((module) => [module.id, module]));
  const children = new Map<string, PortalModule[]>();
  for (const item of catalog) {
    if (item.parent_id) {
      const siblings = children.get(item.parent_id) ?? [];
      siblings.push(item);
      children.set(item.parent_id, siblings);
    }
  }

  const modules: DataAccessModule[] = catalog
    .filter((item) => !item.parent_id)
    .map((item) => {
      const previous = savedModules.get(item.id);
      const savedChildren = new Map(previous?.subModules.map((sub) => [sub.id, sub]));
      return {
        id: item.id,
        name: item.name,
        key: item.key,
        description: previous?.description ?? item.description ?? "",
        defaultDatabase: previous?.defaultDatabase ?? null,
        updatedAt: previous?.updatedAt ?? null,
        updatedBy: previous?.updatedBy ?? null,
        subModules: (children.get(item.id) ?? []).map((child) => {
          const savedChild = savedChildren.get(child.id);
          return {
            id: child.id,
            name: child.name,
            database: savedChild?.database ?? null,
            outputDatabase: savedChild?.outputDatabase ?? null,
            tables: savedChild?.tables ?? []
          };
        })
      };
    });

  return { version: 1, modules, history: saved.history };
}

import type {
  DataAccessDatabase,
  DataAccessHistory,
  DataAccessModule,
  DataAccessState,
  DataAccessSubModule,
  HealthFilter,
  ModuleHealth
} from "./types";

export function sourceDatabase(module: DataAccessModule, sub: DataAccessSubModule) {
  return sub.database ?? module.defaultDatabase;
}

export function configuredCount(module: DataAccessModule) {
  return module.subModules.filter(
    (sub) => sourceDatabase(module, sub) && sub.tables.length > 0
  ).length;
}

export function moduleHealth(
  module: DataAccessModule,
  databases: DataAccessDatabase[]
): ModuleHealth {
  const used = new Set<string>();
  for (const sub of module.subModules) {
    const source = sourceDatabase(module, sub);
    if (source && sub.tables.length) used.add(source);
    if (sub.outputDatabase) used.add(sub.outputDatabase);
    const database = databases.find((item) => item.id === source);
    if (sub.tables.some((table) =>
      !database?.schemas.some((schema) => schema.tables.some((item) => item.id === table))
    )) return "error";
  }
  if ([...used].some((id) => {
    const database = databases.find((item) => item.id === id);
    return !database?.development.connected || !database.production.connected;
  })) return "error";
  const count = configuredCount(module);
  if (count === 0) return "not-configured";
  return count === module.subModules.length ? "healthy" : "incomplete";
}

export function filterModules(
  modules: DataAccessModule[],
  databases: DataAccessDatabase[],
  query: string,
  filter: HealthFilter
) {
  const search = query.trim().toLowerCase();
  return modules.filter((module) => {
    const health = moduleHealth(module, databases);
    return (
      `${module.name} ${module.key} ${module.defaultDatabase ?? ""}`.toLowerCase().includes(search) &&
      (filter === "all" ||
        (filter === "attention" ? health === "incomplete" || health === "error" : health === filter))
    );
  });
}

export function databaseUsage(modules: DataAccessModule[]) {
  const ids = new Set<string>();
  for (const module of modules) {
    if (module.defaultDatabase) ids.add(module.defaultDatabase);
    for (const sub of module.subModules) {
      if (sub.database) ids.add(sub.database);
      if (sub.outputDatabase) ids.add(sub.outputDatabase);
    }
  }
  return ids.size;
}

export function changeDatabase(
  module: DataAccessModule,
  database: string | null,
  subModuleId?: string
): DataAccessModule {
  if (!subModuleId) {
    if (module.defaultDatabase === database) return module;
    return {
      ...module,
      defaultDatabase: database,
      subModules: module.subModules.map((sub) =>
        sub.database === null ? { ...sub, tables: [] } : sub
      )
    };
  }
  return {
    ...module,
    subModules: module.subModules.map((sub) => {
      if (sub.id !== subModuleId) return sub;
      const nextSource = database ?? module.defaultDatabase;
      return {
        ...sub,
        database,
        tables: sourceDatabase(module, sub) === nextSource ? sub.tables : []
      };
    })
  };
}

export function validateModule(module: DataAccessModule, databases: DataAccessDatabase[]) {
  const exists = (id: string | null) => id === null || databases.some((db) => db.id === id);
  if (!exists(module.defaultDatabase)) throw new Error("Choose an available default database.");
  for (const sub of module.subModules) {
    if (!exists(sub.database) || !exists(sub.outputDatabase)) {
      throw new Error(`Choose an available database for ${sub.name}.`);
    }
    const database = databases.find((db) => db.id === sourceDatabase(module, sub));
    const available = new Set(database?.schemas.flatMap((schema) => schema.tables.map((table) => table.id)));
    if (sub.tables.some((table) => !available.has(table))) {
      throw new Error(`Some tables in ${sub.name} do not belong to its source database.`);
    }
  }
}

// Compare both source and table so moving a table to another database is audited.
export function moduleChanges(
  before: DataAccessModule,
  after: DataAccessModule,
  actor: string,
  at: string
): DataAccessHistory[] {
  const changes: DataAccessHistory[] = [];
  const add = (
    kind: DataAccessHistory["kind"],
    sub: DataAccessSubModule | null,
    summary: string,
    details: string[]
  ) => changes.push({
    id: `${at}-${before.id}-${changes.length}`,
    moduleId: before.id,
    subModuleId: sub?.id ?? null,
    subModuleName: sub?.name ?? "Module settings",
    actor, at, kind, summary, details
  });
  const settings: string[] = [];
  if (before.defaultDatabase !== after.defaultDatabase) {
    settings.push(`Default database: ${before.defaultDatabase ?? "Not set"} -> ${after.defaultDatabase ?? "Not set"}`);
  }
  if (before.description !== after.description) settings.push(`Description: ${after.description || "(empty)"}`);
  if (settings.length) add("settings", null, "Updated module settings", settings);
  for (const sub of after.subModules) {
    const previous = before.subModules.find((item) => item.id === sub.id);
    if (!previous) continue;
    const oldSource = sourceDatabase(before, previous);
    const newSource = sourceDatabase(after, sub);
    for (const kind of ["added", "removed"] as const) {
      const from = kind === "added" ? sub.tables : previous.tables;
      const other = kind === "added" ? previous.tables : sub.tables;
      const tables = [...new Set(from)].filter((id) => oldSource !== newSource || !other.includes(id));
      if (tables.length) add(
        kind, sub,
        `${kind === "added" ? "Added" : "Removed"} ${tables.length} table${tables.length === 1 ? "" : "s"}`,
        tables.map((table) => `${kind === "added" ? newSource : oldSource} : ${table}`)
      );
    }
    const details: string[] = [];
    if (previous.database !== sub.database) {
      details.push(`Reads from: ${sub.database ?? "Module default"}`);
    }
    if (previous.outputDatabase !== sub.outputDatabase) {
      details.push(`Writes results to: ${sub.outputDatabase ?? "Not set"}`);
    }
    if (details.length) add("settings", sub, "Updated data source settings", details);
  }
  return changes;
}

export function saveModule(
  state: DataAccessState,
  original: DataAccessModule,
  draft: DataAccessModule,
  databases: DataAccessDatabase[],
  actor: string,
  at: string
): DataAccessState {
  const current = state.modules.find((module) => module.id === original.id);
  if (!current || JSON.stringify(current) !== JSON.stringify(original)) {
    throw new Error("This configuration changed in another tab. Reload before saving.");
  }
  if (draft.id !== original.id || draft.key !== original.key || draft.name !== original.name ||
    draft.subModules.length !== original.subModules.length ||
    draft.subModules.some((sub, index) => sub.id !== original.subModules[index].id)) {
    throw new Error("The module structure cannot be changed here.");
  }
  validateModule(draft, databases);
  const changes = moduleChanges(original, draft, actor, at);
  if (!changes.length) return state;
  const saved = { ...draft, updatedAt: at, updatedBy: actor };
  return {
    ...state,
    modules: state.modules.map((module) => module.id === saved.id ? saved : module),
    history: [...changes, ...state.history]
  };
}

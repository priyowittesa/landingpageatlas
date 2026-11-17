import { z } from "zod";

const tableSchema = z.object({
  id: z.string(),
  table_name: z.string(),
  selected: z.boolean().nullish().transform((value) => value ?? false)
});

const schemaSchema = z.object({
  id: z.string(),
  schema_name: z.string(),
  tables: z.array(tableSchema).nullish().transform((value) => value ?? [])
});

const connectionSchema = z.object({
  id: z.string(),
  module_id: z.string(),
  database_name: z.string(),
  selected: z.boolean().nullish().transform((value) => value ?? false),
  schemas: z.array(schemaSchema).nullish().transform((value) => value ?? [])
});

export const connectionsResponseSchema = z.object({
  items: z.array(connectionSchema)
});

export type ModuleConnection = z.infer<typeof connectionSchema>;
export type ConnectionSelection = {
  database_name: string;
  schema_name: string;
  table_name: string;
};

export type ConnectionDraft = { additions: string[]; removals: string[] };

export function applyConnectionDraft(saved: string[], draft: ConnectionDraft): string[] {
  const removed = new Set(draft.removals);
  return [...new Set([...saved.filter((key) => !removed.has(key)), ...draft.additions])];
}

export function connectionDraft(saved: string[], selected: string[]): ConnectionDraft {
  const desired = new Set(selected);
  const existing = new Set(saved);
  return {
    additions: [...desired].filter((key) => !existing.has(key)),
    removals: [...existing].filter((key) => !desired.has(key))
  };
}

const selectionKeySchema = z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]);

export function connectionKey(selection: ConnectionSelection) {
  return JSON.stringify([selection.database_name, selection.schema_name, selection.table_name]);
}

export function parseConnectionKey(key: string): ConnectionSelection {
  const [database_name, schema_name, table_name] = selectionKeySchema.parse(JSON.parse(key));
  return { database_name, schema_name, table_name };
}

export function connectionTables(items: ModuleConnection[]) {
  return items.flatMap((database) => database.schemas.flatMap((schema) =>
    schema.tables.map((table) => ({
      selection: {
        database_name: database.database_name,
        schema_name: schema.schema_name,
        table_name: table.table_name
      },
      selected: table.selected
    }))
  ));
}

export function selectedConnectionKeys(items: ModuleConnection[]) {
  return [...new Set(connectionTables(items)
    .filter((table) => table.selected)
    .map((table) => connectionKey(table.selection)))];
}

export function hasUnrepresentableSelections(items: ModuleConnection[]) {
  return items.some((database) =>
    database.selected && !database.schemas.some((schema) => schema.tables.some((table) => table.selected))
  );
}

export function buildAdditionsPayload(items: ModuleConnection[], additions: string[]) {
  if (hasUnrepresentableSelections(items)) {
    throw new Error("A selected database has no selected tables. Saving is unavailable until its existing selection can be preserved.");
  }
  const requested = additions.map(parseConnectionKey);
  const selections = new Map(connectionTables(items)
    .filter((table) => table.selected)
    .map((table) => [connectionKey(table.selection), table.selection]));
  const existing = selectedConnectionKeys(items);
  for (const selection of requested) selections.set(connectionKey(selection), selection);
  return {
    connections: [...selections.values()],
    hasNewSelections: requested.some((selection) => !existing.includes(connectionKey(selection))),
    hasExistingSelections: existing.length > 0
  };
}

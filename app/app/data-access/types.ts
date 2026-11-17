import { z } from "zod";

const subModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  database: z.string().nullable(),
  outputDatabase: z.string().nullable(),
  tables: z.array(z.string())
});

export const moduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  description: z.string(),
  defaultDatabase: z.string().nullable(),
  updatedAt: z.string().nullable(),
  updatedBy: z.string().nullable(),
  subModules: z.array(subModuleSchema)
});

const historySchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  subModuleId: z.string().nullable(),
  subModuleName: z.string(),
  actor: z.string(),
  at: z.string(),
  kind: z.enum(["added", "removed", "settings"]),
  summary: z.string(),
  details: z.array(z.string())
});

export const dataAccessStateSchema = z.object({
  version: z.literal(1),
  modules: z.array(moduleSchema),
  history: z.array(historySchema)
});

export type DataAccessModule = z.infer<typeof moduleSchema>;
export type DataAccessSubModule = z.infer<typeof subModuleSchema>;
export type DataAccessHistory = z.infer<typeof historySchema>;
export type DataAccessState = z.infer<typeof dataAccessStateSchema>;
export type ModuleHealth = "healthy" | "incomplete" | "error" | "not-configured";
export type HealthFilter = "all" | "healthy" | "attention" | "not-configured";

export type DatabaseTable = {
  id: string;
  name: string;
  rows: number;
};

export type DatabaseSchema = {
  name: string;
  tables: DatabaseTable[];
};

export type DataAccessDatabase = {
  id: string;
  development: { name: string; connected: boolean };
  production: { name: string; connected: boolean };
  schemas: DatabaseSchema[];
};

import type {
  DataAccessDatabase,
  DataAccessModule,
  DataAccessState,
  DatabaseSchema
} from "./types";

function schema(name: string, tables: string[], rows = 8987): DatabaseSchema {
  return {
    name,
    tables: tables.map((table, index) => ({
      id: `${name}.${table}`, name: table, rows: rows + index * 137
    }))
  };
}

const constructionSchemas = [
  schema("construction_labour", ["assignments", "projects", "teams"]),
  schema("diary", ["daily_activities", "daily_diaries", "diary_attachments", "equipment_logs", "labour_logs", "materials", "weather"]),
  schema("equipment", ["asset_breakdown_attachments", "asset_breakdown", "procurement_attachment", "procurement_request"]),
  schema("labour", ["labours", "positions", "rosters"]),
  schema("master_data", ["frequency_types", "equipment_categories"]),
  schema("public", ["companies", "departments"])
];

function database(id: string, schemas: DatabaseSchema[], connected = true): DataAccessDatabase {
  return {
    id,
    development: { name: `${id}_dev`, connected },
    production: { name: `${id}_prod`, connected },
    schemas
  };
}

// Design fixtures only. These connections never query or modify a real database.
export const DEMO_DATABASES: DataAccessDatabase[] = [
  database("atlas_construction", constructionSchemas),
  database("atlas_manufacturing", [
    schema("development", ["requests", "project_plans", "designs", "prototypes"], 240),
    schema("public", ["products", "projects"], 320)
  ]),
  database("atlas_workflow", [
    schema("workflow", ["workflows", "connections", "knowledge_sources", "tasks"], 120)
  ]),
  database("atlas_integrations", [
    schema("integration", ["connectors", "runs", "events"], 850)
  ], false)
];

type SubSeed = [name: string, tables: string[], database?: string];

function module(
  id: string,
  name: string,
  defaultDatabase: string | null,
  subs: SubSeed[],
  updatedAt: string | null,
  updatedBy = "test user"
): DataAccessModule {
  return {
    id, name, key: id,
    description: id === "asset-management"
      ? "Equipment, maintenance, work orders and procurement"
      : "",
    defaultDatabase, updatedAt, updatedBy: updatedAt ? updatedBy : null,
    subModules: subs.map(([subName, tables, source], index) => ({
      id: `${id}-${index}`, name: subName, database: source ?? null,
      outputDatabase: null, tables
    }))
  };
}

const modules = [
  module("asset-management", "Asset Management", "atlas_construction", [
    ["Asset List", ["equipment.asset_breakdown_attachments", "equipment.asset_breakdown"]],
    ["Preventive Maintenance", ["equipment.asset_breakdown"]],
    ["Breakdown Maintenance", ["equipment.asset_breakdown_attachments", "equipment.asset_breakdown"]],
    ["Work Order", ["equipment.asset_breakdown", "equipment.procurement_request"]],
    ["Frequency Type", ["master_data.frequency_types"]],
    ["Work Order Costs", ["equipment.procurement_request", "equipment.procurement_attachment"]],
    ["Spare Parts", []],
    ["Procurement", ["equipment.procurement_attachment", "equipment.procurement_request"]]
  ], "2026-10-08T09:40:00"),
  module("capacity-analytic", "Capacity Analytic", null, [
    ["Loading vs Capacity", []], ["Contingency Plan", []],
    ["Capacity Trend", []], ["Formula Configuration", []]
  ], null),
  module("daily-diaries", "Daily Diaries", "atlas_construction", [
    ["Daily Activities", ["diary.daily_activities", "diary.daily_diaries"]]
  ], "2026-10-07T15:20:00", "Rizano A."),
  module("inspection", "Inspection", null, [
    ["Templates", []], ["Products", []], ["Non-conformance", []]
  ], null),
  module("labour-rostering", "Labour Rostering", "atlas_construction", [
    ["Active Projects", ["construction_labour.projects"]],
    ["All Employees", ["labour.labours"]],
    ["Rostering", ["labour.rosters"]]
  ], "2026-10-06T11:02:00"),
  module("product-development", "Product Development", "atlas_manufacturing", [
    ["Requests", ["development.requests"]], ["Project Planning", ["development.project_plans"]],
    ["Design", ["development.designs"]], ["Prototype", ["development.prototypes"]]
  ], "2026-10-05T11:30:00"),
  module("synergy-intelligence", "Synergy Intelligence", "atlas_workflow", [
    ["Intelligence", ["workflow.knowledge_sources"]]
  ], "2026-10-04T08:15:00"),
  module("workflow-connections", "Workflow & Connections", "atlas_workflow", [
    ["Workflow Studio", ["workflow.workflows"]],
    ["Master Connections", ["workflow.connections"]],
    ["Knowledge Source", ["workflow.knowledge_sources"]],
    ["Integrations", ["integration.connectors"], "atlas_integrations"]
  ], "2026-10-03T17:40:00", "Rizano A."),
  module("master-data", "Master Data", "atlas_construction", [
    ["Companies", ["public.companies"]], ["Departments", ["public.departments"]],
    ["Equipment Categories", ["master_data.equipment_categories"]]
  ], "2026-10-01T10:00:00")
];

export function createDemoState(): DataAccessState {
  return structuredClone({
    version: 1,
    modules,
    history: [
      {
        id: "demo-history-1", moduleId: "asset-management",
        subModuleId: "asset-management-7", subModuleName: "Procurement",
        actor: "test user", at: "2026-10-08T09:40:00", kind: "added",
        summary: "Added 2 tables",
        details: ["atlas_construction : equipment.procurement_attachment", "atlas_construction : equipment.procurement_request"]
      },
      {
        id: "demo-history-2", moduleId: "asset-management",
        subModuleId: "asset-management-5", subModuleName: "Work Order Costs",
        actor: "Rizano A.", at: "2026-10-02T09:40:00", kind: "added",
        summary: "Added 1 table",
        details: ["atlas_construction : equipment.procurement_request"]
      },
      {
        id: "demo-history-3", moduleId: "asset-management",
        subModuleId: "asset-management-4", subModuleName: "Frequency Type",
        actor: "Budi S", at: "2026-10-01T09:40:00", kind: "added",
        summary: "Added 1 table",
        details: ["atlas_construction : master_data.frequency_types"]
      },
      {
        id: "demo-history-4", moduleId: "asset-management",
        subModuleId: "asset-management-0", subModuleName: "Asset List",
        actor: "test user", at: "2026-10-01T08:30:00", kind: "settings",
        summary: "Updated data source settings",
        details: ["Reads from: Module default"]
      },
      {
        id: "demo-history-5", moduleId: "asset-management",
        subModuleId: "asset-management-4", subModuleName: "Frequency Type",
        actor: "Rizano A.", at: "2026-09-30T09:40:00", kind: "removed",
        summary: "Removed 1 table",
        details: ["atlas_construction : master_data.equipment_categories"]
      }
    ]
  });
}

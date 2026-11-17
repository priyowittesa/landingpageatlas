import type {
  MasterDataCategory,
  MasterDataFieldDefinition,
  NodeConfig,
  NodeTypeDetail,
  WorkflowEdge,
  WorkflowNode
} from "../types";

/* -------------------------------------------------------------------------- */
/*                    Connector-type registry (from /v1/node-types)           */
/* -------------------------------------------------------------------------- */

/**
 * Runtime map of `nodeType → connector_type`, populated from the
 * /v1/node-types list. This lets us resolve roles and config forms
 * dynamically for any connector the backend exposes, without hardcoding
 * individual node names.
 */
const connectorTypeRegistry = new Map<string, string>();

/**
 * Register connector types from the /v1/node-types response. Called once
 * from the sidebar when the node type list loads.
 */
export function registerConnectorTypes(
  items: { name: string; connector_type: string }[]
): void {
  connectorTypeRegistry.clear();
  for (const item of items) {
    connectorTypeRegistry.set(item.name.toLowerCase(), item.connector_type);
  }
}

/** Look up the connector_type for a node type name (e.g. "pipedrive" → "http"). */
export function getConnectorType(nodeType: string): string | undefined {
  return connectorTypeRegistry.get(nodeType.toLowerCase());
}

/* -------------------------------------------------------------------------- */
/*                              Configurable types                            */
/* -------------------------------------------------------------------------- */

/**
 * The kind of config form a node renders. Determined dynamically from the
 * connector_type returned by /v1/node-types:
 *   - http      → http_source  (ConnectionSelector + dynamic resource groups)
 *   - db        → postgresql   (only postgresql has a dedicated form today;
 *                               other db connectors return null until they
 *                               get their own form)
 *   - transform → transform
 */
export type ConfigurableNodeType =
  | "http_source"
  | "postgresql"
  | "transform"
  | "transform_master_data"
  | "transform_parse_file";

/** DB connectors that have a dedicated destination form. */
const DB_DESTINATION_FORMS = new Set(["postgresql"]);

/**
 * Node type names for the Google Drive connector. The API exposes it as
 * "googledrive"; "google_drive" is kept for canvases saved before that.
 */
export const GOOGLE_DRIVE_TYPES = new Set(["googledrive", "google_drive"]);

/**
 * Whether a Google Drive operation targets a single file and therefore needs a
 * `file_id`. Listing/searching operations don't — they return many files.
 */
export function requiresGoogleDriveFile(operation: string): boolean {
  const op = operation.toLowerCase();
  if (!op.includes("file")) return false;
  return !op.includes("list") && !op.includes("search");
}

/**
 * Normalize an API/registry node type name to a config form key, using the
 * connector_type from the registry. Falls back to well-known names so it
 * still works before the registry is populated (e.g. during SSR or if the
 * API hasn't loaded yet).
 */
export function resolveConfigNodeType(
  nodeType: string
): ConfigurableNodeType | null {
  const t = nodeType.toLowerCase();
  const connectorType = connectorTypeRegistry.get(t);

  if (connectorType === "http") return "http_source";
  if (connectorType === "transform") {
    if (t === "transform_master_data") return "transform_master_data";
    if (t === "transform_parse_file") return "transform_parse_file";
    return "transform";
  }
  if (connectorType === "db" && DB_DESTINATION_FORMS.has(t))
    return "postgresql";

  // Fallbacks for before the registry is populated.
  if (t === "transform_master_data") return "transform_master_data";
  if (t === "transform_parse_file") return "transform_parse_file";
  if (t === "transform") return "transform";
  if (t === "postgresql" || t === "postgres" || t === "postgree")
    return "postgresql";

  return null;
}

export function hasNodeConfigForm(nodeType: string): boolean {
  return resolveConfigNodeType(nodeType) !== null;
}

export function parseNexaDataSources(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((id): id is string => typeof id === "string");
  if (typeof value !== "string") return [];
  try {
    return parseNexaDataSources(JSON.parse(value));
  } catch {
    return [];
  }
}

/** Build the initial `config` object for a freshly dropped node. */
export function defaultNodeConfig(nodeType: string): NodeConfig | undefined {
  if (nodeType.toLowerCase() === "nexa_chat")
    return { type: "nexa_chat", data_sources: [] };

  switch (resolveConfigNodeType(nodeType)) {
    case "http_source":
      return {
        type: "source",
        connector: nodeType,
        connection_id: "",
        resource_group: "",
        operation: "",
        site_id: "",
        file_id: ""
      };
    case "postgresql":
      return {
        type: "destination",
        connector: "postgresql",
        connection_id: "",
        table_name: "",
        operation: "upsert",
        unique_columns: []
      };
    case "transform":
      return {
        type: "transform",
        mapping: []
      };
    case "transform_master_data":
      return {
        type: "transform",
        category: "",
        mapping: []
      };
    case "transform_parse_file":
      // No `mapping` here: the field mapping lives on the downstream
      // transform_master_data node.
      return {
        type: "transform",
        file_type: "",
        sheet_name: "",
        header_row: 0,
        skip_rows: 0
      };
    default:
      return undefined;
  }
}

export const POSTGRES_WRITE_MODES: { value: string; label: string }[] = [
  { value: "upsert", label: "Upsert" },
  { value: "insert", label: "Insert" },
  { value: "truncate_insert", label: "Truncate & Insert" }
];

/* -------------------------------------------------------------------------- */
/*                       Transform Master Data target fields                  */
/* -------------------------------------------------------------------------- */

/**
 * Static target field definitions per Master Data category. Populated on the
 * FE — the user only maps a `source` field to each target. Shared between the
 * config form (to render rows) and the validator (to know which targets are
 * required).
 */
export const MASTER_DATA_FIELDS: Record<
  MasterDataCategory,
  MasterDataFieldDefinition[]
> = {
  employee: [
    { name: "code", type: "string", required: true },
    { name: "full_name", type: "string", required: true },
    { name: "preferred_name", type: "string", required: false },
    { name: "email", type: "string", required: true },
    { name: "phone_number", type: "string", required: false },
    { name: "gender", type: "enum", required: false },
    { name: "date_of_birth", type: "string", required: false },
    { name: "address", type: "string", required: false },
    { name: "position_name", type: "string", required: false },
    { name: "role_name", type: "string", required: true },
    { name: "department_name", type: "string", required: false },
    { name: "status", type: "enum", required: true },
    { name: "type", type: "enum", required: true },
    { name: "contract_end_at", type: "string", required: false },
    { name: "note", type: "string", required: false },
    { name: "rate_card_name", type: "string", required: false }
  ],
  equipment: [
    { name: "code", type: "string", required: true },
    { name: "name", type: "string", required: true },
    { name: "category_name", type: "string", required: true },
    { name: "status", type: "string", required: true },
    { name: "location", type: "string", required: false },
    { name: "brand_manufacturer", type: "string", required: false },
    { name: "model", type: "string", required: false },
    { name: "serial_number_vin", type: "string", required: false },
    { name: "description", type: "string", required: false },
    { name: "condition", type: "string", required: false },
    { name: "type_class_name", type: "string", required: false },
    { name: "specification", type: "string", required: false },
    { name: "manufacture_year", type: "number", required: false },
    { name: "capacity_size", type: "number", required: false },
    { name: "capacity_unit_name", type: "string", required: false },
    { name: "power_rating", type: "string", required: false },
    { name: "fuel_type", type: "string", required: false },
    { name: "operating_weight", type: "number", required: false },
    { name: "operating_weight_unit_name", type: "string", required: false },
    { name: "engine_make", type: "string", required: false },
    { name: "engine_model", type: "string", required: false },
    { name: "engine_number", type: "string", required: false },
    { name: "engine_power", type: "string", required: false },
    { name: "transmission_type", type: "string", required: false },
    { name: "emission_standard", type: "string", required: false },
    { name: "notes", type: "string", required: false },
    { name: "ownership_type", type: "string", required: false },
    { name: "owned_by_company_name", type: "string", required: false },
    { name: "purchase_date", type: "string", required: false },
    { name: "purchase_price", type: "number", required: false },
    { name: "purchase_price_currency", type: "string", required: false },
    { name: "supplier_vendor", type: "string", required: false },
    { name: "invoice_document_no", type: "string", required: false },
    { name: "warranty_start_date", type: "string", required: false },
    { name: "warranty_end_date", type: "string", required: false },
    { name: "country", type: "string", required: false },
    { name: "state_province", type: "string", required: false },
    { name: "city_region", type: "string", required: false },
    { name: "site_location", type: "string", required: false },
    { name: "department_name", type: "string", required: false },
    { name: "project_name", type: "string", required: false },
    { name: "detailed_address", type: "string", required: false }
  ],
  project: [
    { name: "code", type: "string", required: true },
    { name: "title", type: "string", required: true },
    { name: "client_name", type: "string", required: true },
    { name: "start_date", type: "string", required: true },
    { name: "end_date", type: "string", required: false },
    { name: "status", type: "string", required: true },
    { name: "priority", type: "string", required: true },
    { name: "description", type: "string", required: false },
    { name: "project_manager_name", type: "string", required: false },
    { name: "location", type: "string", required: false },
    { name: "address", type: "string", required: false },
    { name: "tags", type: "string[]", required: true },
    { name: "project_type_name", type: "string", required: false }
  ],
  rate_card: [
    { name: "code", type: "string", required: true },
    { name: "name", type: "string", required: true },
    { name: "currency", type: "string", required: true },
    { name: "base_rate", type: "number", required: true },
    { name: "unit", type: "string", required: true }
  ],
  department: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "string", required: false },
    { name: "cost_center_code", type: "string", required: false },
    { name: "is_active", type: "boolean", required: true }
  ],
  role: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "string", required: false }
  ],
  shift: [
    { name: "code", type: "string", required: true },
    { name: "name", type: "string", required: true },
    { name: "description", type: "string", required: false },
    { name: "hex_color", type: "string", required: false },
    { name: "is_overnight", type: "boolean", required: true },
    { name: "break_duration", type: "string", required: false },
    { name: "auto_calculate_working_hours", type: "boolean", required: true },
    { name: "working_hours", type: "string", required: false },
    { name: "allow_overtime", type: "boolean", required: true },
    { name: "overtime_threshold", type: "string", required: false },
    { name: "minimum_working_hours", type: "string", required: false },
    { name: "maximum_working_hours", type: "string", required: false },
    { name: "notes", type: "string", required: false }
  ],
  project_type: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "string", required: false }
  ]
};

/* -------------------------------------------------------------------------- */
/*                                Node roles                                  */
/* -------------------------------------------------------------------------- */

/**
 * The role a node plays in the canvas pipeline. Used to enforce the
 * Source -> Transform -> Destination rule and to classify nodes for the BE.
 * Resolved dynamically from connector_type when available.
 */
export type NodeRole = "source" | "transform" | "destination" | "other";

const CONNECTOR_TYPE_ROLE: Record<string, NodeRole> = {
  http: "source",
  db: "destination",
  transform: "transform"
};

/** Resolve a node role from its node type name. */
export function getNodeRoleByType(nodeType: string): NodeRole {
  const t = nodeType.toLowerCase();
  const connectorType = connectorTypeRegistry.get(t);
  if (connectorType && CONNECTOR_TYPE_ROLE[connectorType]) {
    return CONNECTOR_TYPE_ROLE[connectorType];
  }
  // Fallbacks for before the registry is populated.
  if (t === "transform") return "transform";
  if (t === "postgresql" || t === "postgres" || t === "postgree")
    return "destination";
  if (t === "master_data") return "destination";
  return "other";
}

/** Resolve a node role, preferring the persisted config.type when present. */
export function getNodeRole(node: WorkflowNode): NodeRole {
  const t = (node.config as { type?: string } | undefined)?.type;
  if (t === "source" || t === "destination" || t === "transform") return t;
  return getNodeRoleByType(node.data.nodeType as string);
}

/** Connection details a transform inherits from its upstream source node. */
export interface UpstreamSourceConnection {
  node_id: string;
  connection_id: string;
  connector: string;
  file_id: string;
}

export function findUpstreamMasterDataCategory(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): MasterDataCategory | "" {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>([nodeId]);
  let frontier = edges.filter((e) => e.target === nodeId).map((e) => e.source);

  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = byId.get(id);
      if (!node) continue;

      const config = (node.config ?? {}) as Record<string, unknown>;
      if (
        resolveConfigNodeType((node.data.nodeType as string) ?? "") ===
        "transform_master_data"
      ) {
        const category = String(config.category ?? "") as MasterDataCategory;
        if (category in MASTER_DATA_FIELDS) return category;
      }

      next.push(...edges.filter((e) => e.target === id).map((e) => e.source));
    }
    frontier = next;
  }

  return "";
}

/**
 * Walk the graph upstream from `nodeId` to find the nearest source node and
 * return its connection details. Used by the Parse File transform, which needs
 * the upstream connector's connection + file to preview the sheet headers.
 */
export function findUpstreamSourceConnection(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): UpstreamSourceConnection | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>([nodeId]);
  let frontier = edges.filter((e) => e.target === nodeId).map((e) => e.source);

  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = byId.get(id);
      if (!node) continue;

      const config = (node.config ?? {}) as Record<string, unknown>;
      if (getNodeRole(node) === "source") {
        return {
          node_id: node.id,
          connection_id: String(config.connection_id ?? ""),
          connector:
            String(config.connector ?? "") || String(node.data.nodeType ?? ""),
          file_id: String(config.file_id ?? "")
        };
      }

      next.push(...edges.filter((e) => e.target === id).map((e) => e.source));
    }
    frontier = next;
  }

  return null;
}

/**
 * Payload needed to call POST
 * /v1/fabrix/executor/api-connector/preview-excel-headers for a
 * transform_master_data node whose upstream chain includes a
 * transform_parse_file node. Resolved by walking upstream to collect the
 * Excel parse options (sheet_name / header_row / skip_rows) and the source
 * node's connection + file. Returns null when the chain doesn't include a
 * parse-excel node or the source isn't fully configured yet.
 */
export interface UpstreamExcelPreview {
  connection_id: string;
  connector: string;
  file_id: string;
  sheet_name: string;
  header_row: number;
  skip_rows: number;
}

export function findUpstreamExcelPreview(
  nodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): UpstreamExcelPreview | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>([nodeId]);
  let frontier = edges.filter((e) => e.target === nodeId).map((e) => e.source);

  let excel: {
    sheet_name: string;
    header_row: number;
    skip_rows: number;
  } | null = null;
  let source: UpstreamSourceConnection | null = null;

  while (frontier.length && (!excel || !source)) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);

      const node = byId.get(id);
      if (!node) continue;

      const config = (node.config ?? {}) as Record<string, unknown>;
      const resolvedType = resolveConfigNodeType(
        (node.data.nodeType as string) ?? ""
      );

      if (!excel && resolvedType === "transform_parse_file") {
        excel = {
          sheet_name: String(config.sheet_name ?? ""),
          header_row: Number(config.header_row ?? 0) || 0,
          skip_rows: Number(config.skip_rows ?? 0) || 0
        };
      }

      if (!source && getNodeRole(node) === "source") {
        source = {
          node_id: node.id,
          connection_id: String(config.connection_id ?? ""),
          connector:
            String(config.connector ?? "") || String(node.data.nodeType ?? ""),
          file_id: String(config.file_id ?? "")
        };
      }

      if (excel && source) break;

      next.push(...edges.filter((e) => e.target === id).map((e) => e.source));
    }
    frontier = next;
  }

  if (!excel || !source) return null;
  if (!source.connection_id || !source.connector || !source.file_id)
    return null;

  return {
    connection_id: source.connection_id,
    connector: source.connector,
    file_id: source.file_id,
    sheet_name: excel.sheet_name,
    header_row: excel.header_row,
    skip_rows: excel.skip_rows
  };
}

/**
 * Whether a node must have its config completed *before* it can be dropped on
 * the canvas (source/destination connectors). Transform nodes are configured
 * after placement so this returns false for them.
 */
export function requiresPreDropConfig(nodeType: string): boolean {
  const role = getNodeRoleByType(nodeType);
  return (
    (role === "source" || role === "destination") && hasNodeConfigForm(nodeType)
  );
}

/* -------------------------------------------------------------------------- */
/*                              Config validation                             */
/* -------------------------------------------------------------------------- */

/**
 * Validate a node's config. Returns a list of human-readable errors; an empty
 * array means the config is complete and valid.
 *
 * `detail` is the optional /v1/node-types/{name} response. When provided,
 * resource group / operation requirements for HTTP sources are only enforced
 * if the backend actually publishes resource_groups for that node type.
 */
export function validateNodeConfig(
  nodeType: string,
  config: unknown,
  detail?: NodeTypeDetail | null
): string[] {
  const errors: string[] = [];
  const c = (config ?? {}) as Record<string, any>;
  const key = resolveConfigNodeType(nodeType);

  if (key === "http_source") {
    if (!String(c.connection_id ?? "").trim())
      errors.push("Connection is required.");
    // Only require resource group / operation when the BE exposes them.
    const hasResourceGroups =
      detail?.resource_groups && Object.keys(detail.resource_groups).length > 0;
    if (hasResourceGroups) {
      if (!c.resource_group) errors.push("Resource group is required.");
      if (!c.operation) errors.push("Operation is required.");
    }
    // SharePoint requires a site selection.
    if (
      nodeType.toLowerCase() === "sharepoint" &&
      !String(c.site_id ?? "").trim()
    )
      errors.push("Site is required.");
    // Google Drive file operations require a file selection. The API exposes
    // the connector as "googledrive"; "google_drive" is kept for legacy canvases.
    if (
      GOOGLE_DRIVE_TYPES.has(nodeType.toLowerCase()) &&
      requiresGoogleDriveFile(String(c.operation ?? "")) &&
      !String(c.file_id ?? "").trim()
    )
      errors.push("File is required.");
  } else if (key === "postgresql") {
    if (!String(c.connection_id ?? "").trim())
      errors.push("Connection is required.");
    if (!String(c.table_name ?? "").trim())
      errors.push("Table name is required.");
    if (!c.operation) errors.push("Write mode is required.");
    if (c.operation === "upsert" && !(c.unique_columns?.length ?? 0))
      errors.push("Unique columns are required for upsert.");
  } else if (key === "transform_parse_file") {
    // Parse File only configures how the sheet is read — the field mapping
    // lives on the downstream transform_master_data node, which sources its
    // options from the parsed columns.
    if (Number(c.header_row ?? 0) < 0)
      errors.push("Header row cannot be negative.");
    if (Number(c.skip_rows ?? 0) < 0)
      errors.push("Skip rows cannot be negative.");
  } else if (key === "transform" || key === "transform_master_data") {
    if (key === "transform_master_data" && !c.category) {
      errors.push("Category is required.");
    }
    const mapping = (c.mapping ?? []) as { source?: string; target?: string }[];
    if (mapping.length === 0) {
      errors.push("At least one field mapping is required.");
    } else if (key === "transform_master_data") {
      // For Master Data transforms the mapping is pre-populated with every
      // target field (required + optional). Only required target fields must
      // have a source; optional fields with an empty source are simply
      // dropped. Resolve the required-ness from the static field definitions
      // so the check is exact per target field, not positional.
      const category = c.category as MasterDataCategory | undefined;
      const targetDefs =
        category && MASTER_DATA_FIELDS[category]
          ? MASTER_DATA_FIELDS[category]
          : [];
      const requiredByName = new Map(
        targetDefs.filter((d) => d.required).map((d) => [d.name, d.name])
      );
      mapping.forEach((m, i) => {
        const target = String(m.target ?? "").trim();
        const source = String(m.source ?? "").trim();
        // Target should always be set (it's read-only in the form), but guard
        // anyway: a row with no target is invalid only if it's required.
        if (!target && requiredByName.size > 0) {
          errors.push(`Mapping ${i + 1} is missing a target field.`);
          return;
        }
        // Require a source only for required target fields.
        if (requiredByName.has(target) && !source) {
          errors.push(`Mapping ${i + 1} (${target}) requires a source field.`);
        }
      });
    } else {
      mapping.forEach((m, i) => {
        if (!String(m.source ?? "").trim() || !String(m.target ?? "").trim())
          errors.push(`Mapping ${i + 1} needs both source and target.`);
      });
    }
  }

  return errors;
}

export function isNodeConfigValid(
  nodeType: string,
  config: unknown,
  detail?: NodeTypeDetail | null
): boolean {
  return validateNodeConfig(nodeType, config, detail).length === 0;
}

import type { Node, Edge } from "@xyflow/react";

/* -------------------------------------------------------------------------- */
/*                              Workflow canvas                               */
/* -------------------------------------------------------------------------- */

export type NodeCategory =
  | "data_source"
  | "data_transform"
  | "ai"
  | "logic"
  | "utils";

export type NodeStatus = "active" | "inactive" | "disabled" | "error";

export type NodeBorderColor = "blue" | "green" | "purple" | "orange" | "gray";

export interface WorkflowNodeData {
  label: string;
  category: NodeCategory;
  status: NodeStatus;
  runtime: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

/* ----------------------------- Node config ------------------------------ */
/* Extra per-node configuration collected in the drawer and sent to the BE   */
/* as a top-level `config` field on each node/edge. The BE maps this into the */
/* AI canvas schema (source / transform / destination nodes).                */

export type PostgresWriteMode = "upsert" | "insert" | "truncate_insert";

/**
 * Generic config for any HTTP source connector (pipedrive, sharepoint, ...).
 * The `connector` field is the node type name from /v1/node-types. Resource
 * group and operation values are populated dynamically from
 * /v1/node-types/{name}.resource_groups.
 */
export interface HttpSourceNodeConfig {
  type: "source";
  connector: string;
  /** Id of the saved secret from /v1/secrets used to authenticate. */
  connection_id: string;
  /** Resource group name — dynamic from /v1/node-types/{name}.resource_groups */
  resource_group: string;
  /** Operation name — dynamic from the selected resource group's keys. */
  operation: string;
  /** SharePoint site id — fetched from /v1/secrets/{id}/microsoft/sites. */
  site_id?: string;
  /** Google Drive file id — fetched from /v1/secrets/{id}/google/drive/files. */
  file_id?: string;
  /** Fabric RTI table to read with tables.get_table_data. */
  table_name?: string;
  /** Fabric RTI query to run with queries.execute_kql_query. */
  kql_query?: string;
}

export interface TransformMapping {
  source: string;
  target: string;
  type: string;
}

export interface TransformNodeConfig {
  type: "transform";
  mapping: TransformMapping[];
}

export type MasterDataCategory =
  | "employee"
  | "equipment"
  | "project"
  | "rate_card"
  | "department"
  | "role"
  | "shift"
  | "project_type";

export interface MasterDataFieldDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface TransformMasterDataNodeConfig {
  type: "transform";
  category: MasterDataCategory | "";
  mapping: TransformMapping[];
}

/**
 * Config for the `transform_parse_file` node. Reads a file coming from the
 * upstream source node (Google Drive / SharePoint) and turns it into rows.
 *
 * `file_type` selects the parser: "excel" exposes the spreadsheet options
 * below (sheet, header row, skip rows); other types (e.g. "pdf") have no
 * extra options yet.
 *
 * It has no field mapping of its own: the mapping lives on the downstream
 * `transform_master_data` node, whose source options are the parsed column
 * headers from POST /v1/fabrix/executor/api-connector/preview-excel-headers.
 */
export interface TransformParseFileNodeConfig {
  type: "transform";
  /** Which parser to use: "excel" or "pdf". */
  file_type: "excel" | "pdf" | "";
  /** Optional sheet name; empty means the first/default sheet. */
  sheet_name?: string;
  /** 0-based index of the row holding the column headers. */
  header_row: number;
  /** Number of rows to skip after the header row. */
  skip_rows: number;
}

/* -------------------------------------------------------------------------- */
/*   Excel header preview                                                     */
/*   (API: POST /v1/fabrix/executor/api-connector/preview-excel-headers)      */
/* -------------------------------------------------------------------------- */

export interface ExcelHeaderPreviewDto {
  /** Id of the saved secret from the upstream source node. */
  connection_id: string;
  /** Connector name of the upstream source node, e.g. "googledrive". */
  connector: string;
  /** File id on the upstream connector. */
  file_id: string;
  header_row: number;
  skip_rows: number;
  sheet_name?: string;
}

/**
 * The endpoint returns a free-form object (Swagger declares only
 * `additionalProperties`), so the shape is normalized on the FE — see
 * `normalizeExcelHeaders`.
 */
export type ExcelHeaderPreviewResponse = Record<string, unknown>;

/* -------------------------------------------------------------------------- */
/*   Excel sheet list (API: POST /v1/fabrix/executor/file-connector/sheets)   */
/* -------------------------------------------------------------------------- */

export interface ExcelSheetsDto {
  /** Id of the saved secret from the upstream source node. */
  connection_id: string;
  /** File id on the upstream connector. */
  file_id: string;
}

/** Standard `{ status, data, error, logs }` envelope returned by the executor. */
export interface ExcelSheetsResponse {
  status: string;
  data: { sheets: string[] };
  error: unknown;
  logs: unknown[];
}

/* -------------------------------------------------------------------------- */
/*                  Transform fields (API: POST /workflow/transform-fields)   */
/* -------------------------------------------------------------------------- */

/**
 * Source field metadata returned by the BE for a single transform node, derived
 * from its upstream source node's connector / resource group / operation.
 */
export interface TransformFieldInfo {
  source_node_id: string;
  connector: string;
  resource_group: string;
  operation: string;
  fields: NodeField[];
  error: string | null;
}

/** Response shape of POST /workflow/transform-fields, keyed by transform node id. */
export interface TransformFieldsResponse {
  transforms: Record<string, TransformFieldInfo>;
}

export interface PostgresNodeConfig {
  type: "destination";
  connector: "postgresql";
  /** Id of the saved secret from /v1/secrets used to authenticate. */
  connection_id: string;
  table_name: string;
  operation: PostgresWriteMode;
  unique_columns: string[];
}

export type NodeConfig =
  | HttpSourceNodeConfig
  | TransformNodeConfig
  | TransformMasterDataNodeConfig
  | TransformParseFileNodeConfig
  | PostgresNodeConfig
  | Record<string, unknown>;

export type WorkflowNode = Node<WorkflowNodeData, "customNode"> & {
  config?: NodeConfig;
};
export type WorkflowEdge = Edge & { config?: Record<string, unknown> };

/**
 * A workflow node as persisted on the backend. Identical to `WorkflowNode`
 * except `type` is the backend role ("source" | "transform" | "destination")
 * rather than the React Flow renderer type ("customNode").
 */
export type PersistedWorkflowNode = Omit<WorkflowNode, "type"> & {
  type: string;
};

/** Serialized canvas persisted on a workflow */
export interface WorkflowCanvas {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/** Canvas shape sent to /workflow/{id} (PUT/POST) with backend role types. */
export interface PersistedWorkflowCanvas {
  nodes: PersistedWorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  status: "draft" | "published";
}

export interface NodeDefinition {
  type: string;
  label: string;
  category: NodeCategory;
  borderColor: NodeBorderColor;
  icon: string;
  description?: string;
  defaultConfig?: Record<string, unknown>;
}

export interface NodeCategoryDefinition {
  id: string;
  label: string;
  icon: string;
  items: NodeDefinition[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/* -------------------------------------------------------------------------- */
/*                          Folders (API: /workflow)                          */
/* -------------------------------------------------------------------------- */

export interface WorkflowFolder {
  id: string;
  name: string;
  description: string;
  parent_id?: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface WorkflowFolderFormDto {
  name: string;
  description?: string;
  /** Optional: set when creating a folder inside another folder */
  parent_id?: string;
}

/* -------------------------------------------------------------------------- */
/*                       Workflows (API: /workflows)                          */
/* -------------------------------------------------------------------------- */

export interface Workflow {
  id: string;
  name: string;
  description: string;
  folder_id: string;
  canvas?: PersistedWorkflowCanvas | null;
  schedule_config?: ScheduleConfig | null;
  schedule_cron_expression?: string | null;
  schedule_enabled?: boolean;
  schedule_timezone?: string | null;
  schedule_type?: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
}

export interface WorkflowFormDto {
  name: string;
  description?: string;
  folder_id: string;
}

export interface ScheduleConfig {
  cron_expression?: string;
  date?: string;
  day?: number;
  day_of_month?: number;
  days_of_week?: string[];
  every_n_days?: number;
  every_n_hours?: number;
  every_n_minutes?: number;
  every_n_months?: number;
  every_n_weeks?: number;
  hour?: number;
  minute?: number;
  month?: number;
  time?: string;
}

export interface WorkflowUpdateDto {
  name: string;
  description?: string;
  folder_id: string;
  canvas: PersistedWorkflowCanvas;
  schedule_config?: ScheduleConfig;
  schedule_cron_expression?: string;
  schedule_enabled?: boolean;
  schedule_timezone?: string;
  schedule_type?: string;
}

/* -------------------------------------------------------------------------- */
/*                  Credential Types & Secrets (API: /v1)                     */
/* -------------------------------------------------------------------------- */

export interface SecretFormDto {
  /** Node/connector name (from /v1/node-types) the secret belongs to. */
  node_type: string;
  name: string;
  values: Record<string, string>;
}

export interface Secret {
  id: string;
  name: string;
  node_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  values: Record<string, string> | null;
}

export interface SecretListResponse {
  items: Secret[];
}

export interface MicrosoftSite {
  id: string;
  name: string;
  display_name: string;
  web_url: string;
  hostname: string;
}

export interface MicrosoftSiteListResponse {
  items: MicrosoftSite[];
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mime_type: string;
  web_view_link: string;
  modified_time: string;
  size: string;
  parents: string[];
}

export interface GoogleDriveFileListResponse {
  items: GoogleDriveFile[];
}

/* -------------------------------------------------------------------------- */
/*                       Node Types (API: /v1/node-types)                     */
/* -------------------------------------------------------------------------- */

export interface NodeType {
  connector_type: string;
  name: string;
  description: string;
}

export interface NodeTypeListResponse {
  items: NodeType[];
}

export interface NodeField {
  name: string;
  type: string;
  nullable: boolean;
  required: boolean;
  description: string;
}

export interface NodeOperation {
  description: string;
  request_fields: NodeField[];
  response_fields: NodeField[];
}

export type ResourceGroup = Record<string, NodeOperation>;

/** A single connection field required to connect to a node/connector. */
export interface ConnectionParam {
  name: string;
  label: string;
  type: string;
  required: boolean;
  secret: boolean;
  default: string | null;
  description: string;
}

export interface NodeTypeDetail {
  connection_params: ConnectionParam[];
  connector_type: string;
  description: string;
  name: string;
  resource_groups: Record<string, ResourceGroup>;
}

/* -------------------------------------------------------------------------- */
/*        Execution Logs (API: GET /workflow/{id}/execution-logs)             */
/* -------------------------------------------------------------------------- */

export type WorkflowLogLevel = "success" | "info" | "warning" | "error";

/** A single line in the workflow execution log console. */
export interface WorkflowExecutionLog {
  id: string;
  workflow_id: string;
  run_id: string;
  execution_id: string;
  tenant_id: string;
  user_id: string;
  level: WorkflowLogLevel;
  message: string;
  sequence: number;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}

/** Aggregate counts per level returned alongside the log items. */
export interface WorkflowExecutionLogSummary {
  error: number;
  info: number;
  success: number;
  warning: number;
}

/** Response payload of GET /workflow/{id}/execution-logs. */
export interface WorkflowExecutionLogs {
  items: WorkflowExecutionLog[];
  next_page_token: string;
  summary: WorkflowExecutionLogSummary;
  total_count: number;
}

/* -------------------------------------------------------------------------- */
/*      Chat Sessions (API: GET/POST /workflow/{id}/chat/sessions)            */
/* -------------------------------------------------------------------------- */

/** A workflow-scoped chat session the AI assistant can converse in. */
export interface WorkflowChatSession {
  id: string;
  session_id?: string;
  tenant_id?: string;
  workflow_id?: string;
  user_id: string;
  title: string;
  metadata: Record<string, unknown>;
  status?: string;
  created_at: string;
  updated_at: string;
  messages?: WorkflowChatMessage[];
  projects?: string[];
  project_names?: string[];
  skill_ids?: string[];
  notification?: boolean;
  is_scheduled_task?: boolean;
}

/** Payload for POST /workflow/{id}/chat/sessions — get-or-create session. */
export interface WorkflowChatSessionCreateDto {
  message?: string;
  metadata?: Record<string, unknown>;
  title?: string;
  user_id?: string;
  user_prompt?: string;
  /** Ids returned by POST /workflow/chat/uploads/upload-url (after complete). */
  files?: string[];
  /** Knowledge folder ids used to scope a project chat. */
  projects?: string[];
  skill_ids?: string[];
}

/** Response payload of GET /workflow/{id}/chat/sessions. */
export interface WorkflowChatSessionListResponse {
  items: WorkflowChatSession[];
  next_page_token: string;
  total_count: number;
}

export interface WorkflowChatSessionCreateResponse {
  ai_response_raw?: {
    data?: string;
    session_id?: string;
    status?: number;
  };
  ai_status_code?: number;
  session: WorkflowChatSession;
  session_id: string;
  status?: string;
}

export interface WorkflowChatMessageFile {
  file_name: string;
  /** File id (matches the `id` returned by /workflow/chat/uploads). */
  file_id?: string;
  /** Some payloads (e.g. `metadata.files`) use `id` instead of `file_id`. */
  id?: string;
}

export type WorkflowChatResponseError = {
  code?: string;
  message?: string;
  retryable: boolean;
  retry_after?: number | null;
};

export function getWorkflowChatResponseError(
  value: unknown
): WorkflowChatResponseError | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const error = value as Record<string, unknown>;
  return {
    code: typeof error.code === "string" ? error.code : undefined,
    message: typeof error.message === "string" ? error.message : undefined,
    retryable: error.retryable === true,
    retry_after:
      typeof error.retry_after === "number" ? error.retry_after : null
  };
}

export interface WorkflowChatMessage {
  id: string;
  session_id?: string;
  role: "assistant" | "user" | string;
  content: string;
  message_type?: string;
  metadata?: Record<string, unknown>;
  sequence?: number;
  user_id?: string;
  skill_ids?: string[];
  created_at?: string;
  updated_at?: string;
  tenant_id?: string;
  /** Files attached to the message (from /workflow/chat/uploads). */
  files?: WorkflowChatMessageFile[];
}

/** A selectable follow-up choice on an assistant message (`metadata.options`). */
export interface WorkflowChatMessageOption {
  id: string;
  label: string;
  description?: string | null;
  recommended?: boolean;
  /** `choice` renders a pickable answer; `other` defers to free-text input. */
  type?: string;
}

export interface WorkflowChatMessageMemo {
  id: string;
  title: string;
  knowledge_folder_id?: string | null;
}

/** Read selected skills from both outgoing and persisted message shapes. */
export function getChatMessageSkillIds(message: WorkflowChatMessage): string[] {
  const metadataSkillIds = message.metadata?.skill_ids;
  return Array.from(
    new Set([
      ...(message.skill_ids ?? []),
      ...(Array.isArray(metadataSkillIds)
        ? metadataSkillIds.filter(
          (skillId): skillId is string => typeof skillId === "string" && skillId.length > 0
        )
        : [])
    ])
  );
}

export function getChatMessageMemos(
  message: WorkflowChatMessage
): WorkflowChatMessageMemo[] {
  const raw = message.metadata?.memo_details;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (memo): memo is Record<string, unknown> =>
        Boolean(memo) && typeof memo === "object"
    )
    .map((memo) => ({
      id: typeof memo.id === "string" ? memo.id : "",
      title: typeof memo.title === "string" ? memo.title : "",
      knowledge_folder_id:
        typeof memo.knowledge_folder_id === "string"
          ? memo.knowledge_folder_id
          : null
    }))
    .filter((memo) => memo.id.length > 0 && memo.title.length > 0);
}

/**
 * Extract interactive follow-up options from an assistant message. The backend
 * returns them in `metadata.options` (e.g. the memo/report follow-up choices);
 * regular messages carry no options.
 */
export function getChatMessageOptions(
  message: WorkflowChatMessage
): WorkflowChatMessageOption[] {
  const raw = message.metadata?.options;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (option): option is Record<string, unknown> =>
        Boolean(option) && typeof option === "object"
    )
    .map((option) => ({
      id: typeof option.id === "string" ? option.id : String(option.id ?? ""),
      label: typeof option.label === "string" ? option.label : "",
      description:
        typeof option.description === "string" ? option.description : null,
      recommended: option.recommended === true,
      type: typeof option.type === "string" ? option.type : "choice"
    }))
    .filter((option) => option.label.length > 0);
}

/**
 * Extract chat attachments from a message. The backend may attach files
 * either on the top-level `files` field or inside `metadata.files` (which
 * uses `id` rather than `file_id`). This normalizes both shapes into a
 * single list of `{ file_id, file_name }` entries.
 */
export function getChatMessageFiles(
  message: WorkflowChatMessage
): WorkflowChatMessageFile[] {
  const top = message.files ?? [];
  const meta = (message.metadata?.files as WorkflowChatMessageFile[] | undefined) ?? [];
  return [...top, ...meta].map((file) => ({
    file_name: file.file_name,
    file_id: file.file_id ?? file.id
  }));
}

export interface WorkflowChatMessageListResponse {
  items: WorkflowChatMessage[];
  next_page_token?: string;
  prev_page_token?: string;
  total_count?: number;
}

export interface WorkflowChatMessageCreateDto {
  content: string;
  retry?: boolean;
  message_type: string;
  metadata: Record<string, unknown>;
  status?: string;
  role: string;
  sequence: number;
  user_id: string;
  /** Ids returned by POST /workflow/chat/uploads/upload-url (after complete). */
  files?: string[];
  skill_ids?: string[];
}

export interface WorkflowChatSessionUpdateDto {
  metadata: Record<string, unknown>;
  status: string;
  title: string;
  user_id: string;
}

/**
 * Checks whether a chat message is a standard user/assistant text message to display in the bubble chat.
 * Excludes messages where message_type is "tool_result", "tool_call", contains "tool", or role is "tool".
 */
export function isTextChatMessage(message: WorkflowChatMessage): boolean {
  if (message.role === "tool") {
    return false;
  }

  const rawType =
    message.message_type ??
    (typeof message.metadata?.message_type === "string"
      ? message.metadata.message_type
      : undefined);

  if (rawType) {
    const normalized = rawType.toLowerCase().trim();
    if (normalized.includes("tool")) {
      return false;
    }
    if (normalized !== "text") {
      return false;
    }
  }

  if (message.role === "system") {
    return false;
  }

  return true;
}

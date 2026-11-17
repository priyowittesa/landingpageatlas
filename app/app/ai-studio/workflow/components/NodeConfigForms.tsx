"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { FormSelect } from "./FormSelect";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import {
  credentialKeys,
  useCreateSecret,
  useGetSecrets,
  useGetMicrosoftSites,
  useGetGoogleDriveFiles
} from "../hooks/useCredentials";
import { useGetNodeTypeDetail } from "../hooks/useNodeTypes";
import {
  normalizeExcelHeaders,
  useExcelSheets,
  usePreviewExcelHeaders
} from "../hooks/useExcelHeaders";
import {
  GOOGLE_DRIVE_TYPES,
  MASTER_DATA_FIELDS,
  POSTGRES_WRITE_MODES,
  findUpstreamExcelPreview,
  findUpstreamSourceConnection,
  requiresGoogleDriveFile,
  resolveConfigNodeType
} from "../lib/nodeConfig";
import type {
  HttpSourceNodeConfig,
  MasterDataCategory,
  NodeField,
  PostgresNodeConfig,
  TransformMapping,
  TransformMasterDataNodeConfig,
  TransformNodeConfig,
  TransformParseFileNodeConfig
} from "../types";

const inputClass =
  "w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500";
const labelClass = "text-xs font-medium text-gray-700";
const sectionTitleClass =
  "text-xs font-semibold uppercase tracking-wider text-gray-500";

function RequiredMark() {
  return <span className="text-red-500"> *</span>;
}

/* -------------------------------------------------------------------------- */
/*                            Source field select                             */
/* -------------------------------------------------------------------------- */

/**
 * Source-field picker for transform mapping rows. Fields already mapped by
 * another row are listed but disabled so the same column can't be mapped twice.
 */
function SourceFieldSelect({
  value,
  fields,
  isTaken,
  onChange
}: {
  value: string;
  fields: NodeField[];
  /** Whether a field is already mapped by another row. */
  isTaken: (fieldName: string) => boolean;
  onChange: (fieldName: string) => void;
}) {
  const hasFields = fields.length > 0;

  return (
    <FormSelect
      value={value}
      onChange={onChange}
      disabled={!hasFields}
      placeholder={
        hasFields ? "Select a source field..." : "No source fields available"
      }
      options={fields.map((f) => {
        const taken = isTaken(f.name);
        return {
          value: f.name,
          label: `${f.name} (${f.type})${taken ? " — used" : ""}`,
          disabled: taken
        };
      })}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Router                                    */
/* -------------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ConfigShape = Record<string, any>;

interface FieldsProps {
  config: ConfigShape;
  onChange: (patch: ConfigShape) => void;
  /** Id of the node on the canvas; undefined when filling a pre-drop draft. */
  nodeId?: string;
}

/**
 * Presentational config router. Shared by the ConfigPanel drawer (store-backed)
 * and the pre-drop NodeConfigDialog (local draft state).
 */
export function NodeConfigFields({
  nodeType,
  config,
  onChange,
  nodeId
}: {
  nodeType: string;
  config: ConfigShape;
  onChange: (patch: ConfigShape) => void;
  nodeId?: string;
}) {
  switch (resolveConfigNodeType(nodeType)) {
    case "http_source":
      return (
        <div className="space-y-4">
          <ConnectionSelector
            nodeType={nodeType}
            value={(config.connection_id as string) ?? ""}
            onChange={(id) => onChange({ connection_id: id })}
          />
          <HttpSourceFields
            nodeType={nodeType}
            config={config}
            onChange={onChange}
          />
        </div>
      );
    case "postgresql":
      return (
        <div className="space-y-4">
          <ConnectionSelector
            nodeType={nodeType}
            value={(config.connection_id as string) ?? ""}
            onChange={(id) => onChange({ connection_id: id })}
          />
          <PostgresFields config={config} onChange={onChange} />
        </div>
      );
    case "transform":
      return (
        <TransformFields nodeId={nodeId} config={config} onChange={onChange} />
      );
    case "transform_master_data":
      return (
        <TransformMasterDataFields
          nodeId={nodeId}
          config={config}
          onChange={onChange}
        />
      );
    case "transform_parse_file":
      return (
        <TransformParseFileFields
          nodeId={nodeId}
          config={config}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                             Connection selector                            */
/* -------------------------------------------------------------------------- */

/**
 * Required dropdown that binds a source/destination node to a saved connection
 * (secret) from /v1/secrets. The selected secret id is persisted on the node
 * config as `connection_id`.
 */
function ConnectionSelector({
  nodeType,
  value,
  onChange
}: {
  nodeType: string;
  value: string;
  onChange: (connectionId: string) => void;
}) {
  const { data, isLoading, isError } = useGetSecrets(nodeType);
  const [creating, setCreating] = useState(false);
  const secrets = data?.items ?? [];

  return (
    <div className="space-y-1.5">
      <label className={labelClass}>
        Connection
        <RequiredMark />
      </label>
      {isLoading ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading connections...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <FormSelect
              value={value}
              onChange={onChange}
              placeholder={
                secrets.length
                  ? "Select a connection..."
                  : "No connections available"
              }
              options={secrets.map((secret) => ({
                value: secret.id,
                label: secret.name
              }))}
            />
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            title="Create new connection"
            className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}
      {isError && (
        <p className="text-[11px] text-red-500">Failed to load connections.</p>
      )}
      <p className="text-[11px] text-gray-400">
        Choose a saved connection for this {nodeType} node, or create a new one.
      </p>

      {creating && (
        <CreateConnectionDialog
          nodeType={nodeType}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            onChange(id);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Modal that creates a new connection (secret) via POST /v1/secrets for the
 * given node type, then hands the new id back so it can be selected.
 */
function CreateConnectionDialog({
  nodeType,
  onClose,
  onCreated
}: {
  nodeType: string;
  onClose: () => void;
  onCreated: (connectionId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetNodeTypeDetail(nodeType);
  const createSecret = useCreateSecret();
  const connectionParams = useMemo(() => data?.connection_params ?? [], [data]);

  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  // Pre-fill any defaults provided by the node type.
  useEffect(() => {
    if (connectionParams.length === 0) return;
    setValues((prev) => {
      const next = { ...prev };
      for (const param of connectionParams) {
        if (next[param.name] === undefined && param.default != null) {
          next[param.name] = String(param.default);
        }
      }
      return next;
    });
  }, [connectionParams]);

  const canSave =
    connectionParams.length > 0 &&
    !!name.trim() &&
    connectionParams.every(
      (p) => !p.required || String(values[p.name] ?? "").trim()
    );

  const handleSave = async () => {
    if (!name.trim()) return;
    const res = await createSecret.mutateAsync({
      node_type: nodeType,
      name: name.trim(),
      values
    });
    await queryClient.invalidateQueries({
      queryKey: credentialKeys.secrets(nodeType)
    });
    const newId = res?.data?.id;
    if (newId) onCreated(newId);
    else onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            New Connection
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className={labelClass}>
                  Connection Name
                  <RequiredMark />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={`e.g. Production ${data?.name ?? nodeType}`}
                  className={inputClass}
                />
              </div>

              <div className="space-y-2">
                <p className={sectionTitleClass}>Connection Fields</p>
                {connectionParams.length === 0 ? (
                  <p className="text-[11px] text-gray-400">
                    This node type has no connection fields.
                  </p>
                ) : (
                  connectionParams.map((param) => (
                    <div key={param.name} className="space-y-1">
                      <label className={labelClass}>
                        {param.label || param.name}
                        {param.required && <RequiredMark />}
                      </label>
                      <div className="relative">
                        <input
                          type={
                            param.secret && !visible[param.name]
                              ? "password"
                              : "text"
                          }
                          value={values[param.name] ?? ""}
                          onChange={(e) =>
                            setValues((prev) => ({
                              ...prev,
                              [param.name]: e.target.value
                            }))
                          }
                          placeholder={
                            param.description || `Enter ${param.name}...`
                          }
                          className={`${inputClass} pr-9`}
                        />
                        {param.secret && (
                          <button
                            type="button"
                            onClick={() =>
                              setVisible((prev) => ({
                                ...prev,
                                [param.name]: !prev[param.name]
                              }))
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {visible[param.name] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || createSecret.isPending}
            className="flex items-center justify-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createSecret.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Create Connection
          </button>
        </div>
      </div>
    </div>
  );
}

/** Store-connected wrapper used inside the ConfigPanel drawer. */
export function NodeConfigForm({ nodeId }: { nodeId: string }) {
  const node = useWorkflowStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  if (!node) return null;

  return (
    <NodeConfigFields
      nodeId={nodeId}
      nodeType={node.data.nodeType as string}
      config={(node.config ?? {}) as ConfigShape}
      onChange={(patch) => updateNodeConfig(nodeId, patch)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                              HTTP source (generic)                         */
/* -------------------------------------------------------------------------- */

/**
 * Resource group + operation selectors for any HTTP source connector
 * (pipedrive, sharepoint, ...). The dropdown options are populated dynamically
 * from /v1/node-types/{name} so they always reflect what the backend exposes.
 */
function SiteSelector({
  connectionId,
  value,
  onChange
}: {
  connectionId: string;
  value: string;
  onChange: (siteId: string) => void;
}) {
  const { data, isLoading, isError } = useGetMicrosoftSites(connectionId);
  const sites = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading sites...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-1.5">
        <label className={labelClass}>
          Site
          <RequiredMark />
        </label>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          Could not load sites. Please make sure the Microsoft credential is
          valid and has permission to access SharePoint sites.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className={labelClass}>
        Site
        <RequiredMark />
      </label>
      <FormSelect
        value={value}
        onChange={onChange}
        placeholder={sites.length ? "Select a site..." : "No sites available"}
        options={sites.map((site) => ({
          value: site.id,
          label: site.display_name || site.name
        }))}
      />
    </div>
  );
}

function GoogleDriveFileSelector({
  connectionId,
  value,
  onChange
}: {
  connectionId: string;
  value: string;
  onChange: (fileId: string) => void;
}) {
  const { data, isLoading, isError } = useGetGoogleDriveFiles(connectionId);
  const files = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading files...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-1.5">
        <label className={labelClass}>
          File
          <RequiredMark />
        </label>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          Could not load files. Please make sure the Google credential is valid
          and has permission to access Google Drive.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className={labelClass}>
        File
        <RequiredMark />
      </label>
      <FormSelect
        value={value}
        onChange={onChange}
        placeholder={files.length ? "Select a file..." : "No files available"}
        options={files.map((file) => ({ value: file.id, label: file.name }))}
      />
    </div>
  );
}

function HttpSourceFields({
  nodeType,
  config: raw,
  onChange
}: FieldsProps & { nodeType: string }) {
  const config = raw as Partial<HttpSourceNodeConfig>;
  const { data, isLoading, isError } = useGetNodeTypeDetail(nodeType);

  const resourceGroup = config.resource_group ?? "";
  const resourceGroups = data ? Object.keys(data.resource_groups) : [];
  const operations =
    data && resourceGroup
      ? Object.keys(data.resource_groups[resourceGroup] ?? {})
      : [];
  const isSharePoint = nodeType.toLowerCase() === "sharepoint";
  const isGoogleDrive = GOOGLE_DRIVE_TYPES.has(nodeType.toLowerCase());
  const isFabricRti = nodeType.toLowerCase() === "fabric_rti";
  const connectionId = config.connection_id ?? "";
  // Any single-file operation needs a file_id (it's also what feeds the Excel
  // header preview downstream), not just get_file_metadata.
  const showGoogleDriveFile =
    isGoogleDrive &&
    !!connectionId &&
    requiresGoogleDriveFile(config.operation ?? "");
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading resources...
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-[11px] text-red-500">Failed to load resources.</p>
    );
  }

  // If the backend exposes no resource groups for this node type, there's
  // nothing to configure beyond the connection.
  if (resourceGroups.length === 0) {
    return (
      <p className="rounded-md bg-gray-50 p-2 text-[11px] text-gray-500">
        No resource groups available for this connector yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Operation */}
      <div className="space-y-2">
        <p className={sectionTitleClass}>Operation</p>

        <div className="space-y-1.5">
          <label className={labelClass}>
            Resource Group
            <RequiredMark />
          </label>
          <FormSelect
            value={resourceGroup}
            onChange={(next) =>
              onChange({
                resource_group: next,
                // Reset operation when the group changes.
                operation: ""
              })
            }
            placeholder="Select a resource group..."
            options={resourceGroups.map((g) => ({
              value: g,
              label: g.charAt(0).toUpperCase() + g.slice(1)
            }))}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            Operation
            <RequiredMark />
          </label>
          <FormSelect
            value={config.operation ?? ""}
            disabled={!resourceGroup}
            onChange={(next) => onChange({ operation: next })}
            placeholder={
              resourceGroup ? "Select operation..." : "Select a group first"
            }
            options={operations.map((op) => ({ value: op, label: op }))}
          />
          {resourceGroup && operations.length === 0 && (
            <p className="text-[11px] text-gray-400">
              No operations available for this resource group.
            </p>
          )}
        </div>

        {isFabricRti &&
          resourceGroup === "tables" &&
          config.operation === "get_table_data" && (
            <div className="space-y-1.5">
              <label htmlFor="fabric-rti-table-name" className={labelClass}>
                table_name
              </label>
              <input
                id="fabric-rti-table-name"
                name="table_name"
                type="text"
                value={config.table_name ?? ""}
                onChange={(e) => onChange({ table_name: e.target.value })}
                placeholder="Enter table name..."
                className={inputClass}
              />
            </div>
          )}

        {isFabricRti &&
          resourceGroup === "queries" &&
          config.operation === "execute_kql_query" && (
            <div className="space-y-1.5">
              <label htmlFor="fabric-rti-kql-query" className={labelClass}>
                kql_query
              </label>
              <textarea
                id="fabric-rti-kql-query"
                name="kql_query"
                value={config.kql_query ?? ""}
                onChange={(e) => onChange({ kql_query: e.target.value })}
                placeholder="Enter KQL query..."
                rows={4}
                className={inputClass}
              />
            </div>
          )}
      </div>

      {/* SharePoint site selector */}
      {isSharePoint && connectionId && (
        <SiteSelector
          connectionId={connectionId}
          value={config.site_id ?? ""}
          onChange={(siteId) => onChange({ site_id: siteId })}
        />
      )}

      {/* Google Drive file selector (only for get_file_metadata operation) */}
      {showGoogleDriveFile && (
        <GoogleDriveFileSelector
          connectionId={connectionId}
          value={config.file_id ?? ""}
          onChange={(fileId) => onChange({ file_id: fileId })}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Transform                                  */
/* -------------------------------------------------------------------------- */

const TRANSFORM_TYPES = ["string", "integer", "float", "boolean", "date"];

/** Map an API source field type to the closest transform type. */
function toTransformType(apiType: string): string {
  const t = apiType.toLowerCase();
  if (t === "integer" || t === "int") return "integer";
  if (t === "number" || t === "float" || t === "double" || t === "decimal")
    return "float";
  if (t === "boolean" || t === "bool") return "boolean";
  if (t === "date" || t === "datetime" || t === "timestamp" || t === "time")
    return "date";
  return "string";
}

function useTransformSourceFields(nodeId?: string) {
  const fieldInfo = useWorkflowStore((s) =>
    nodeId ? s.transformFields[nodeId] : undefined
  );
  const storeFieldsLoading = useWorkflowStore((s) => s.transformFieldsLoading);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const excelPayload = useMemo(
    () => (nodeId ? findUpstreamExcelPreview(nodeId, nodes, edges) : null),
    [nodeId, nodes, edges]
  );
  const excelPreview = usePreviewExcelHeaders(
    excelPayload
      ? {
          connection_id: excelPayload.connection_id,
          connector: excelPayload.connector,
          file_id: excelPayload.file_id,
          header_row: excelPayload.header_row,
          skip_rows: excelPayload.skip_rows,
          ...(excelPayload.sheet_name
            ? { sheet_name: excelPayload.sheet_name }
            : {})
        }
      : null
  );

  if (excelPayload) {
    return {
      sourceFields: normalizeExcelHeaders(excelPreview.data),
      sourceError: excelPreview.isError
        ? "Could not read the Excel headers. Check the upstream parse-excel node and source file."
        : null,
      fieldsLoading: excelPreview.isFetching
    };
  }

  return {
    sourceFields: fieldInfo?.fields ?? [],
    sourceError: fieldInfo?.error ?? null,
    fieldsLoading: storeFieldsLoading
  };
}

function TransformFields({ config: raw, onChange, nodeId }: FieldsProps) {
  const config = raw as Partial<TransformNodeConfig>;
  const mapping: TransformMapping[] = config.mapping ?? [];

  const { sourceFields, sourceError, fieldsLoading } =
    useTransformSourceFields(nodeId);
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const isSaving = useWorkflowStore((s) => s.isSaving);

  const setMapping = (next: TransformMapping[]) =>
    onChange({ type: "transform", mapping: next });

  const addRow = () =>
    setMapping([...mapping, { source: "", target: "", type: "string" }]);

  const updateRow = (
    index: number,
    field: keyof TransformMapping,
    value: string
  ) =>
    setMapping(
      mapping.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const removeRow = (index: number) =>
    setMapping(mapping.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={sectionTitleClass}>Field Mapping</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            type="button"
            onClick={() => saveWorkflow?.()}
            disabled={isSaving || !saveWorkflow}
            className="flex items-center gap-1.5 rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Transform
          </button>
        </div>
      </div>

      {sourceError && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          {sourceError}
        </p>
      )}
      {!sourceError && fieldsLoading && sourceFields.length === 0 && (
        <p className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-[11px] text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading source fields...
        </p>
      )}
      {!sourceError &&
        !fieldsLoading &&
        nodeId &&
        sourceFields.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-[11px] text-gray-400">
            No source fields available. Connect and configure an upstream source
            node to populate this list.
          </p>
        )}

      {mapping.length === 0 && (
        <p className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
          No mappings yet. Click &quot;Add&quot; to map a source field to a
          target field.
        </p>
      )}

      <div className="space-y-2">
        {mapping.map((row, i) => (
          <div
            key={i}
            className="space-y-2 rounded-md border border-gray-100 p-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-gray-400">
                Mapping {i + 1}
              </span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Source</label>
              <SourceFieldSelect
                value={row.source}
                fields={sourceFields}
                isTaken={(name) =>
                  mapping.some((r, idx) => idx !== i && r.source === name)
                }
                onChange={(name) => {
                  const selected = sourceFields.find((f) => f.name === name);
                  setMapping(
                    mapping.map((r, idx) =>
                      idx === i
                        ? {
                            ...r,
                            source: name,
                            type: selected
                              ? toTransformType(selected.type)
                              : r.type
                          }
                        : r
                    )
                  );
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Target</label>
              <input
                type="text"
                value={row.target}
                onChange={(e) => updateRow(i, "target", e.target.value)}
                placeholder="e.g. deal_id"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Type</label>
              <FormSelect
                value={row.type}
                onChange={(next) => updateRow(i, "type", next)}
                disabled
                options={TRANSFORM_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Transform Parse File                              */
/* -------------------------------------------------------------------------- */

/**
 * Config form for `transform_parse_file`. First asks the user to pick a file
 * type ("Excel" or "PDF"). When "Excel" is selected, the spreadsheet options
 * below (sheet, header row, skip rows) are shown; other types have no extra
 * options for now. The parsed column headers are surfaced downstream on the
 * transform_master_data node via POST
 * /v1/fabrix/executor/api-connector/preview-excel-headers.
 */
function TransformParseFileFields({
  config: raw,
  onChange,
  nodeId
}: FieldsProps) {
  const config = raw as Partial<TransformParseFileNodeConfig>;
  const fileType = config.file_type ?? "";
  const sheetName = config.sheet_name ?? "";
  const headerRow = config.header_row ?? 0;
  const skipRows = config.skip_rows ?? 0;

  // Resolve the upstream source node (e.g. Google Drive) so we can list the
  // spreadsheet's worksheets via POST /v1/fabrix/executor/file-connector/sheets.
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const upstreamSource = useMemo(
    () => (nodeId ? findUpstreamSourceConnection(nodeId, nodes, edges) : null),
    [nodeId, nodes, edges]
  );
  const sheetsQuery = useExcelSheets(
    upstreamSource?.connection_id && upstreamSource?.file_id
      ? {
          connection_id: upstreamSource.connection_id,
          file_id: upstreamSource.file_id
        }
      : null
  );
  const sheets: string[] = sheetsQuery.data?.data?.sheets ?? [];
  const sheetsLoading = sheetsQuery.isFetching;
  const sheetsError = sheetsQuery.isError;
  const hasUpstream =
    !!upstreamSource?.connection_id && !!upstreamSource?.file_id;

  const patch = (next: Partial<TransformParseFileNodeConfig>) =>
    onChange({
      type: "transform",
      file_type: fileType,
      sheet_name: sheetName,
      header_row: headerRow,
      skip_rows: skipRows,
      ...next
    });

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className={labelClass}>File Type</label>
        <FormSelect
          value={fileType}
          onChange={(next) => patch({ file_type: next as "excel" | "pdf" })}
          placeholder="Select a file type..."
          options={[
            { value: "excel", label: "Excel" },
            { value: "pdf", label: "PDF" }
          ]}
        />
      </div>

      {fileType === "excel" && (
        <>
          <p className={sectionTitleClass}>Excel Options</p>

          <div className="space-y-1.5">
            <label className={labelClass}>Sheet Name</label>
            {hasUpstream ? (
              <>
                <FormSelect
                  value={sheetName}
                  onChange={(next) => patch({ sheet_name: next })}
                  disabled={sheetsLoading}
                  placeholder={
                    sheetsLoading
                      ? "Loading sheets..."
                      : sheets.length === 0
                        ? "No sheets found"
                        : "Select a sheet..."
                  }
                  options={sheets.map((name) => ({ value: name, label: name }))}
                />
                {sheetsError && (
                  <p className="text-[11px] text-red-500">
                    Could not load sheets. Check the upstream source connection.
                  </p>
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => patch({ sheet_name: e.target.value })}
                  placeholder="Leave empty for the first sheet"
                  className={inputClass}
                />
                <p className="text-[11px] text-gray-400">
                  Connect an upstream source node (e.g. Google Drive) to pick a
                  sheet from the file.
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className={labelClass}>Header Row</label>
              <input
                type="number"
                min={0}
                value={headerRow}
                onChange={(e) =>
                  patch({ header_row: Number(e.target.value) || 0 })
                }
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Skip Rows</label>
              <input
                type="number"
                min={0}
                value={skipRows}
                onChange={(e) =>
                  patch({ skip_rows: Number(e.target.value) || 0 })
                }
                className={inputClass}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            Header row is the 0-based index of the row containing the column
            names. Skip rows are dropped after the header. The parsed columns
            become the source fields on the next transform node.
          </p>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Transform Master Data                             */
/* -------------------------------------------------------------------------- */

const MASTER_DATA_CATEGORIES: {
  value: MasterDataCategory;
  label: string;
}[] = [
  { value: "employee", label: "Employee" },
  { value: "equipment", label: "Equipment" },
  { value: "project", label: "Project" },
  { value: "rate_card", label: "Rate Card" },
  { value: "department", label: "Department" },
  { value: "role", label: "Role" },
  { value: "shift", label: "Shift" },
  { value: "project_type", label: "Project Type" }
];

function TransformMasterDataFields({
  config: raw,
  onChange,
  nodeId
}: FieldsProps) {
  const config = raw as Partial<TransformMasterDataNodeConfig>;
  const category = (config.category ?? "") as MasterDataCategory | "";
  const mapping: TransformMapping[] = config.mapping ?? [];

  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const isSaving = useWorkflowStore((s) => s.isSaving);

  // When the upstream chain includes a transform_parse_file node, the source
  // field list comes from POST preview-excel-headers (the spreadsheet's column
  // names) instead of the generic /workflow/transform-fields endpoint.
  const { sourceFields, sourceError, fieldsLoading } =
    useTransformSourceFields(nodeId);

  const targetFields = category ? MASTER_DATA_FIELDS[category] : [];

  const setCategory = (next: MasterDataCategory | "") => {
    if (next && next !== category) {
      const newTargets = MASTER_DATA_FIELDS[next];
      const newMapping = newTargets.map((field) => ({
        source: "",
        target: field.name,
        type: field.type
      }));
      onChange({ type: "transform", category: next, mapping: newMapping });
    } else {
      onChange({ type: "transform", category: next, mapping: [] });
    }
  };

  // Rows are driven by the static target definitions so fields removed from
  // MASTER_DATA_FIELDS stay hidden even for workflows saved before the change.
  const rows = targetFields.map((field) => ({
    field,
    row: mapping.find((m) => m.target === field.name)
  }));

  const updateSource = (target: string, value: string) => {
    const selected = sourceFields.find((f) => f.name === value);
    const def = targetFields.find((f) => f.name === target);
    const type = selected
      ? toTransformType(selected.type)
      : (mapping.find((m) => m.target === target)?.type ??
        def?.type ??
        "string");
    const next: TransformMapping[] = targetFields.map((field) => {
      const existing = mapping.find((m) => m.target === field.name);
      if (field.name === target) return { source: value, target, type };
      return existing ?? { source: "", target: field.name, type: field.type };
    });
    onChange({ type: "transform", category, mapping: next });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className={sectionTitleClass}>Master Data Transform</p>
        <button
          type="button"
          onClick={() => saveWorkflow?.()}
          disabled={isSaving || !saveWorkflow}
          className="flex items-center gap-1.5 rounded-md bg-primary-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Transform
        </button>
      </div>

      {/* Category selector */}
      <div className="space-y-1.5">
        <label className={labelClass}>
          Category
          <RequiredMark />
        </label>
        <FormSelect
          value={category}
          onChange={(next) => setCategory(next as MasterDataCategory | "")}
          placeholder="Select a category..."
          options={MASTER_DATA_CATEGORIES.map((cat) => ({
            value: cat.value,
            label: cat.label
          }))}
        />
      </div>

      {sourceError && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          {sourceError}
        </p>
      )}
      {!sourceError && fieldsLoading && sourceFields.length === 0 && (
        <p className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-[11px] text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading source fields...
        </p>
      )}
      {!sourceError &&
        !fieldsLoading &&
        nodeId &&
        sourceFields.length === 0 && (
          <p className="rounded-md border border-dashed border-gray-200 px-3 py-2 text-[11px] text-gray-400">
            No source fields available. Connect and configure an upstream source
            node to populate this list.
          </p>
        )}

      {!category && (
        <p className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
          Select a category to see the target field mapping.
        </p>
      )}

      {category && targetFields.length === 0 && (
        <p className="rounded-md border border-dashed border-gray-200 px-3 py-4 text-center text-xs text-gray-400">
          No target fields defined for &quot;{category}&quot; yet.
        </p>
      )}

      {category && targetFields.length > 0 && (
        <div className="space-y-2">
          {rows.map(({ field, row }) => (
            <div
              key={field.name}
              className="space-y-2 rounded-md border border-gray-100 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-400">
                  {field.name}
                  {field.required && <span className="text-red-500"> *</span>}
                </span>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Source</label>
                <SourceFieldSelect
                  value={row?.source ?? ""}
                  fields={sourceFields}
                  isTaken={(name) =>
                    mapping.some(
                      (r) => r.target !== field.name && r.source === name
                    )
                  }
                  onChange={(name) => updateSource(field.name, name)}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Target</label>
                <input
                  type="text"
                  value={field.name}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-50`}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Type</label>
                <input
                  type="text"
                  value={row?.type ?? field.type}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-50`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 PostgreSQL                                 */
/* -------------------------------------------------------------------------- */

function PostgresFields({ config: raw, onChange }: FieldsProps) {
  const config = raw as Partial<PostgresNodeConfig>;

  const isUpsert = (config.operation ?? "upsert") === "upsert";
  const uniqueColumns = config.unique_columns ?? [];

  return (
    <div className="space-y-4">
      {/* Destination */}
      <div className="space-y-2">
        <p className={sectionTitleClass}>Destination</p>
        <p className="text-[11px] text-gray-400">
          Configure how data is written to the destination table.
        </p>

        <div className="space-y-1.5">
          <label className={labelClass}>
            Table Name
            <RequiredMark />
          </label>
          <input
            type="text"
            value={config.table_name ?? ""}
            onChange={(e) =>
              onChange({
                type: "destination",
                connector: "postgresql",
                table_name: e.target.value
              })
            }
            placeholder="e.g. public.users_staging"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>
            Write Mode
            <RequiredMark />
          </label>
          <FormSelect
            value={config.operation ?? "upsert"}
            onChange={(next) =>
              onChange({
                operation: next as PostgresNodeConfig["operation"]
              })
            }
            options={POSTGRES_WRITE_MODES.map((m) => ({
              value: m.value,
              label: m.label
            }))}
          />
        </div>

        {isUpsert && (
          <div className="space-y-1.5">
            <label className={labelClass}>
              Unique Columns
              <RequiredMark />
            </label>
            <input
              type="text"
              value={uniqueColumns.join(", ")}
              onChange={(e) =>
                onChange({
                  unique_columns: e.target.value
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean)
                })
              }
              placeholder="e.g. id, email"
              className={inputClass}
            />
            <p className="text-[11px] text-gray-400">
              Comma-separated columns used to match existing rows for upsert
              operations.
            </p>
          </div>
        )}

        <p className="rounded-md bg-gray-50 p-2 text-[11px] text-gray-500">
          Upsert updates existing rows by matching the unique columns. Insert
          appends new rows. Truncate &amp; Insert clears the table before
          writing.
        </p>
      </div>
    </div>
  );
}

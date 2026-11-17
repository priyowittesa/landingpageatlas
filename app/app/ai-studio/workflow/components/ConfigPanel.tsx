"use client";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import { findNodeDefinition, borderColorMap } from "../lib/nodeRegistry";
import {
  ResourceGroupSelector,
  type SelectedOperations
} from "./ResourceGroupSelector";
import { NodeConfigForm } from "./NodeConfigForms";
import {
  findUpstreamMasterDataCategory,
  hasNodeConfigForm,
  parseNexaDataSources
} from "../lib/nodeConfig";

const categoryLabels: Record<string, string> = {
  data_source: "Data Source",
  data_transform: "Data Transform",
  ai: "Artificial Intelligence",
  logic: "Logic",
  utils: "Utils"
};

export function ConfigPanel() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const toggleNodeDisabled = useWorkflowStore((s) => s.toggleNodeDisabled);

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const node = nodes.find((n) => n.id === selectedNodeId);
  const nodeDefinitions = useWorkflowStore((s) => s.nodeDefinitions);

  if (!node) return null;

  const nodeType = node.data.nodeType as string;
  const def = findNodeDefinition(nodeType) ?? nodeDefinitions[nodeType];
  const color = borderColorMap[node.data.borderColor as string] ?? "#6b7280";

  const configFields = getConfigFields(nodeType);
  const hasDedicatedConfig = hasNodeConfigForm(nodeType);
  const isMasterData = nodeType.toLowerCase() === "master_data";
  const hasFixedTableUpsert =
    isMasterData || nodeType.toLowerCase() === "mongodb";
  const masterDataCategory = isMasterData
    ? findUpstreamMasterDataCategory(node.id, nodes, edges)
    : "";
  const masterDataTable =
    masterDataCategory === "employee" ? "labours" : masterDataCategory;

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-80 flex-col border-l border-gray-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Node Settings</h3>
        <button
          onClick={() => selectNode(null)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}1a` }}
          >
            <div
              className="h-5 w-5 rounded"
              style={{ backgroundColor: color }}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {node.data.label}
            </p>
            <p className="text-xs text-gray-500">
              {categoryLabels[node.data.category]}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Label</label>
          <input
            type="text"
            value={node.data.label}
            onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Status</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleNodeDisabled(node.id)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                node.data.status === "disabled"
                  ? "bg-gray-300"
                  : "bg-primary-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  node.data.status === "disabled"
                    ? "translate-x-1"
                    : "translate-x-6"
                )}
              />
            </button>
            <span className="text-sm text-gray-600">
              {node.data.status === "disabled" ? "Disabled" : "Enabled"}
            </span>
          </div>
        </div> */}

        {/* <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Runtime</label>
          <input
            type="text"
            value={node.data.runtime}
            onChange={(e) =>
              updateNodeData(node.id, { runtime: e.target.value })
            }
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div> */}

        {/* <div className="border-t border-gray-100 pt-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Configuration
          </h4>
          <div className="space-y-3">
            {configFields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={(node.data.config[field.key] as string) ?? ""}
                    onChange={(e) =>
                      updateNodeData(node.id, {
                        config: {
                          ...node.data.config,
                          [field.key]: e.target.value
                        }
                      })
                    }
                    rows={3}
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                ) : field.type === "select" ? (
                  <select
                    value={(node.data.config[field.key] as string) ?? ""}
                    onChange={(e) =>
                      updateNodeData(node.id, {
                        config: {
                          ...node.data.config,
                          [field.key]: e.target.value
                        }
                      })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={(node.data.config[field.key] as string) ?? ""}
                    onChange={(e) =>
                      updateNodeData(node.id, {
                        config: {
                          ...node.data.config,
                          [field.key]: e.target.value
                        }
                      })
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div> */}

        {hasDedicatedConfig && (
          <div className="border-t border-gray-100 pt-4">
            <NodeConfigForm nodeId={node.id} />
          </div>
        )}

        {!hasDedicatedConfig &&
          !findNodeDefinition(node.data.nodeType as string) &&
          nodeDefinitions[node.data.nodeType as string] && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Resources
              </h4>
              <ResourceGroupSelector
                key={node.id}
                nodeName={nodeType}
                nodeConfig={node.config as Record<string, unknown> | undefined}
                selectedOperations={
                  (node.data.config[
                    "selected_operations"
                  ] as SelectedOperations) ?? {}
                }
                fixedResourceGroup={hasFixedTableUpsert ? "tables" : undefined}
                fixedOperation={hasFixedTableUpsert ? "upsert" : undefined}
                fixedRequestParams={
                  isMasterData
                    ? { table: masterDataTable, schema_name: "master_data" }
                    : undefined
                }
                onChange={(selected) => {
                  updateNodeData(node.id, {
                    config: {
                      ...node.data.config,
                      selected_operations: selected
                    }
                  });
                  const params = selected.nexa_chat?.requestParams;
                  if (nodeType === "nexa_chat" && params)
                    updateNodeConfig(node.id, {
                      ...(typeof params.prompt === "string" && {
                        prompt: params.prompt
                      }),
                      ...(typeof params.project_id === "string" && {
                        project_id: params.project_id
                      }),
                      ...(params.data_sources !== undefined && {
                        data_sources: parseNexaDataSources(params.data_sources)
                      })
                    });
                }}
              />
            </div>
          )}

        {def?.description && (
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-500">{def.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
}

function getConfigFields(nodeType: string): ConfigField[] {
  switch (nodeType) {
    case "custom_api":
    case "buildsmart_api":
      return [
        { key: "url", label: "API URL", type: "text" },
        {
          key: "method",
          label: "Method",
          type: "select",
          options: ["GET", "POST", "PUT", "DELETE"]
        },
        { key: "headers", label: "Headers (JSON)", type: "textarea" }
      ];
    case "text_input":
      return [{ key: "value", label: "Default Value", type: "textarea" }];
    case "postgresql":
    case "sql_server":
    case "mysql":
      return [
        { key: "host", label: "Host", type: "text" },
        { key: "port", label: "Port", type: "text" },
        { key: "database", label: "Database", type: "text" },
        { key: "username", label: "Username", type: "text" },
        { key: "password", label: "Password", type: "text" }
      ];
    case "sql_query":
      return [{ key: "query", label: "SQL Query", type: "textarea" }];
    case "transform":
      return [{ key: "script", label: "Transform Script", type: "textarea" }];
    case "llm":
      return [
        {
          key: "model",
          label: "Model",
          type: "select",
          options: ["gpt-4", "gpt-3.5-turbo", "claude-3", "llama-3"]
        },
        { key: "prompt", label: "System Prompt", type: "textarea" },
        { key: "temperature", label: "Temperature", type: "text" }
      ];
    case "ai_agent":
      return [
        { key: "agent_name", label: "Agent Name", type: "text" },
        { key: "instructions", label: "Instructions", type: "textarea" }
      ];
    case "if_else":
      return [{ key: "condition", label: "Condition", type: "text" }];
    case "google_drive":
    case "onedrive":
    case "sharepoint":
      return [
        { key: "folder", label: "Folder Path", type: "text" },
        { key: "file_type", label: "File Type Filter", type: "text" }
      ];
    case "audio_to_text":
      return [{ key: "language", label: "Language", type: "text" }];
    case "join_table":
      return [
        {
          key: "join_type",
          label: "Join Type",
          type: "select",
          options: ["inner", "left", "right", "full"]
        },
        { key: "join_key", label: "Join Key", type: "text" }
      ];
    case "sticky_notes":
      return [{ key: "content", label: "Note Content", type: "textarea" }];
    default:
      return [];
  }
}

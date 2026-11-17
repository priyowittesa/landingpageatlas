import type { WorkflowNode, WorkflowEdge, WorkflowCanvas, PersistedWorkflowCanvas, PersistedWorkflowNode } from "../types";
import { getNodeRoleByType, defaultNodeConfig, parseNexaDataSources } from "./nodeConfig";
import { findNodeDefinition } from "./nodeRegistry";

/**
 * Backend-facing node shape. The `type` here is the node's *role*
 * ("source" | "transform" | "destination") resolved from `config.type`, NOT
 * the React Flow renderer type ("customNode"). The specific connector
 * identity (pipedrive, postgresql, master_data category, ...) is carried in
 * `config` alongside `type`.
 *
 * Notably a `transform_master_data` node serializes to `type: "transform"`
 * with the master-data distinction kept in `config.category`, and a
 * `master_data` (destination) node serializes to `type: "destination"`.
 */
export interface SerializedNode {
  id: string;
  type: string;
  config: Record<string, unknown>;
}

export interface SerializedEdge {
  id: string;
  source: string;
  target: string;
}

export interface SerializedCanvas {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
}

/**
 * Resolve the backend `type` for a node. Prefers `config.type` (the persisted
 * role), then falls back to the role resolved from `data.nodeType` (so e.g. a
 * `master_data` node without an explicit config still serializes as
 * `"destination"`), and finally to the raw `data.nodeType` so unknown nodes
 * are passed through rather than dropped.
 */
function resolveNodeType(node: WorkflowNode): string {
  if (node.data.nodeType === "nexa_chat") return "nexa_chat";

  const configType = (node.config as { type?: string } | undefined)?.type;
  if (configType) return configType;

  const role = getNodeRoleByType((node.data.nodeType as string) ?? "");
  if (role !== "other") return role;

  return (node.data.nodeType as string) ?? node.type ?? "";
}

function resolveNexaNodeData(node: WorkflowNode): WorkflowNode["data"] {
  if (node.data.nodeType !== "nexa_chat") return node.data;
  const operations = node.data.config.selected_operations as Record<
    string,
    { requestParams?: Record<string, unknown> }
  > | undefined;
  const selection = operations?.nexa_chat;
  if (
    !selection?.requestParams ||
    !Object.hasOwn(selection.requestParams, "data_sources")
  )
    return node.data;
  return {
    ...node.data,
    config: {
      ...node.data.config,
      selected_operations: {
        ...operations,
        nexa_chat: {
          ...selection,
          requestParams: {
            ...selection.requestParams,
            data_sources: parseNexaDataSources(
              selection.requestParams.data_sources
            )
          }
        }
      }
    }
  };
}

function resolveNodeConfig(node: WorkflowNode): Record<string, unknown> {
  const config = (node.config ?? {}) as Record<string, unknown>;
  if (node.data.nodeType !== "nexa_chat") return config;
  const selected = (node.data.config.selected_operations as Record<
    string,
    { requestParams?: Record<string, unknown> }
  > | undefined)?.nexa_chat;
  return {
    ...config,
    type: "nexa_chat",
    ...(typeof selected?.requestParams?.prompt === "string" && {
      prompt: selected.requestParams.prompt
    }),
    ...(typeof selected?.requestParams?.project_id === "string" && {
      project_id: selected.requestParams.project_id
    }),
    data_sources: parseNexaDataSources(
      selected?.requestParams?.data_sources ?? config.data_sources
    )
  };
}

/**
 * Strip React Flow internals (position, selected, dragging, dimensions, the
 * renderer `type`, UI-only `data` fields) and produce the minimal shape the
 * backend expects for /workflow/transform-fields and similar computation
 * endpoints.
 */
export function serializeCanvas(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): SerializedCanvas {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: resolveNodeType(n),
      config: resolveNodeConfig(n),
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    })),
  };
}

/**
 * Serialize the canvas for PUT/POST /workflow/{id}. Unlike `serializeCanvas`
 * (which strips everything but {id, type, config} for computation endpoints),
 * this preserves the full React Flow node shape (position, data, measured, ...)
 * so the backend can store and round-trip the visual layout — but overrides the
 * renderer `type` ("customNode") with the backend role
 * ("source" | "transform" | "destination") so the payload passes backend
 * validation. Edges are kept as-is.
 */
export function serializeCanvasForSave(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): PersistedWorkflowCanvas {
  return {
    nodes: nodes.map((n) => ({
      ...n,
      type: resolveNodeType(n),
      ...(n.data.nodeType === "nexa_chat" && {
        config: resolveNodeConfig(n),
        data: resolveNexaNodeData(n)
      }),
    })),
    edges: edges.map((e) => ({ ...e })),
  };
}

/**
 * Hydrate a canvas loaded from the backend back into React Flow rendering
 * shape. The backend stores nodes with `type` = role ("source" | "transform" |
 * "destination"); React Flow needs `type` = "customNode" to render via the
 * CustomNode component. This restores the renderer type while leaving all other
 * fields (position, data, config, ...) untouched.
 *
 * If a node comes back in the minimal serialized shape ({id, type, config}
 * with no position/data), it is reconstructed from the node registry using the
 * connector identity in `config` so the canvas still renders.
 */
export function hydrateLoadedCanvas(
  canvas: PersistedWorkflowCanvas | null | undefined
): WorkflowCanvas {
  if (!canvas) return { nodes: [], edges: [] };

  return {
    nodes: (canvas.nodes ?? []).map((n: PersistedWorkflowNode | WorkflowNode) => {
      // Already in React Flow shape (e.g. legacy data with type "customNode").
      if (n.type === "customNode") return n as WorkflowNode;

      // Minimal serialized shape — reconstruct the React Flow wrapper.
      if (!n.data || !n.position) {
        const config = (n.config ?? {}) as Record<string, unknown>;
        const connector = (config.connector as string) ?? "";
        const category = (config.category as string) ?? "";
        // Resolve the FE nodeType from the backend config.
        const nodeType =
          n.type === "destination" && category
            ? "master_data"
            : n.type === "transform" && category
              ? "transform_master_data"
              : connector || (n.data?.nodeType as string) ||
              (n.type === "nexa_chat" ? "nexa_chat" : "");
        const def = findNodeDefinition(nodeType);
        return {
          id: n.id,
          type: "customNode" as const,
          position: n.position ?? { x: 0, y: 0 },
          data: {
            label: (n.data?.label as string) ?? def?.label ?? nodeType,
            category: (n.data?.category as string) ?? def?.category ?? "data_source",
            status: (n.data?.status as string) ?? "active",
            runtime: (n.data?.runtime as string) ?? "0.0s",
            config: (n.data?.config as Record<string, unknown>) ?? {},
            nodeType: (n.data?.nodeType as string) ?? nodeType,
            borderColor: (n.data?.borderColor as string) ?? def?.borderColor ?? "blue",
            icon: (n.data?.icon as string) ?? def?.icon ?? "Database",
          },
          config: n.config ?? defaultNodeConfig(nodeType),
        } as WorkflowNode;
      }

      // Full shape with backend role type — just restore the renderer type.
      return { ...n, type: "customNode" as const } as WorkflowNode;
    }),
    edges: (canvas.edges ?? []).map((e) => ({
      ...e,
      type: e.type ?? "smoothstep",
      animated: e.animated ?? true,
    })),
  };
}

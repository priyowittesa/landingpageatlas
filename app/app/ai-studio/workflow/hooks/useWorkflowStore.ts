import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "@xyflow/react";

import type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  NodeDefinition,
  NodeConfig,
  TransformFieldInfo,
} from "../types";
import { findNodeDefinition } from "../lib/nodeRegistry";
import { defaultNodeConfig, getNodeRole } from "../lib/nodeConfig";

/** Generate a reasonably-unique id for a node or edge. */
function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Build a canvas node from a node type, optionally seeding its config. */
function buildNode(
  nodeType: string,
  position: { x: number; y: number },
  defs: Record<string, NodeDefinition>,
  config?: NodeConfig
): WorkflowNode | null {
  const def = findNodeDefinition(nodeType) ?? defs[nodeType];
  if (!def) return null;

  return {
    id: genId("node"),
    type: "customNode",
    position,
    data: {
      label: def.label,
      category: def.category,
      status: "active",
      runtime: "0.0s",
      config: def.defaultConfig ?? {},
      nodeType,
      borderColor: def.borderColor,
      icon: def.icon,
    },
    config: config ?? defaultNodeConfig(nodeType),
  };
}

interface WorkflowStore {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodeId: string | null;
  workflowStatus: "draft" | "published";
  validationErrors: string[];
  nodeDefinitions: Record<string, NodeDefinition>;
  /** Source fields available per transform node id (from /workflow/transform-fields). */
  transformFields: Record<string, TransformFieldInfo>;
  /** Whether the transform-fields request is in flight. */
  transformFieldsLoading: boolean;

  onNodesChange: OnNodesChange<WorkflowNode>;
  onEdgesChange: OnEdgesChange<WorkflowEdge>;
  onConnect: OnConnect;

  addNode: (
    nodeType: string,
    position: { x: number; y: number },
    config?: NodeConfig
  ) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  toggleNodeDisabled: (id: string) => void;
  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => void;
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void;
  selectNode: (id: string | null) => void;
  setNodeDefinitions: (defs: Record<string, NodeDefinition>) => void;
  setTransformFields: (fields: Record<string, TransformFieldInfo>) => void;
  setTransformFieldsLoading: (loading: boolean) => void;

  /** Save handler registered by WorkflowBuilder so other components can trigger a save. */
  saveWorkflow: (() => void) | null;
  isSaving: boolean;
  setSaveWorkflow: (fn: (() => void) | null) => void;
  setIsSaving: (saving: boolean) => void;

  /** Load a persisted canvas into the store (e.g. from the API). */
  setCanvas: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  /** Clear the canvas, used when switching workflows. */
  reset: () => void;
  publish: () => void;
  setValidationErrors: (errors: string[]) => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowStatus: "draft",
  validationErrors: [],
  nodeDefinitions: {},
  transformFields: {},
  transformFieldsLoading: false,
  saveWorkflow: null,
  isSaving: false,

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges) as WorkflowEdge[],
    });
  },

  onConnect: (connection: Connection) => {
    const { source, target } = connection;
    const nodes = get().nodes;
    const src = nodes.find((n) => n.id === source);
    const tgt = nodes.find((n) => n.id === target);

    // Enforce the pipeline rule: a Source node cannot connect directly to a
    // Destination node. Auto-insert a Transform node between them so the shape
    // is always Source -> Transform -> Destination.
    if (
      src &&
      tgt &&
      source &&
      target &&
      getNodeRole(src) === "source" &&
      getNodeRole(tgt) === "destination"
    ) {
      const transformNodeType =
        (tgt.data.nodeType as string) === "master_data"
          ? "transform_master_data"
          : "transform";
      const transform = buildNode(
        transformNodeType,
        {
          x: (src.position.x + tgt.position.x) / 2,
          y: (src.position.y + tgt.position.y) / 2,
        },
        get().nodeDefinitions
      );

      if (transform) {
        const edgeBase = { type: "smoothstep", animated: true } as const;
        set({
          nodes: [...nodes, transform],
          edges: [
            ...get().edges,
            { id: genId("edge"), source, target: transform.id, ...edgeBase },
            { id: genId("edge"), source: transform.id, target, ...edgeBase },
          ],
          selectedNodeId: transform.id,
        });
        return;
      }
    }

    set({
      edges: addEdge(
        { ...connection, type: "smoothstep", animated: true },
        get().edges
      ),
    });
  },

  addNode: (
    nodeType: string,
    position: { x: number; y: number },
    config?: NodeConfig
  ) => {
    const newNode = buildNode(
      nodeType,
      position,
      get().nodeDefinitions,
      config
    );
    if (!newNode) return;

    set({ nodes: [...get().nodes, newNode] });
  },

  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
    });
  },

  duplicateNode: (id: string) => {
    const node = get().nodes.find((n) => n.id === id);
    if (!node) return;

    const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newNode: WorkflowNode = {
      ...node,
      id: newId,
      position: {
        x: node.position.x + 40,
        y: node.position.y + 40,
      },
      data: { ...node.data },
      selected: false,
    };

    set({ nodes: [...get().nodes, newNode] });
  },

  toggleNodeDisabled: (id: string) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? {
            ...n,
            data: {
              ...n.data,
              status: n.data.status === "disabled" ? "active" : "disabled",
            },
          }
          : n
      ),
    });
  },

  updateNodeData: (id: string, data: Partial<WorkflowNodeData>) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data } } : n
      ),
    });
  },

  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id
          ? ({
            ...n,
            config: { ...(n.config ?? {}), ...config } as NodeConfig,
          } as WorkflowNode)
          : n
      ),
    });
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  setNodeDefinitions: (defs) => {
    set({ nodeDefinitions: defs });
  },

  setTransformFields: (fields) => {
    set({ transformFields: fields });
  },

  setTransformFieldsLoading: (loading) => {
    set({ transformFieldsLoading: loading });
  },

  setSaveWorkflow: (fn) => {
    set({ saveWorkflow: fn });
  },

  setIsSaving: (saving) => {
    set({ isSaving: saving });
  },

  setCanvas: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
    set({ nodes, edges, selectedNodeId: null, validationErrors: [] });
  },

  reset: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      workflowStatus: "draft",
      validationErrors: [],
      transformFields: {},
      transformFieldsLoading: false,
    });
  },

  publish: () => {
    set({ workflowStatus: "published" });
  },

  setValidationErrors: (errors: string[]) => {
    set({ validationErrors: errors });
  },
}));

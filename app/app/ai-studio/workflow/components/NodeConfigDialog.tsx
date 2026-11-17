"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

import { useWorkflowStore } from "../hooks/useWorkflowStore";
import { useGetNodeTypeDetail } from "../hooks/useNodeTypes";
import { findNodeDefinition, borderColorMap } from "../lib/nodeRegistry";
import { defaultNodeConfig, validateNodeConfig } from "../lib/nodeConfig";
import { NodeConfigFields } from "./NodeConfigForms";
import type { NodeConfig } from "../types";

/**
 * Blocking modal shown when a Source/Destination node is dropped onto the
 * canvas. The node is only created once all required config fields are valid,
 * enforcing that no incomplete node ever reaches the canvas or the BE payload.
 */
export function NodeConfigDialog({
  nodeType,
  onConfirm,
  onCancel
}: {
  nodeType: string;
  onConfirm: (config: NodeConfig) => void;
  onCancel: () => void;
}) {
  const nodeDefinitions = useWorkflowStore((s) => s.nodeDefinitions);
  const def = findNodeDefinition(nodeType) ?? nodeDefinitions[nodeType];
  const color = borderColorMap[def?.borderColor ?? "gray"] ?? "#6b7280";

  // Fetch the node type detail so validation knows whether resource groups
  // exist for this connector (e.g. pipedrive has them, onedrive may not yet).
  const { data: nodeTypeDetail } = useGetNodeTypeDetail(nodeType);

  const [config, setConfig] = useState<Record<string, unknown>>(
    () => (defaultNodeConfig(nodeType) as Record<string, unknown>) ?? {}
  );

  const errors = validateNodeConfig(nodeType, config, nodeTypeDetail);
  const isValid = errors.length === 0;

  const onChange = (patch: Record<string, unknown>) =>
    setConfig((prev) => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}1a` }}
            >
              <Plus className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Configure {def?.label ?? nodeType}
              </h3>
              <p className="text-xs text-gray-500">
                Complete required fields to add this node.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          <NodeConfigFields
            nodeType={nodeType}
            config={config}
            onChange={onChange}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-400">
            {isValid
              ? "All required fields completed."
              : `${errors.length} field(s) required`}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(config as NodeConfig)}
              disabled={!isValid}
              className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

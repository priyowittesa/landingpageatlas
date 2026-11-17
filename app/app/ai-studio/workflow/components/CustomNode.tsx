"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  X,
  SquareSlash,
  SquareDashed,
  Clock,
  Type,
  File,
  Braces,
  Globe,
  Cloud,
  AudioLines,
  Image as ImageIcon,
  HardDrive,
  Database,
  Combine,
  Terminal,
  Wrench,
  Table,
  Bot,
  BrainCircuit,
  GitBranch,
  StickyNote
} from "lucide-react";

import { cn } from "@/lib/utils";
import { borderColorMap } from "../lib/nodeRegistry";
import { getNodeRoleByType } from "../lib/nodeConfig";
import { useWorkflowStore } from "../hooks/useWorkflowStore";
import type { NodeStatus, WorkflowNode } from "../types";

const iconMap: Record<
  string,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  Type,
  File,
  Braces,
  Globe,
  Cloud,
  AudioLines,
  Image: ImageIcon,
  HardDrive,
  Database,
  Combine,
  Terminal,
  Wrench,
  Table,
  Bot,
  BrainCircuit,
  GitBranch,
  StickyNote
};

/** Pill colours per status, matching the Figma node header. */
const statusStyles: Record<NodeStatus, string> = {
  active: "bg-[#17b26a] text-white",
  inactive: "bg-[#98a2b3] text-white",
  disabled: "bg-white/15 text-white/70",
  error: "bg-[#f04438] text-white"
};

/** Small caption under the node name, derived from the node's pipeline role. */
const roleLabels: Record<string, string> = {
  source: "Source",
  transform: "Transform",
  destination: "Store"
};

const handleClass =
  "h-3! w-3! border-2! border-white! bg-[#5b5bd6]! shadow-[0_0_0_1px_rgba(91,91,214,0.25)]!";

function CustomNodeComponent({ id, data, selected }: NodeProps<WorkflowNode>) {
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode);
  const toggleNodeDisabled = useWorkflowStore((s) => s.toggleNodeDisabled);

  const accentColor =
    borderColorMap[(data.borderColor as string) ?? "gray"] ?? "#6b7280";
  const Icon = iconMap[data.icon as string] ?? Database;
  const status = (data.status as NodeStatus) ?? "inactive";
  const isDisabled = status === "disabled";
  const subtitle =
    (data.subtitle as string | undefined) ??
    roleLabels[getNodeRoleByType((data.nodeType as string) ?? "")];

  return (
    <div
      className={cn(
        "relative w-[240px] rounded-[10px] border border-[#cbdef8] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition-all",
        isDisabled && "opacity-60",
        selected && "border-[#5b5bd6] shadow-[0_0_0_2px_rgba(91,91,214,0.35)]"
      )}
    >
      <Handle type="target" position={Position.Left} className={handleClass} />
      <Handle type="target" position={Position.Top} className={handleClass} />

      {/* Clipping wrapper: keeps rounded corners without cutting the handles,
          which are positioned outside the card's bounds. */}
      <div className="overflow-hidden rounded-[9px]">
        {/* Header: status pill + node actions */}
        <div className="flex items-center justify-between gap-2 bg-[#0b0b0f] px-3 py-2">
          <span
            className={cn(
              "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize leading-tight",
              statusStyles[status]
            )}
          >
            {status}
          </span>

          <div className="flex shrink-0 items-center gap-1.5 text-white/80">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeDisabled(id);
              }}
              className="rounded p-0.5 transition-colors hover:text-white"
              title={isDisabled ? "Enable" : "Disable"}
            >
              <SquareSlash className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateNode(id);
              }}
              className="rounded p-0.5 transition-colors hover:text-white"
              title="Duplicate"
            >
              <SquareDashed className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(id);
              }}
              className="rounded p-0.5 transition-colors hover:text-[#f97066]"
              title="Delete"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body: connector icon + name + role */}
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e4e7ec] bg-white">
            <Icon
              className="h-[18px] w-[18px]"
              style={{ color: accentColor }}
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span
              className="truncate text-[15px] font-semibold leading-tight text-[#101828]"
              title={data.label}
            >
              {data.label}
            </span>
            {subtitle && (
              <span className="truncate text-xs leading-tight text-[#667085]">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Footer: runtime */}
        <div className="flex items-center gap-1.5 border-t border-[#e2edfb] bg-[#f2f7fe] px-3 py-2 text-[#2563eb]">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span className="text-xs font-medium">{data.runtime}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className={handleClass} />
      <Handle
        type="source"
        position={Position.Bottom}
        className={handleClass}
      />
    </div>
  );
}

export const CustomNode = memo(CustomNodeComponent);

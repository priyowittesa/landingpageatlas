"use client";

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { Clock, Plug, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "../../components/Tr";
import type { FlowStep } from "../data";
import { FLOW_ICONS, ROLE_STYLE, STEP_STATE, type StepState } from "./flow-style";

export type FlowNodeData = {
  step: FlowStep;
  state: StepState;
  connectionName?: string;
  connectionActive?: boolean;
};

export type FlowNodeType = Node<FlowNodeData, "flowStep">;

const HANDLE = "!h-2.5 !w-2.5 !border-2 !border-white !bg-primary-500";

/** One step on the canvas, after the AI Studio node card: role, state, connector and runtime. */
function FlowNodeComponent({ data, selected }: NodeProps<FlowNodeType>) {
  const t = useT();
  const { step, state, connectionName, connectionActive } = data;
  const role = ROLE_STYLE[step.role];
  const status = STEP_STATE[state];
  const Icon = FLOW_ICONS[step.icon];

  return (
    <div
      className={cn(
        "w-[240px] rounded-xl border bg-white shadow-sm transition-shadow",
        selected ? "border-primary-500 ring-2 ring-primary-200" : "border-gray-200 hover:shadow-md",
        state === "running" && "ring-2 ring-primary-300",
        state === "skipped" && "opacity-70"
      )}
    >
      <Handle type="target" position={Position.Left} className={HANDLE} />
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-gray-600">
          <span aria-hidden className={cn("h-2 w-2 rounded-full", role.bar)} />
          {t(role.label)}
        </span>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", status.pill)}>
          <status.Icon size={12} aria-hidden className={state === "running" ? "animate-spin" : undefined} />
          {t(status.label)}
        </span>
      </div>
      <div className="flex items-start gap-3 px-3 py-3">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", role.tile)}>
          <Icon size={16} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-950" title={step.label}>
            {step.label}
          </span>
          <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{step.detail}</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 rounded-b-xl border-t border-primary-100/70 bg-primary-50/60 px-3 py-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 font-medium text-primary-800">
          <Clock size={12} aria-hidden />
          {step.runtime}
        </span>
        {connectionName && (
          <span
            className={cn(
              "inline-flex min-w-0 items-center gap-1 truncate",
              connectionActive === false ? "font-semibold text-red-700" : "text-gray-700"
            )}
            title={connectionName}
          >
            {connectionActive === false ? <PlugZap size={12} aria-hidden /> : <Plug size={12} aria-hidden />}
            <span className="truncate">
              {connectionActive === false ? `${t("Inactive")}: ${connectionName}` : connectionName}
            </span>
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className={HANDLE} />
    </div>
  );
}

export const FlowNode = memo(FlowNodeComponent);

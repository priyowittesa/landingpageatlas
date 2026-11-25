"use client";

import "@xyflow/react/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useNodesState,
  type Edge
} from "@xyflow/react";
import {
  CalendarClock,
  Folder,
  Play,
  PlugZap,
  RotateCcw,
  ScrollText,
  Search,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate } from "../../format";
import { StatusBadge, type StatusTone } from "../../components/StatusBadge";
import { useT } from "../../components/Tr";
import { useConnectionsStore } from "../../store/connections-store";
import type { MasterConnection, Workflow, WorkflowFolder } from "../data";
import { getRunOutcome, getWorkflowsAtRisk, simulateRun, type RunOutcome, type StepResult } from "../logic";
import { FLOW_ICONS, ROLE_STYLE, STEP_STATE, type StepState } from "./flow-style";
import { FlowNode, type FlowNodeType } from "./FlowNode";

const NODE_TYPES = { flowStep: FlowNode };
const STEP_DELAY_MS = 650;

const OUTCOME: Record<RunOutcome, { tone: StatusTone; label: string }> = {
  success: { tone: "good", label: "Last run OK" },
  warning: { tone: "watch", label: "Last run with warnings" },
  failed: { tone: "bad", label: "Last run failed" }
};

type WorkflowStudioProps = {
  folders: WorkflowFolder[];
  workflows: Workflow[];
  connections: MasterConnection[];
};

type RunState = {
  states: Record<string, StepState>;
  log: StepResult[];
  running: boolean;
  outcome: RunOutcome | null;
};

const IDLE_RUN: RunState = { states: {}, log: [], running: false, outcome: null };

/** Workflow Studio of the demo: folders of workflows, the canvas, step details and a simulated run. */
export function WorkflowStudio({ folders, workflows, connections }: WorkflowStudioProps) {
  const t = useT();
  const active = useConnectionsStore((state) => state.active);
  const [workflowId, setWorkflowId] = useState(workflows[0].id);
  const [stepId, setStepId] = useState<string | null>(workflows[0].steps[0].id);
  const [query, setQuery] = useState("");
  const [run, setRun] = useState<RunState>(IDLE_RUN);
  const timers = useRef<number[]>([]);

  const workflow = workflows.find((item) => item.id === workflowId) ?? workflows[0];
  const atRisk = useMemo(() => new Set(getWorkflowsAtRisk(workflows, active).map((item) => item.id)), [workflows, active]);
  const step = workflow.steps.find((item) => item.id === stepId) ?? null;
  const connectionOf = (id?: string) => connections.find((connection) => connection.id === id);

  const needle = query.trim().toLowerCase();
  const visible = workflows.filter(
    (item) => !needle || `${item.name} ${item.description}`.toLowerCase().includes(needle)
  );

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  useEffect(() => clearTimers, []);

  const open = (next: Workflow) => {
    clearTimers();
    setRun(IDLE_RUN);
    setWorkflowId(next.id);
    setStepId(next.steps[0].id);
  };

  const start = () => {
    clearTimers();
    const results = simulateRun(workflow, active, connections);
    setRun({ states: {}, log: [], running: true, outcome: null });
    results.forEach((result, index) => {
      timers.current.push(
        window.setTimeout(() => {
          setRun((current) => ({ ...current, states: { ...current.states, [result.stepId]: "running" } }));
        }, index * STEP_DELAY_MS),
        window.setTimeout(() => {
          setRun((current) => ({
            ...current,
            states: { ...current.states, [result.stepId]: result.status },
            log: [...current.log, result],
            running: index < results.length - 1,
            outcome: index === results.length - 1 ? getRunOutcome(results) : null
          }));
        }, index * STEP_DELAY_MS + STEP_DELAY_MS * 0.8)
      );
    });
  };

  const lastOutcome = OUTCOME[run.outcome ?? workflow.lastRunStatus];
  const riskStep = workflow.steps.find((item) => item.connectionId && active[item.connectionId] === false);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="ptepi-card flex flex-col overflow-hidden" aria-label={t("Workflows")}>
        <div className="border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-4 py-4">
          <h2 className="text-base font-semibold">{t("Workflows")}</h2>
          <div className="relative mt-3">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("Search workflow")}
              aria-label={t("Search workflow")}
              className="h-9 bg-white pl-9"
            />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-3">
          {folders.map((folder) => {
            const items = visible.filter((item) => item.folderId === folder.id);
            if (items.length === 0) return null;
            return (
              <div key={folder.id}>
                <p className="flex items-center gap-1.5 px-2 pb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <Folder size={14} aria-hidden className="text-primary-600" />
                  {t(folder.name)}
                  <span className="ml-auto rounded-full bg-gray-100 px-1.5 text-[10px] tabular-nums text-gray-700">{items.length}</span>
                </p>
                <ul className="space-y-1">
                  {items.map((item) => {
                    const selected = item.id === workflow.id;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => open(item)}
                          aria-current={selected ? "true" : undefined}
                          className={cn(
                            "w-full cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors",
                            selected
                              ? "border-primary-300 bg-primary-50"
                              : "border-transparent hover:border-primary-100 hover:bg-primary-50/50"
                          )}
                        >
                          <span className="block text-sm font-semibold leading-snug text-gray-950">{item.name}</span>
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                            <CalendarClock size={12} aria-hidden />
                            {item.schedule}
                          </span>
                          {atRisk.has(item.id) && (
                            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                              <PlugZap size={12} aria-hidden />
                              {t("Inactive connection")}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          {visible.length === 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="w-full cursor-pointer rounded-lg border border-dashed border-primary-200 px-3 py-4 text-sm text-primary-800"
            >
              {t("No workflow matches. Show all workflows")}
            </button>
          )}
        </div>
      </aside>

      <section className="ptepi-card min-w-0 overflow-hidden" aria-label={workflow.name}>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-6 py-5">
          <div className="min-w-0 max-w-2xl">
            <h2 className="text-lg font-semibold text-gray-950">{workflow.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{workflow.description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-700">
              <span className="inline-flex items-center gap-1"><CalendarClock size={14} aria-hidden />{workflow.schedule}</span>
              <span className="inline-flex items-center gap-1"><UserRound size={14} aria-hidden />{workflow.owner}</span>
              <span>{t("Last run")}: {formatDate(workflow.lastRun)}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={lastOutcome.tone} label={lastOutcome.label} />
            {run.outcome && (
              <Button variant="outline" size="sm" onClick={() => { clearTimers(); setRun(IDLE_RUN); }}>
                <RotateCcw size={16} aria-hidden />
                {t("Reset")}
              </Button>
            )}
            <Button size="sm" onClick={start} disabled={run.running} className="bg-primary-700 hover:bg-primary-800">
              <Play size={16} aria-hidden />
              {run.running ? t("Running") : t("Run now")}
            </Button>
          </div>
        </div>

        {riskStep && (
          <div className="flex flex-wrap items-center gap-2 border-b border-red-100 bg-red-50/70 px-6 py-2.5 text-sm text-red-800" role="status">
            <PlugZap size={16} aria-hidden />
            <span>
              {t("Inactive connection")}: <strong>{connectionOf(riskStep.connectionId)?.name}</strong>. {t("The run stops at")} “{riskStep.label}”.
            </span>
            <Link href="/ptepi/connections" className="ml-auto font-semibold underline underline-offset-2 hover:text-red-900">
              {t("Open Master Connections")}
            </Link>
          </div>
        )}

        <FlowCanvas
          key={workflow.id}
          workflow={workflow}
          states={run.states}
          selectedStepId={stepId}
          onSelect={setStepId}
          connections={connections}
          active={active}
        />

        <div className="grid grid-cols-1 border-t border-primary-100/60 md:grid-cols-2">
          <div className="border-b border-primary-100/60 p-5 md:border-b-0 md:border-r">
            <h3 className="text-sm font-semibold text-gray-950">{t("Step details")}</h3>
            {step ? <StepDetails stepId={step.id} workflow={workflow} connection={connectionOf(step.connectionId)} active={active} /> : null}
          </div>
          <div className="p-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-950">
              <ScrollText size={16} aria-hidden className="text-primary-700" />
              {t("Run log")}
            </h3>
            {run.log.length === 0 ? (
              <ol className="mt-3 space-y-2 text-sm">
                <li className="text-gray-700">
                  {t("Last run")} {formatDate(workflow.lastRun)}: {workflow.runsThisMonth} {t("runs this month")}, {workflow.failedRunsThisMonth} {t("with a failed step")}.
                </li>
                <li className="text-muted-foreground">{t("Press Run now to replay the workflow on the demo data.")}</li>
              </ol>
            ) : (
              <ol className="mt-3 space-y-2" aria-live="polite">
                {run.log.map((line) => {
                  const state = STEP_STATE[line.status];
                  const label = workflow.steps.find((item) => item.id === line.stepId)?.label;
                  return (
                    <li key={line.stepId} className="flex items-start gap-2 text-sm">
                      <span className={cn("mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", state.pill)}>
                        <state.Icon size={12} aria-hidden />
                        {t(state.label)}
                      </span>
                      <span className="min-w-0">
                        <span className="font-medium text-gray-950">{label}</span>
                        <span className="text-gray-700"> · {line.message}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

type FlowCanvasProps = {
  workflow: Workflow;
  states: Record<string, StepState>;
  selectedStepId: string | null;
  onSelect: (stepId: string) => void;
  connections: MasterConnection[];
  active: Record<string, boolean>;
};

function toNodes({ workflow, states, selectedStepId, connections, active }: Omit<FlowCanvasProps, "onSelect">): FlowNodeType[] {
  return workflow.steps.map((step) => {
    const connection = connections.find((item) => item.id === step.connectionId);
    return {
      id: step.id,
      type: "flowStep",
      position: { x: step.x, y: step.y },
      selected: step.id === selectedStepId,
      data: {
        step,
        state: states[step.id] ?? "idle",
        connectionName: connection?.name,
        connectionActive: connection ? active[connection.id] : undefined
      }
    };
  });
}

/** The canvas: steps can be dragged to rearrange the view; the flow itself is read-only in the demo. */
function FlowCanvas(props: FlowCanvasProps) {
  const { workflow, states, selectedStepId, onSelect, connections, active } = props;
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeType>(toNodes(props));

  useEffect(() => {
    setNodes((current) =>
      current.map((node) => {
        const fresh = toNodes({ workflow, states, selectedStepId, connections, active }).find((item) => item.id === node.id);
        return fresh ? { ...node, selected: fresh.selected, data: fresh.data } : node;
      })
    );
  }, [workflow, states, selectedStepId, connections, active, setNodes]);

  const edges: Edge[] = useMemo(
    () =>
      workflow.links.map((link) => ({
        id: `${link.from}-${link.to}`,
        source: link.from,
        target: link.to,
        type: "smoothstep",
        label: link.label,
        animated: states[link.to] === "running",
        markerEnd: { type: MarkerType.ArrowClosed, color: "var(--color-primary-500)" },
        style: { stroke: "var(--color-primary-400)", strokeWidth: 1.75 },
        labelStyle: { fontSize: 11, fontWeight: 600, fill: "var(--color-primary-800)" },
        labelBgStyle: { fill: "var(--color-primary-50)" },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 6
      })),
    [workflow.links, states]
  );

  return (
    <div className="h-[480px] bg-primary-50/30">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onNodeClick={(_, node) => onSelect(node.id)}
        nodesConnectable={false}
        edgesFocusable={false}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.3}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.2} color="var(--color-primary-200)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}

function StepDetails({
  stepId,
  workflow,
  connection,
  active
}: {
  stepId: string;
  workflow: Workflow;
  connection?: MasterConnection;
  active: Record<string, boolean>;
}) {
  const t = useT();
  const step = workflow.steps.find((item) => item.id === stepId);
  if (!step) return null;
  const role = ROLE_STYLE[step.role];
  const Icon = FLOW_ICONS[step.icon];
  const feeds = workflow.links.filter((link) => link.to === step.id).map((link) => workflow.steps.find((item) => item.id === link.from)?.label);
  const isActive = connection ? active[connection.id] : undefined;

  return (
    <div className="mt-3 flex items-start gap-3">
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", role.tile)}>
        <Icon size={16} aria-hidden />
      </span>
      <dl className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">{t("Step")}</dt>
        <dd className="font-semibold text-gray-950">{step.label}</dd>
        <dt className="text-muted-foreground">{t("Type")}</dt>
        <dd>{t(role.label)}</dd>
        <dt className="text-muted-foreground">{t("Does")}</dt>
        <dd>{step.detail}</dd>
        <dt className="text-muted-foreground">{t("Input")}</dt>
        <dd>{feeds.length > 0 ? feeds.join(", ") : t("Starts the workflow")}</dd>
        <dt className="text-muted-foreground">{t("Connection")}</dt>
        <dd>
          {connection ? (
            <span className={cn("inline-flex items-center gap-1", isActive === false && "font-semibold text-red-700")}>
              {isActive === false && <PlugZap size={14} aria-hidden />}
              {connection.name} · {connection.system}
              {isActive === false && ` (${t("Inactive")})`}
            </span>
          ) : (
            t("None, runs inside ATLAS")
          )}
        </dd>
      </dl>
    </div>
  );
}

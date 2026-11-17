"use client";

import { useCallback, useRef, useEffect, useState, DragEvent } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  useReactFlow,
  type NodeTypes,
  type NodeChange,
  type EdgeChange,
  type Connection
} from "@xyflow/react";
import { Bot, Loader2, Terminal } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "../hooks/useWorkflowStore";
import {
  useGetWorkflow,
  useUpdateWorkflow,
  useRunWorkflow
} from "../hooks/useWorkflow";
import { useWorkflowSocket } from "../hooks/useWorkflowSocket";
import { useTransformFields } from "../hooks/useTransformFields";
import { getOrCreateAnonIdentity } from "../lib/collab";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type {
  WorkflowNode,
  WorkflowEdge,
  NodeConfig,
  ScheduleConfig
} from "../types";
import { requiresPreDropConfig, getNodeRoleByType } from "../lib/nodeConfig";
import {
  serializeCanvasForSave,
  hydrateLoadedCanvas
} from "../lib/serializeCanvas";
import { CustomNode } from "./CustomNode";
import { WorkflowSidebar } from "./Sidebar";
import { ConfigPanel } from "./ConfigPanel";
import { NodeConfigDialog } from "./NodeConfigDialog";
import { Toolbar } from "./Toolbar";
import { PresenceBar } from "./PresenceBar";
import { RemoteCursors } from "./RemoteCursors";
import { ExecutionLog } from "./ExecutionLog";
import { ChatbotPanel } from "./ChatbotPanel";

const nodeTypes: NodeTypes = {
  customNode: CustomNode
};

const AUTOSAVE_DELAY = 1000;

interface WorkflowCanvasProps {
  workflowId: string;
  folderName?: string;
  onBack?: () => void;
}

function WorkflowCanvas({
  workflowId,
  folderName,
  onBack
}: WorkflowCanvasProps) {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const selectNode = useWorkflowStore((s) => s.selectNode);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const setCanvas = useWorkflowStore((s) => s.setCanvas);
  const reset = useWorkflowStore((s) => s.reset);
  const setTransformFields = useWorkflowStore((s) => s.setTransformFields);
  const setTransformFieldsLoading = useWorkflowStore(
    (s) => s.setTransformFieldsLoading
  );
  const setSaveWorkflow = useWorkflowStore((s) => s.setSaveWorkflow);
  const setIsSaving = useWorkflowStore((s) => s.setIsSaving);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  const { data, isLoading } = useGetWorkflow(workflowId);
  const updateWorkflow = useUpdateWorkflow();
  const runWorkflow = useRunWorkflow();

  const [loaded, setLoaded] = useState(false);
  const skipNextSaveRef = useRef(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [showExecutionLog, setShowExecutionLog] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  // A pending drop of a node that requires its config to be filled before it
  // can be added to the canvas (Pipedrive source, PostgreSQL destination).
  const [pendingDrop, setPendingDrop] = useState<{
    nodeType: string;
    position: { x: number; y: number };
  } | null>(null);

  const workflow = data?.data;

  /* ----------------------- realtime collaboration ----------------------- */
  const { user } = useCurrentUser();
  const { data: session } = useSession();

  // Use the real logged-in user when available; otherwise fall back to a
  // stable per-tab anonymous identity (auth isn't wired up yet). useState's
  // lazy initializer runs once so the id stays stable across re-renders.
  const [anon] = useState(() => getOrCreateAnonIdentity());
  const collabUser = user
    ? { id: user.id, name: user.name ?? undefined }
    : anon;

  const {
    connected,
    users,
    remoteCursors,
    emitCursor,
    emitNodeChanges,
    emitEdgeChanges
  } = useWorkflowSocket({
    // Each workflow is its own room, so editors only sync within the same workflow.
    room: workflowId,
    user: collabUser,
    token: session?.accessToken,
    // Only connect once the canvas has loaded to avoid racing the initial fetch.
    enabled: loaded
  });

  // Clear any leftover canvas state when mounting for a new workflow.
  useEffect(() => {
    reset();
    setLoaded(false);
  }, [workflowId, reset]);

  // Load the persisted canvas once the workflow detail arrives.
  useEffect(() => {
    if (!workflow || loaded) return;
    const canvas = hydrateLoadedCanvas(workflow.canvas ?? null);
    skipNextSaveRef.current = true;
    setCanvas(canvas.nodes, canvas.edges);
    setLoaded(true);
  }, [workflow, loaded, setCanvas]);

  const save = useCallback(() => {
    if (!workflow) return;
    const { nodes: currentNodes, edges: currentEdges } =
      useWorkflowStore.getState();
    updateWorkflow.mutate({
      id: workflowId,
      payload: {
        name: workflow.name,
        description: workflow.description,
        folder_id: workflow.folder_id,
        canvas: serializeCanvasForSave(currentNodes, currentEdges)
      }
    });
  }, [workflow, workflowId, updateWorkflow]);

  // Register the save handler in the store so other components (e.g. the
  // TransformFields "Transform" button) can trigger a save without prop drilling.
  useEffect(() => {
    setSaveWorkflow(() => save);
    return () => setSaveWorkflow(null);
  }, [save, setSaveWorkflow]);

  // Mirror the mutation's pending state into the store for the same reason.
  useEffect(() => {
    setIsSaving(updateWorkflow.isPending && !isScheduling);
  }, [updateWorkflow.isPending, isScheduling, setIsSaving]);

  const setSchedule = useCallback(
    (schedule: {
      schedule_config: ScheduleConfig;
      schedule_enabled: boolean;
      schedule_timezone: string;
      schedule_type: string;
      schedule_cron_expression?: string;
    }) => {
      if (!workflow) return;
      const { nodes: currentNodes, edges: currentEdges } =
        useWorkflowStore.getState();
      setIsScheduling(true);
      updateWorkflow.mutate(
        {
          id: workflowId,
          payload: {
            name: workflow.name,
            description: workflow.description,
            folder_id: workflow.folder_id,
            canvas: serializeCanvasForSave(currentNodes, currentEdges),
            schedule_config: schedule.schedule_config,
            schedule_enabled: schedule.schedule_enabled,
            schedule_timezone: schedule.schedule_timezone,
            schedule_type: schedule.schedule_type,
            schedule_cron_expression: schedule.schedule_cron_expression
          }
        },
        {
          onSettled: () => {
            setIsScheduling(false);
          }
        }
      );
    },
    [workflow, workflowId, updateWorkflow]
  );

  // Debounced auto-save whenever nodes or edges change.
  // Use a ref-based approach to avoid re-running on every drag position update.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!loaded) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(save, AUTOSAVE_DELAY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, loaded]);

  const renameWorkflow = useCallback(
    async (name: string) => {
      if (!workflow) return;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }

      const { nodes: currentNodes, edges: currentEdges } =
        useWorkflowStore.getState();
      await updateWorkflow.mutateAsync({
        id: workflowId,
        payload: {
          name,
          description: workflow.description,
          folder_id: workflow.folder_id,
          canvas: serializeCanvasForSave(currentNodes, currentEdges),
          schedule_config: workflow.schedule_config ?? undefined,
          schedule_cron_expression:
            workflow.schedule_cron_expression ?? undefined,
          schedule_enabled: workflow.schedule_enabled,
          schedule_timezone: workflow.schedule_timezone ?? undefined,
          schedule_type: workflow.schedule_type ?? undefined
        }
      });
    },
    [workflow, workflowId, updateWorkflow]
  );

  // Fetch available source fields for every transform node on the canvas. The
  // hook is enabled once the canvas has loaded and refetches when the canvas
  // signature (node identity/type/config + edge wiring) changes. Results are
  // mirrored into the store so TransformFields can read them by node id.
  const transformFieldsQuery = useTransformFields(nodes, edges, loaded);
  useEffect(() => {
    setTransformFields(transformFieldsQuery.data?.transforms ?? {});
  }, [transformFieldsQuery.data, setTransformFields]);
  useEffect(() => {
    setTransformFieldsLoading(
      transformFieldsQuery.isLoading || transformFieldsQuery.isFetching
    );
  }, [
    transformFieldsQuery.isLoading,
    transformFieldsQuery.isFetching,
    setTransformFieldsLoading
  ]);

  const onDragStart = useCallback((e: DragEvent, nodeType: string) => {
    e.dataTransfer.setData("application/reactflow", nodeType);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // addNode inserts straight into the store (no React Flow change event), so we
  // diff before/after to find the new node and broadcast it as an "add" change.
  const commitAddNode = useCallback(
    (
      nodeType: string,
      position: { x: number; y: number },
      config?: NodeConfig
    ) => {
      const before = useWorkflowStore.getState().nodes;
      addNode(nodeType, position, config);
      const after = useWorkflowStore.getState().nodes;
      const added = after.filter((n) => !before.some((b) => b.id === n.id));
      if (added.length) {
        emitNodeChanges(added.map((item) => ({ type: "add", item })));
      }
    },
    [addNode, emitNodeChanges]
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData("application/reactflow");
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY
      });

      // Source/Destination connectors require a completed config first, so we
      // open a blocking dialog instead of dropping an incomplete node.
      if (requiresPreDropConfig(nodeType)) {
        setPendingDrop({ nodeType, position });
        return;
      }

      commitAddNode(nodeType, position);
    },
    [screenToFlowPosition, commitAddNode]
  );

  /* ---------------------- broadcast local edits ----------------------- */
  // We wrap React Flow's change handlers: first update our own store, then
  // emit the changes so collaborators apply the same mutation. We skip noisy
  // "select"/"dimensions" changes since those are per-viewer concerns.
  const handleNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      onNodesChange(changes);
      const shared = changes.filter(
        (c) => c.type !== "select" && c.type !== "dimensions"
      );
      emitNodeChanges(shared);
    },
    [onNodesChange, emitNodeChanges]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<WorkflowEdge>[]) => {
      onEdgesChange(changes);
      const shared = changes.filter((c) => c.type !== "select");
      emitEdgeChanges(shared);
    },
    [onEdgesChange, emitEdgeChanges]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      // onConnect may auto-insert a Transform node (and its edges) to enforce
      // Source -> Transform -> Destination, so diff both nodes and edges and
      // broadcast every addition to collaborators.
      const beforeNodes = useWorkflowStore.getState().nodes;
      const beforeEdges = useWorkflowStore.getState().edges;
      onConnect(connection);
      const afterNodes = useWorkflowStore.getState().nodes;
      const afterEdges = useWorkflowStore.getState().edges;

      const addedNodes = afterNodes.filter(
        (n) => !beforeNodes.some((b) => b.id === n.id)
      );
      const addedEdges = afterEdges.filter(
        (e) => !beforeEdges.some((b) => b.id === e.id)
      );

      if (addedNodes.length) {
        emitNodeChanges(addedNodes.map((item) => ({ type: "add", item })));
        if (
          addedNodes.some(
            (n) => getNodeRoleByType(n.data.nodeType as string) === "transform"
          )
        ) {
          toast.info("Transform node inserted", {
            description:
              "A source can't connect directly to a destination, so a Transform node was added between them."
          });
        }
      }
      if (addedEdges.length) {
        emitEdgeChanges(addedEdges.map((item) => ({ type: "add", item })));
      }
    },
    [onConnect, emitNodeChanges, emitEdgeChanges]
  );

  // Broadcast our cursor in flow coordinates as the mouse moves over the pane.
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      emitCursor(pos);
    },
    [screenToFlowPosition, emitCursor]
  );

  return (
    <div className="flex flex-1 w-full flex-col overflow-hidden">
      <Toolbar
        folderName={folderName}
        workflowName={workflow?.name}
        onRename={renameWorkflow}
        onBack={onBack}
        onSave={save}
        isSaving={updateWorkflow.isPending && !isScheduling}
        onRun={() => runWorkflow.mutate(workflowId)}
        isRunning={runWorkflow.isPending}
        onSetSchedule={setSchedule}
        isScheduling={isScheduling}
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView({ padding: 0.2 })}
      />

      <div className="flex flex-1 overflow-hidden">
        <WorkflowSidebar onDragStart={onDragStart} />

        <div
          ref={reactFlowWrapper}
          className="relative flex-1"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onMouseMove={handleMouseMove}
        >
          <PresenceBar connected={connected} users={users} />
          {isLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-white">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            defaultEdgeOptions={{
              type: "smoothstep",
              animated: true,
              style: { stroke: "#b6d0f7", strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#b6d0f7",
                width: 18,
                height: 18
              }
            }}
            proOptions={{ hideAttribution: true }}
            fitView
            className="bg-white"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={2}
              color="#33445e"
            />
            <Controls
              className="border-slate-200! bg-white! text-slate-700! shadow-sm!"
              showInteractive={false}
            />
            {/* Rendered inside ReactFlow so cursors pan/zoom with the canvas. */}
            <RemoteCursors cursors={remoteCursors} />
          </ReactFlow>

          {selectedNodeId && <ConfigPanel />}

          <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-white/15 bg-[#090909] p-1 shadow-xl">
            <button
              type="button"
              onClick={() => setShowExecutionLog((current) => !current)}
              aria-pressed={showExecutionLog}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
                showExecutionLog
                  ? "bg-white text-slate-900"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              title="Toggle execution log"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Log</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChatbot((current) => !current)}
              aria-pressed={showChatbot}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors ${
                showChatbot
                  ? "bg-primary-600 text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              title="Toggle integrated chatbot"
            >
              <Bot className="h-3.5 w-3.5" />
              <span>Chat</span>
            </button>
          </div>
        </div>
      </div>

      {(showExecutionLog || showChatbot) && (
        <div
          className={`grid shrink-0 items-start gap-1.5 bg-slate-100 p-1.5 pt-0 ${
            showExecutionLog && showChatbot ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {showExecutionLog && (
            <section
              aria-label="Execution log panel"
              className="min-w-0 overflow-hidden rounded-lg border border-slate-300 shadow-sm"
            >
              <ExecutionLog
                workflowId={workflowId}
                onClose={() => setShowExecutionLog(false)}
              />
            </section>
          )}
          {showChatbot && (
            <section
              aria-label="Integrated chatbot panel"
              className="min-w-0 overflow-hidden rounded-lg border border-slate-300 shadow-sm"
            >
              <ChatbotPanel
                workflowId={workflowId}
                onClose={() => setShowChatbot(false)}
              />
            </section>
          )}
        </div>
      )}

      {pendingDrop && (
        <NodeConfigDialog
          nodeType={pendingDrop.nodeType}
          onCancel={() => setPendingDrop(null)}
          onConfirm={(config) => {
            commitAddNode(pendingDrop.nodeType, pendingDrop.position, config);
            setPendingDrop(null);
          }}
        />
      )}
    </div>
  );
}

export function WorkflowBuilder({
  workflowId,
  folderName,
  onBack
}: {
  workflowId: string;
  folderName?: string;
  onBack?: () => void;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas
        workflowId={workflowId}
        folderName={folderName}
        onBack={onBack}
      />
    </ReactFlowProvider>
  );
}

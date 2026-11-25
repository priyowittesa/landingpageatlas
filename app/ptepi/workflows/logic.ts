import type { FlowStep, MasterConnection, Workflow } from "./data";

/** Active flag per connection id, after the switches on Master Connections. */
export type ActiveMap = Record<string, boolean>;

export function initialActiveMap(connections: MasterConnection[]): ActiveMap {
  return Object.fromEntries(connections.map((connection) => [connection.id, connection.active]));
}

/** Steps in run order: every step after the steps that feed it, ties in the order they were drawn. */
export function getRunOrder(workflow: Workflow): FlowStep[] {
  const indegree = new Map(workflow.steps.map((step) => [step.id, 0]));
  for (const link of workflow.links) indegree.set(link.to, (indegree.get(link.to) ?? 0) + 1);

  const order: FlowStep[] = [];
  const done = new Set<string>();
  while (order.length < workflow.steps.length) {
    const next = workflow.steps.find((step) => !done.has(step.id) && indegree.get(step.id) === 0);
    if (!next) break; // a cycle: stop rather than loop
    order.push(next);
    done.add(next.id);
    for (const link of workflow.links) {
      if (link.from === next.id) indegree.set(link.to, (indegree.get(link.to) ?? 0) - 1);
    }
  }
  return order;
}

export type StepResult = {
  stepId: string;
  status: "success" | "failed" | "skipped";
  message: string;
};

/**
 * Outcome of a simulated run. A step fails when its connection is switched off;
 * the steps that depend on a failed or skipped step are skipped.
 */
export function simulateRun(
  workflow: Workflow,
  active: ActiveMap,
  connections: MasterConnection[]
): StepResult[] {
  const blocked = new Set<string>();
  return getRunOrder(workflow).map((step) => {
    const upstream = workflow.links.filter((link) => link.to === step.id).map((link) => link.from);
    if (upstream.some((id) => blocked.has(id))) {
      blocked.add(step.id);
      return { stepId: step.id, status: "skipped", message: "Skipped: an earlier step did not finish." };
    }
    if (step.connectionId && active[step.connectionId] === false) {
      blocked.add(step.id);
      const name = connections.find((connection) => connection.id === step.connectionId)?.name ?? step.connectionId;
      return { stepId: step.id, status: "failed", message: `Failed: connection "${name}" is inactive.` };
    }
    return { stepId: step.id, status: "success", message: step.output };
  });
}

export type RunOutcome = "success" | "warning" | "failed";

export function getRunOutcome(results: StepResult[]): RunOutcome {
  const finished = results.filter((result) => result.status === "success").length;
  if (finished === results.length) return "success";
  return finished === 0 ? "failed" : "warning";
}

/** Workflows that read or write through a connection. */
export function getConnectionUsage(connectionId: string, workflows: Workflow[]): Workflow[] {
  return workflows.filter((workflow) => workflow.steps.some((step) => step.connectionId === connectionId));
}

export function getConnectionStats(connections: MasterConnection[], active: ActiveMap, workflows: Workflow[]) {
  const activeCount = connections.filter((connection) => active[connection.id] ?? connection.active).length;
  return {
    total: connections.length,
    active: activeCount,
    inactive: connections.length - activeCount,
    inUse: connections.filter((connection) => getConnectionUsage(connection.id, workflows).length > 0).length
  };
}

/** Workflows whose next run would fail on an inactive connection. */
export function getWorkflowsAtRisk(workflows: Workflow[], active: ActiveMap): Workflow[] {
  return workflows.filter((workflow) =>
    workflow.steps.some((step) => step.connectionId !== undefined && active[step.connectionId] === false)
  );
}

export function getStudioSummary(workflows: Workflow[]) {
  const runs = workflows.reduce((sum, workflow) => sum + workflow.runsThisMonth, 0);
  const failed = workflows.reduce((sum, workflow) => sum + workflow.failedRunsThisMonth, 0);
  return {
    workflows: workflows.length,
    steps: workflows.reduce((sum, workflow) => sum + workflow.steps.length, 0),
    runsThisMonth: runs,
    /** Fraction of this month's runs that finished every step */
    successRate: runs === 0 ? 0 : (runs - failed) / runs
  };
}

import type { WorkflowNode, WorkflowEdge, ValidationResult } from "../types";
import {
  getNodeRoleByType,
  hasNodeConfigForm,
  validateNodeConfig,
} from "./nodeConfig";

export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  allowNexaChatWithoutSource = false
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    errors.push("Workflow is empty. Add at least one node.");
    return { valid: false, errors, warnings };
  }

  const hasDataSource = nodes.some((n) => n.data.category === "data_source");
  const hasNexaChat =
    allowNexaChatWithoutSource &&
    nodes.some((n) => n.data.nodeType === "nexa_chat");
  if (!hasDataSource && !hasNexaChat) {
    errors.push(
      allowNexaChatWithoutSource
        ? "At least one Data Source or NEXA Chat node is required as a trigger."
        : "At least one Data Source node is required as a trigger."
    );
  }

  // Enforce the Source -> Transform -> Destination rule: a source node must not
  // connect directly to a destination node.
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  edges.forEach((e) => {
    const s = nodeById.get(e.source);
    const t = nodeById.get(e.target);
    if (!s || !t) return;
    const sRole = getNodeRoleByType(s.data.nodeType as string);
    const tRole = getNodeRoleByType(t.data.nodeType as string);
    if (sRole === "source" && tRole === "destination") {
      errors.push(
        `"${s.data.label}" connects directly to "${t.data.label}". Insert a Transform node between them.`
      );
    }
  });

  // Validate each configurable node's config is complete.
  nodes.forEach((n) => {
    const nodeType = n.data.nodeType as string;
    if (!hasNodeConfigForm(nodeType)) return;
    validateNodeConfig(nodeType, n.config).forEach((msg) => {
      errors.push(`"${n.data.label}": ${msg}`);
    });
  });

  const activeNodes = nodes.filter((n) => n.data.status !== "disabled");

  const connectedNodeIds = new Set<string>();
  edges.forEach((e) => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  const disconnected = activeNodes.filter(
    (n) => !connectedNodeIds.has(n.id) && activeNodes.length > 1
  );
  disconnected.forEach((n) => {
    warnings.push(`Node "${n.data.label}" (${n.id}) is not connected.`);
  });

  if (hasCircularDependency(edges)) {
    errors.push("Circular dependency detected in the workflow.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function hasCircularDependency(edges: WorkflowEdge[]): boolean {
  const adj = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    recursionStack.add(node);

    const neighbors = adj.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(node);
    return false;
  }

  for (const [node] of adj) {
    if (!visited.has(node)) {
      if (dfs(node)) return true;
    }
  }

  return false;
}

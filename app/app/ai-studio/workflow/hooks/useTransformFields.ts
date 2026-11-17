"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import { resolveConfigNodeType } from "../lib/nodeConfig";
import { serializeCanvas } from "../lib/serializeCanvas";
import type {
  WorkflowNode,
  WorkflowEdge,
  TransformFieldsResponse,
} from "../types";

const WORKFLOW_URL = `${env.apiBaseUrl}/workflow`;
const axios = axiosConfig(env.apiBaseUrl);

export const transformFieldsKeys = {
  transformFields: (signature: string) =>
    ["getTransformFields", signature] as const,
};

/**
 * Build a stable signature for the canvas that only changes when the parts the
 * backend cares about change (node identity/type/config and edge wiring).
 * Positional/selection/drag state are intentionally excluded so dragging a node
 * doesn't trigger a refetch.
 */
function buildCanvasSignature(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string {
  const nodeSig = nodes
    .map((n) => {
      const nodeType = (n.data.nodeType as string) ?? "";
      const config = n.config ? JSON.stringify(n.config) : "";
      return `${n.id}|${nodeType}|${config}`;
    })
    .sort()
    .join(";");
  const edgeSig = edges
    .map((e) => `${e.id}|${e.source}|${e.target}`)
    .sort()
    .join(";");
  return `${nodeSig}||${edgeSig}`;
}

/**
 * Fetches the available source fields for every transform node on the canvas by
 * POSTing the current nodes/edges to /workflow/transform-fields. The query is
 * enabled only when the canvas is loaded and contains at least one transform
 * node, and refetches when the canvas signature changes.
 */
export const useTransformFields = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  enabled: boolean
) => {
  const hasTransform = nodes.some(
    (n) => {
      const resolved = resolveConfigNodeType(n.data.nodeType as string);
      return (
        resolved === "transform" ||
        resolved === "transform_master_data" ||
        (n.config as { type?: string } | undefined)?.type === "transform"
      );
    }
  );

  const signature = useMemo(
    () => buildCanvasSignature(nodes, edges),
    [nodes, edges]
  );

  return useQuery<TransformFieldsResponse, AxiosError<ApiResponseError>>({
    queryKey: transformFieldsKeys.transformFields(signature),
    queryFn: async () => {
      const response = await axios.post<TransformFieldsResponse>(
        `${WORKFLOW_URL}/transform-fields`,
        serializeCanvas(nodes, edges)
      );
      return response.data;
    },
    enabled: enabled && hasTransform,
    meta: { errorMessage: "Failed to fetch transform fields" },
  });
};

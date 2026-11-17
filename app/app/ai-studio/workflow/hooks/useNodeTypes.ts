"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";
import type { NodeTypeDetail, NodeTypeListResponse } from "../types";

const axios = axiosConfig(env.apiBaseUrl);

export const nodeTypeKeys = {
  nodeTypes: () => ["getNodeTypes"] as const,
  nodeTypeDetail: (name: string) => ["getNodeTypeDetail", name] as const,
};

export const useGetNodeTypes = () =>
  useQuery<NodeTypeListResponse, AxiosError<ApiResponseError>>({
    queryKey: nodeTypeKeys.nodeTypes(),
    queryFn: async () => {
      const response = await axios.get<NodeTypeListResponse>("/v1/node-types");
      return response.data;
    },
    meta: { errorMessage: "Failed to fetch node types" },
  });

export const useGetNodeTypeDetail = (name: string | null | undefined) =>
  useQuery<NodeTypeDetail, AxiosError<ApiResponseError>>({
    queryKey: nodeTypeKeys.nodeTypeDetail(name ?? ""),
    queryFn: async () => {
      const response = await axios.get<NodeTypeDetail>(
        `/v1/node-types/${name}`
      );
      return response.data;
    },
    enabled: !!name,
    meta: { errorMessage: "Failed to fetch node type detail" },
  });

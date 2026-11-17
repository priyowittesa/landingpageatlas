export const CONNECTION_ENVIRONMENTS = ["development", "staging", "production"] as const;
export type ConnectionEnvironment = (typeof CONNECTION_ENVIRONMENTS)[number];

export interface MasterConnection {
  id: string;
  name: string;
  nodeType: string;
  environment: ConnectionEnvironment;
  status: "active" | "inactive";
  createdAt: string;
  values: Record<string, string> | null;
}

export interface ConnectionPayload {
  node_type: string;
  name: string;
  environment: ConnectionEnvironment;
  values: Record<string, string>;
}

export interface ConnectionFilters {
  nodeType?: string;
  environment?: string;
  status?: string;
  search?: string;
  pageSize?: number;
  pageToken?: string;
}

export interface ConnectionListResult {
  items: MasterConnection[];
  nextPageToken: string;
  totalCount: number;
}

export interface ConnectionStats {
  total: number;
  active: number;
  inactive: number;
}

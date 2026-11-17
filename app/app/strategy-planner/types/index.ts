export type StrategyPlannerStatus = "draft" | "active" | "completed";

export interface StrategyPlanner {
  id: string;
  name: string;
  status: StrategyPlannerStatus;
  created_at: string;
  updated_at: string;
}

export interface StrategyPlannerFilter {
  offset?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export type ProjectStage = "planning" | "design" | "prototype" | "completed";

export type ProjectCategory = "planning" | "design" | "prototype" | "completed";

export type TaskStatus =
  | "todo"
  | "in_progress"
  | "blocked"
  | "completed";

export type TaskPriority = "low" | "medium" | "high" | "critical";

export type TaskImpact = "low" | "medium" | "high" | "critical";

export interface ProjectAssignee {
  id: string;
  name: string;
}

export interface ProjectSummary {
  total: number;
  done: number;
  active: number;
  blocked: number;
  work_packages: number;
  in_progress_tasks: number;
  completed_tasks: number;
  progress_percent: number;
}

export interface SourceRequestRef {
  id: string;
  request_no: string;
  name: string;
  approved_at: string;
  due_date: string;
}

export interface ProjectPlanning {
  id: string;
  project_no: string;
  name: string;
  category: ProjectCategory;
  current_stage: ProjectStage;
  status_design: string;
  design_id: string;
  status_prototype: string;
  prototype_id: string;
  customer: string;
  project_manager: ProjectAssignee;
  start_date: string;
  due_date: string;
  source_request: SourceRequestRef;
  classification: string;
  progress_percent: number;
  summary: ProjectSummary;
  risk_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectWorkPackage {
  id: string;
  name: string;
  status: string;
  owner_name: string;
  allocated_hours: number;
}

export interface AddWorkPackageDto {
  project_id: string;
  title: string;
  description?: string;
  owner_id: string;
  owner_name: string;
  status: string;
}

export interface ProjectTask {
  id: string;
  work_package_id: string;
  task_name: string;
  description?: string;
  phase?: string;
  assignee?: ProjectAssignee;
  status: TaskStatus;
  priority: TaskPriority;
  impact: TaskImpact;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  estimate_hours?: number;
  estimate_unit?: string;
  progress_percent: number;
  rql_component_id?: string;
  cable_type?: string;
  termination_end?: string;
  is_phase_header?: boolean;
}

export interface ProjectTimelineEntry {
  id: string;
  timestamp: string;
  actor: string;
  description: string;
}

export interface ProjectFilter {
  search?: string;
  classification?: string;
  page_size?: number;
  page_token?: string;
}

export interface ProjectPlanningListResponse {
  items: ProjectPlanning[];
  next_page_token: string;
}

export interface AddTaskDto {
  project_id: string;
  work_package_id: string;
  task_name: string;
  description?: string;
  phase?: string;
  assignee_id?: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date?: string;
  end_date?: string;
  estimate_hours?: number;
  estimate_unit?: string;
  due_date?: string;
  rql_component_id?: string;
  cable_type?: string;
  termination_end?: string;
}

export interface UpdateTaskDto {
  id: string;
  project_id: string;
  work_package_id: string;
  task_name?: string;
  description?: string;
  phase?: string;
  assignee_id?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  start_date?: string;
  end_date?: string;
  estimate_hours?: number;
  estimate_unit?: string;
  due_date?: string;
  progress_percent?: number;
}

export const projectStageOptions: ProjectStage[] = [
  "planning",
  "design",
  "prototype",
  "completed",
];

export const projectCategoryOptions: ProjectCategory[] = [
  "planning",
  "design",
  "prototype",
  "completed",
];

export const taskStatusOptions: TaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "completed",
];

export const taskPriorityOptions: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "critical",
];

export const categoryClassMap: Record<ProjectCategory, string> = {
  planning: "border-sky-400 bg-sky-50 text-sky-600",
  design: "border-amber-400 bg-amber-50 text-amber-600",
  prototype: "border-violet-400 bg-violet-50 text-violet-600",
  completed: "border-emerald-400 bg-emerald-50 text-emerald-600",
};

export const taskStatusClassMap: Record<TaskStatus, string> = {
  todo: "border-gray-300 bg-gray-50 text-gray-500",
  in_progress: "border-blue-400 bg-blue-50 text-blue-600",
  blocked: "border-red-400 bg-red-50 text-red-600",
  completed: "border-emerald-400 bg-emerald-50 text-emerald-600",
};

export const taskPriorityClassMap: Record<TaskPriority, string> = {
  low: "border-gray-300 bg-gray-50 text-gray-500",
  medium: "border-emerald-400 bg-emerald-50 text-emerald-600",
  high: "border-amber-400 bg-amber-50 text-amber-600",
  critical: "border-red-400 bg-red-50 text-red-600",
};

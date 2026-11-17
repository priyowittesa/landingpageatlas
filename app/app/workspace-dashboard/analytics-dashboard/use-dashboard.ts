"use client";

import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ApiResponseError } from "@/types/api";

const axios = axiosConfig(env.apiBaseUrl);
const BASE_URL = `${env.apiBaseUrl}/v1/construction-diary/diaries`;
const LABOUR_URL = `${env.apiBaseUrl}/v1/construction-labour`;

// ---------------------------------------------------------------------------
// Shared filter params (all dashboard endpoints accept these)
// ---------------------------------------------------------------------------

export type DashboardFilter = {
  project_id?: string;
  date_from?: string; // YYYY-MM-DD
  date_to?: string; // YYYY-MM-DD
};

// Labour rostering endpoints use start_date/end_date instead of date_from/date_to
export type RosteringFilter = {
  project_id?: string;
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  reference_date?: string; // YYYY-MM-DD (employee-overlap)
  limit?: number;
  member_id?: string;
};

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export type AverageTemperatureResponse = {
  average_temperature_c: number | null;
};

export type ComplianceTrendPoint = {
  period_start: string;
  period_end: string;
  submitted_diaries: number;
  total_diaries: number;
  compliance_percent: number | null;
};

export type ComplianceTrendResponse = {
  date_from: string;
  date_to: string;
  bucket_days: number;
  target_percent: number;
  points: ComplianceTrendPoint[];
};

export type DashboardSummaryResponse = {
  submitted_diaries: number;
  total_diaries: number;
  total_man_hours: number;
  total_delay_hours: number;
  open_issues: number;
  average_temperature_c: number | null;
  hour_allocation_percent: number | null;
};

export type IssueDelayItem = {
  issue_type: string;
  delay_hours: number;
  cumulative_percent: number;
};

export type IssueDelayResponse = {
  items: IssueDelayItem[];
};

export type IssueStatusItem = {
  status: string;
  count: number;
  percentage: number | null;
};

export type IssueStatusResponse = {
  total_issues: number;
  items: IssueStatusItem[];
};

export type ManHoursPerActivityItem = {
  activity_id: string;
  activity_code: string;
  activity_name: string;
  total_hours: number;
};

export type ManHoursPerActivityResponse = {
  items: ManHoursPerActivityItem[];
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useAverageTemperature(filter: DashboardFilter = {}) {
  return useQuery<AverageTemperatureResponse, AxiosError<ApiResponseError>>({
    queryKey: ["dashboard-average-temperature", filter] as const,
    queryFn: async () => {
      const res = await axios.get<AverageTemperatureResponse>(
        `${BASE_URL}/average-temperature`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch average temperature" },
  });
}

export function useComplianceTrend(filter: DashboardFilter = {}) {
  return useQuery<ComplianceTrendResponse, AxiosError<ApiResponseError>>({
    queryKey: ["dashboard-compliance-trend", filter] as const,
    queryFn: async () => {
      const res = await axios.get<ComplianceTrendResponse>(
        `${BASE_URL}/compliance-trend`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch compliance trend" },
  });
}

export function useDashboardSummary(filter: DashboardFilter = {}) {
  return useQuery<DashboardSummaryResponse, AxiosError<ApiResponseError>>({
    queryKey: ["dashboard-summary", filter] as const,
    queryFn: async () => {
      const res = await axios.get<DashboardSummaryResponse>(
        `${BASE_URL}/dashboard-summary`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch dashboard summary" },
  });
}

export function useIssueDelayBreakdown(filter: DashboardFilter = {}) {
  return useQuery<IssueDelayResponse, AxiosError<ApiResponseError>>({
    queryKey: ["dashboard-issue-delay", filter] as const,
    queryFn: async () => {
      const res = await axios.get<IssueDelayResponse>(
        `${BASE_URL}/issue-delay-breakdown`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch issue delay breakdown" },
  });
}

export function useIssueStatusSummary(filter: DashboardFilter = {}) {
  return useQuery<IssueStatusResponse, AxiosError<ApiResponseError>>({
    queryKey: ["dashboard-issue-status", filter] as const,
    queryFn: async () => {
      const res = await axios.get<IssueStatusResponse>(
        `${BASE_URL}/issue-status-summary`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch issue status summary" },
  });
}

export function useManHoursPerActivity(filter: DashboardFilter = {}) {
  return useQuery<ManHoursPerActivityResponse, AxiosError<ApiResponseError>>({
    queryKey: ["dashboard-manhours-activity", filter] as const,
    queryFn: async () => {
      const res = await axios.get<ManHoursPerActivityResponse>(
        `${BASE_URL}/man-hours-per-activity`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch man-hours per activity" },
  });
}

// ---------------------------------------------------------------------------
// Labour rostering — response types
// ---------------------------------------------------------------------------

export type RosteringSummaryResponse = {
  total_workers: number;
  total_projects: number;
  active_projects: number;
  inactive_projects: number;
  assigned_workers: number;
};

export type EmployeeOverlapProject = {
  project_id: string;
  project_name: string;
};

export type EmployeeOverlapItem = {
  labour_id: string;
  employee_name: string;
  overlap_count: number;
  projects: EmployeeOverlapProject[];
};

export type EmployeeOverlapResponse = {
  reference_date: string;
  items: EmployeeOverlapItem[];
};

export type ShiftDistributionShift = {
  shift_id: string;
  shift_name: string;
  hex_color: string;
  days: number;
  share_percent: number;
};

export type ShiftDistributionItem = {
  employee_id: string;
  employee_name: string;
  total_days: number;
  shifts: ShiftDistributionShift[];
};

export type ShiftDistributionResponse = {
  start_date: string;
  end_date: string;
  period_days: number;
  items: ShiftDistributionItem[];
};

export type LabourScheduleItem = {
  id: string;
  member_id: string;
  shift_id: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type LabourSchedulesResponse = {
  items: LabourScheduleItem[];
};

// ---------------------------------------------------------------------------
// Labour rostering — hooks
// ---------------------------------------------------------------------------

// NOTE: The summary endpoint URL is assumed to be
// /v1/construction-labour/dashboard-summary. The response shape you provided
// (total_workers, total_projects, ...) does not match the
// issue-status-summary endpoint it was listed under — adjust the URL below
// if the actual path differs.
export function useRosteringSummary(filter: RosteringFilter = {}) {
  return useQuery<RosteringSummaryResponse, AxiosError<ApiResponseError>>({
    queryKey: ["rostering-summary", filter] as const,
    queryFn: async () => {
      const res = await axios.get<RosteringSummaryResponse>(
        `${LABOUR_URL}/dashboard-summary`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch rostering summary" },
  });
}

export function useEmployeeOverlap(filter: RosteringFilter = {}) {
  return useQuery<EmployeeOverlapResponse, AxiosError<ApiResponseError>>({
    queryKey: ["rostering-employee-overlap", filter] as const,
    queryFn: async () => {
      const res = await axios.get<EmployeeOverlapResponse>(
        `${LABOUR_URL}/employee-overlap`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch employee overlap" },
  });
}

export function useShiftDistribution(filter: RosteringFilter = {}) {
  return useQuery<ShiftDistributionResponse, AxiosError<ApiResponseError>>({
    queryKey: ["rostering-shift-distribution", filter] as const,
    queryFn: async () => {
      const res = await axios.get<ShiftDistributionResponse>(
        `${LABOUR_URL}/shift-distribution`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch shift distribution" },
  });
}

// ---------------------------------------------------------------------------
// Labour rostering — project timeline
// ---------------------------------------------------------------------------

export type ProjectTimelinePeriod = {
  start_date: string;
  end_date: string;
  scheduled_days: number;
};

export type ProjectTimelineAssignment = {
  member_id: string;
  labour_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  periods: ProjectTimelinePeriod[];
};

export type ProjectTimelineProject = {
  project_id: string;
  project_name: string;
  project_status: string;
  assignments: ProjectTimelineAssignment[];
};

export type ProjectTimelineResponse = {
  start_date: string;
  end_date: string;
  week_start_dates: string[];
  total_projects: number;
  total_assignments: number;
  projects: ProjectTimelineProject[];
};

export function useProjectTimeline(filter: RosteringFilter = {}) {
  return useQuery<ProjectTimelineResponse, AxiosError<ApiResponseError>>({
    queryKey: ["rostering-project-timeline", filter] as const,
    queryFn: async () => {
      const res = await axios.get<ProjectTimelineResponse>(
        `${LABOUR_URL}/project-timeline`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch project timeline" },
  });
}

export function useLabourSchedules(filter: RosteringFilter = {}) {
  return useQuery<LabourSchedulesResponse, AxiosError<ApiResponseError>>({
    queryKey: ["rostering-schedules", filter] as const,
    queryFn: async () => {
      const res = await axios.get<LabourSchedulesResponse>(
        `${LABOUR_URL}/schedules`,
        { params: filter },
      );
      return res.data;
    },
    meta: { errorMessage: "Failed to fetch labour schedules" },
  });
}

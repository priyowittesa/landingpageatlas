import type {
  DailyDiaryCreatePayload,
  DailyDiaryUpdatePayload,
  DiaryExecutionItem,
  DiaryExecutionPayload,
  DiaryExecutionUpdatePayload,
  DiaryIssueItem,
  DiaryIssuePayload,
  DailyDiariesItem,
} from "@/types/type-daily-diaries";
import type { LabourRosterMember } from "@/app/app/master-data/projects/use-projects";
import type { DailyDiaryFormValues, SelectedEmployee } from "./dailyDiaryFormSchema";

export function toDiaryCreatePayload(
  values: DailyDiaryFormValues,
  { projectId, diaryDate }: { projectId: string; diaryDate: string },
): DailyDiaryCreatePayload {
  return {
    diary_date: diaryDate,
    project_id: projectId,
    site_conditions_notes: values.site_conditions_notes,
    weather_condition: values.weather_condition,
    weather_humidity_pct: Number(values.weather_humidity_pct) || 0,
    weather_impact_on_work: values.weather_impact_on_work,
    weather_temperature_c: Number(values.weather_temperature_c) || 0,
    weather_wind_kmh: Number(values.weather_wind_kmh) || 0,
  };
}

export function toDiaryExecutionPayload(
  values: DailyDiaryFormValues,
  diaryId: string,
): DiaryExecutionPayload {
  return {
    description: values.execution_description,
    diary_id: diaryId,
    employee: values.execution_employees.map((employee) => ({
      employee_id: String(employee.labour_id),
      total_hours: Number(employee.total_hours) || 0,
      break_hours: Number(employee.break_time) || 0,
      equipment: employee.equipments.map((equipment) => ({
        equipment_id: String(equipment.id),
        used_hours: Number(equipment.usedHours) || 0,
        work_type: equipment.workType,
      })),
      activity: employee.activities.map((activity) => ({
        activity_id: String(activity.id),
        activity_name: activity.name,
        description: activity.desc,
        hours: Number(activity.hours) || 0,
      })),
    })),
  };
}

export function toDiaryIssuePayloads(
  values: DailyDiaryFormValues,
  diaryId: string,
): DiaryIssuePayload[] {
  return values.issues.map((issue) => toDiaryIssuePayload(issue, diaryId));
}

export function toDiaryUpdatePayload(
  values: DailyDiaryFormValues,
): DailyDiaryUpdatePayload {
  return {
    site_conditions_notes: values.site_conditions_notes,
    weather_condition: values.weather_condition,
    weather_humidity_pct: Number(values.weather_humidity_pct) || 0,
    weather_impact_on_work: values.weather_impact_on_work,
    weather_temperature_c: Number(values.weather_temperature_c) || 0,
    weather_wind_kmh: Number(values.weather_wind_kmh) || 0,
  };
}

export function toDiaryExecutionUpdatePayload(
  values: DailyDiaryFormValues,
  diaryId: string,
): DiaryExecutionUpdatePayload {
  return {
    ...toDiaryExecutionPayload(values, diaryId),
  };
}

export function diaryDetailToFormValues(
  diary: DailyDiariesItem,
): Partial<DailyDiaryFormValues> {
  return {
    weather_condition: diary.weather_condition ?? "",
    weather_temperature_c: diary.weather_temperature_c ?? 0,
    weather_humidity_pct: diary.weather_humidity_pct ?? 0,
    weather_wind_kmh: diary.weather_wind_kmh ?? 0,
    weather_impact_on_work: diary.weather_impact_on_work ?? "",
    site_conditions_notes: diary.site_conditions_notes ?? "",
  };
}

export function executionItemToFormValues(
  execution: DiaryExecutionItem,
  labourMembers: LabourRosterMember[],
): Partial<DailyDiaryFormValues> {
  const employees: SelectedEmployee[] = execution.employee.map((emp) => {
    const member = labourMembers.find((m) => m.labour_id === emp.employee_id);

    return {
      id: member?.id ?? emp.employee_id,
      labour_id: emp.employee_id,
      name: member?.labour_name ?? "",
      role: member?.labour_role_name ?? "",
      sap: "",
      total_hours: emp.total_hours ?? 0,
      break_time: emp.break_hours ?? 0,
      activities: (emp.activity ?? []).map((act) => ({
        id: act.activity_id || act.id,
        name: act.activity_name ?? "",
        desc: act.description ?? "",
        hours: act.hours ?? 0,
      })),
      equipments: (emp.equipment ?? []).map((eq) => ({
        id: eq.equipment_id || eq.id,
        model: "",
        workType: eq.work_type ?? "",
        usedHours: eq.used_hours ?? 0,
      })),
    } as unknown as SelectedEmployee;
  });

  return {
    execution_description: execution.description ?? "",
    execution_employees: employees,
  };
}

export function issueItemsToFormValues(
  issues: DiaryIssueItem[],
): Partial<DailyDiaryFormValues> {
  return {
    issues: issues.map((issue) => ({
      id: issue.id,
      type: issue.issue_type ?? "",
      delay_hours: issue.delay_hours ?? 0,
      status: issue.status ?? "",
      description: issue.description ?? "",
      responsible_party: issue.responsible_party ?? "",
      corrective_action: issue.corrective_action ?? "",
    })),
  };
}

// A single issue, shaped for POST /diary-issues or PUT /diary-issues/{id}.
export function toDiaryIssuePayload(
  issue: DailyDiaryFormValues["issues"][number],
  diaryId: string,
): DiaryIssuePayload {
  return {
    corrective_action: issue.corrective_action ?? "",
    delay_hours: Number(issue.delay_hours) || 0,
    description: issue.description,
    diary_id: diaryId,
    issue_type: issue.type,
    responsible_party: issue.responsible_party,
    status: issue.status,
  };
}

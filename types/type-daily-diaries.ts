type DailyDiariesFilter = {
  project_id?: string;
  status?: string;
  page_size?: string;
  page_token?: string;
};

type DiaryExecutionFilter = {
  diary_id?: string;
  page_size?: number;
  page_token?: string;
};

type DiaryIssueFilter = {
  diary_id?: string;
  page_size?: number;
  page_token?: string;
};

type DiaryAttachmentFilter = {
  diary_id?: string;
  page_size?: number;
  page_token?: string;
};

interface DailyDiariesDto<T> {
  items: T[];
  next_page_token?: string | null;
  total_count: number;
}

type DailyDiariesApiStatus =
  | "DIARY_STATUS_UNSPECIFIED"
  | "DIARY_STATUS_NOT_STARTED"
  | "DIARY_STATUS_DRAFT"
  | "DIARY_STATUS_SUBMITTED"
  | "DIARY_STATUS_APPROVED"
  | "DIARY_STATUS_REJECTED";

type DailyDiariesItem = {
  created_at: string;
  diary_date: string;
  id: string;
  project_id: string;
  site_conditions_notes: string;
  status: DailyDiariesApiStatus;
  updated_at: string;
  weather_condition: string;
  weather_humidity_pct: number;
  weather_impact_on_work: string;
  weather_temperature_c: number;
  weather_wind_kmh: number;
};

type DailyDiaryActivitiesFilter = {
  diary_labour_id?: string;
  page_size?: number;
  page_token?: string;
};

type DailyDiaryActivitiesItem = {
  activity_type: string;
  created_at: string;
  description: string;
  diary_labour_id: string;
  hours: number;
  id: string;
  updated_at: string;
};

type DailyDiaryCreatePayload = {
  diary_date: string;
  project_id: string;
  site_conditions_notes: string;
  weather_condition: string;
  weather_humidity_pct: number;
  weather_impact_on_work: string;
  weather_temperature_c: number;
  weather_wind_kmh: number;
};

type DiaryExecutionActivityPayload = {
  activity_id: string;
  activity_name: string;
  description: string;
  hours: number;
};

type ProjectActivitiesFilter = {
  page_size?: number;
  page_token?: string;
  project_id?: string;
};

type ProjectActivityItem = {
  created_at: string;
  description: string;
  id: string;
  name: string;
  project_id: string;
  updated_at: string;
};

type ProjectActivityCreatePayload = {
  description: string;
  name: string;
  project_id: string;
};

type DiaryExecutionEquipmentPayload = {
  equipment_id: string;
  used_hours: number;
  work_type: string;
};

type DiaryExecutionEmployeePayload = {
  activity: DiaryExecutionActivityPayload[];
  break_hours: number;
  employee_id: string;
  equipment: DiaryExecutionEquipmentPayload[];
  total_hours: number;
};

type DiaryExecutionPayload = {
  description: string;
  diary_id: string;
  employee: DiaryExecutionEmployeePayload[];
};

type DiaryIssuePayload = {
  corrective_action: string;
  delay_hours: number;
  description: string;
  diary_id: string;
  issue_type: string;
  responsible_party: string;
  status: string;
};

type DiaryExecutionActivityItem = {
  id: string;
  activity_id: string;
  activity_name: string;
  description: string;
  hours: number;
};

type DiaryExecutionEquipmentItem = {
  id: string;
  equipment_id: string;
  used_hours: number;
  work_type: string;
};

type DiaryExecutionEmployeeItem = {
  id: string;
  employee_id: string;
  labour_name: string;
  total_hours: number;
  break_hours: number;
  activity: DiaryExecutionActivityItem[];
  equipment: DiaryExecutionEquipmentItem[];
};

type DiaryExecutionItem = {
  id: string;
  diary_id: string;
  description: string;
  employee: DiaryExecutionEmployeeItem[];
  created_at: string;
  updated_at: string;
};

type DiaryExecutionDto = DailyDiariesDto<DiaryExecutionItem>;

type DiaryIssueItem = {
  id: string;
  diary_id: string;
  issue_type: string;
  delay_hours: number;
  status: string;
  description: string;
  responsible_party: string;
  corrective_action: string;
  created_at: string;
  updated_at: string;
};

type DiaryIssueDto = DailyDiariesDto<DiaryIssueItem>;

type DiaryAttachmentCategory = "photo" | "document";

type DiaryAttachmentApiCategory =
  | "DIARY_ATTACHMENT_CATEGORY_PHOTO"
  | "DIARY_ATTACHMENT_CATEGORY_DOCUMENT"
  | "DIARY_ATTACHMENT_CATEGORY_UNSPECIFIED";

type DiaryAttachmentItem = {
  id: string;
  diary_id: string;
  category: DiaryAttachmentApiCategory;
  file_name: string;
  storage_key: string;
  url: string;
  uploaded_at: string;
};

type DiaryAttachmentDto = DailyDiariesDto<DiaryAttachmentItem>;

type DailyDiaryUpdatePayload = {
  site_conditions_notes: string;
  weather_condition: string;
  weather_humidity_pct: number;
  weather_impact_on_work: string;
  weather_temperature_c: number;
  weather_wind_kmh: number;
};

type DiaryExecutionUpdatePayload = {
  description: string;
  diary_id: string;
  employee: DiaryExecutionEmployeePayload[];
};



type DiaryAttachmentUploadUrlPayload = {
  category: DiaryAttachmentCategory;
  diary_id: string;
  file_name: string;
};

type DiaryAttachmentUploadUrlResponse = {
  upload_url: string;
  storage_key: string;
};

type DiaryAttachmentPayload = DiaryAttachmentUploadUrlPayload & {
  storage_key: string;
};

type DiaryCopySection =
  | "diary"
  | "execution"
  | "issues"
  | "attachments";

type DiaryDuplicatePayload = {
  project_id: string;
  sections: DiaryCopySection[];
  source_date: string;
  target_date: string;
};

type DiaryLabourEquipmentFilter = {
  diary_labour_id?: string;
  page_size?: number;
  page_token?: string;
};

type DiaryLabourEquipmentItem = {
  id: string;
  diary_labour_id?: string;
  equipment_id?: string;
  equipment_model?: string;
  equipment_name?: string;
  equipment_code?: string;
  work_type?: string;
  used_hours?: number;
  created_at?: string;
  updated_at?: string;
};

type ProjectWeather = {
  cached: boolean;
  expires_at: string;
  fetched_at: string;
  latitude: number;
  longitude: number;
  observed_at: string;
  project_id: string;
  stale: boolean;
  weather_condition: string;
  weather_humidity_pct: number;
  weather_temperature_c: number;
  weather_wind_kmh: number;
};

type ProjectWeatherPayload = {
  projectId: string;
  latitude: number;
  longitude: number;
};

type EquipmentEntry = {
  id: string;
  model: string;
  workType: string;
  usedHours: number;
};
type ActivityEntry = { id: string; desc: string; name: string; hours: number };

type EmployeeDraft = {
  equipments: EquipmentEntry[];
  activities: ActivityEntry[];
};

type WorkflowStep = "site" | "execution" | "issues" | "attachments";

type DailyDiaryIssue = {
  type: string;
  delay_hours: number;
  status: string;
  description: string;
  responsible_party: string;
  corrective_action: string;
};

type DailyDiaryFormValues = {
  weather_condition: string;
  weather_temperature_c: number;
  weather_humidity_pct: number;
  weather_wind_kmh: number;
  weather_impact_on_work: string;
  site_conditions_notes: string;
  execution_description: string;
  execution_employees: SelectedEmployee[];
  issues: DailyDiaryIssue[];
};

type Employee = {
  id: number;
  name: string;
  role: string;
  sap: string;
};

type SelectedEmployee = Employee & {
  activities?: ActivityEntry[];
  equipments?: EquipmentEntry[];
  break_time?: number;
  total_hours?: number;
};

export type {
  DailyDiariesApiStatus,
  DailyDiariesDto,
  DailyDiariesFilter,
  DailyDiariesItem,
  DailyDiaryActivitiesFilter,
  DailyDiaryActivitiesItem,
  DailyDiaryCreatePayload,
  DailyDiaryUpdatePayload,
  ProjectActivitiesFilter,
  ProjectActivityItem,
  ProjectActivityCreatePayload,
  DiaryExecutionActivityPayload,
  DiaryExecutionEquipmentPayload,
  DiaryExecutionEmployeePayload,
  DiaryExecutionPayload,
  DiaryExecutionUpdatePayload,
  DiaryExecutionActivityItem,
  DiaryExecutionEquipmentItem,
  DiaryExecutionEmployeeItem,
  DiaryExecutionItem,
  DiaryExecutionDto,
  DiaryExecutionFilter,
  DiaryIssuePayload,
  DiaryIssueItem,
  DiaryIssueDto,
  DiaryIssueFilter,
  DiaryAttachmentCategory,
  DiaryAttachmentApiCategory,
  DiaryAttachmentItem,
  DiaryAttachmentDto,
  DiaryAttachmentFilter,
  DiaryAttachmentUploadUrlPayload,
  DiaryAttachmentUploadUrlResponse,
  DiaryAttachmentPayload,
  DiaryCopySection,
  DiaryDuplicatePayload,
  DiaryLabourEquipmentFilter,
  DiaryLabourEquipmentItem,
  ProjectWeather,
  ProjectWeatherPayload,
  EquipmentEntry,
  ActivityEntry,
  EmployeeDraft,
  WorkflowStep,
  DailyDiaryFormValues,
  Employee,
  SelectedEmployee,
  DailyDiaryIssue,
};

export type TemplateStatus = "Draft" | "Published" | "Archived";

export type FrequencyType = "daily" | "weekly" | "monthly" | "custom";

export type TemplateCategory = "asset" | "quality";

export const STATUS_MAP: Record<number, TemplateStatus> = {
  1: "Draft",
  2: "Published",
  3: "Archived",
};

export const STATUS_REVERSE_MAP: Record<TemplateStatus, number> = {
  Draft: 1,
  Published: 2,
  Archived: 3,
};

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Custom",
};

export interface InspectionTemplateItem {
  id: string;
  familyId?: string;
  code: string;
  name: string;
  templateName?: string;
  machine?: string;
  frequency?: string;
  version?: string;
  status?: TemplateStatus;
  products?: string[];
  revision?: string;
  category?: string;
}

export interface TemplateListParams {
  status?: number;
  frequency_type?: FrequencyType;
  category?: TemplateCategory;
  page_size?: number;
  page_token?: string;
}

export interface TemplateListResponse {
  items: InspectionTemplateItem[];
  next_page_token: string;
  total_count: number;
}

export type ControlPointType = "pass_fail" | "number" | "text";

export interface ControlPoint {
  control_point_id: string;
}

export interface ControlPointTag {
  id: string;
  label: string;
  color: string;
  value?: string;
}

export interface ControlPointCreatePayload {
  color: string;
  created_by: string;
  label: string;
}

export interface ControlPointUpdatePayload {
  color: string;
  id: string;
  label: string;
  updated_by: string;
}

export interface ChecklistItemPayload {
  id?: string;
  description: string;
  type: string;
  min_value: number;
  max_value: number;
  sort_order: number;
  control_points: ControlPoint[];
}

export interface SectionPayload {
  id?: string;
  name: string;
  sort_order: number;
  items: ChecklistItemPayload[];
}

export interface AssetTemplatePayload {
  created_by: string;
  equipment_id: string;
  frequency_type: string;
  frequency_value: number;
  is_published: boolean;
  is_usage_tracking: boolean;
  name: string;
  sections: SectionPayload[];
}

export interface QualityTemplatePayload {
  created_by: string;
  is_published: boolean;
  name: string;
  products: { product_id: string }[];
  sections: SectionPayload[];
}

export interface AssetTemplateUpdatePayload {
  updated_by: string;
  equipment_id: string;
  frequency_type: string;
  is_published: boolean;
  is_usage_tracking: boolean;
  name: string;
  sections: SectionPayload[];
}

export interface QualityTemplateUpdatePayload {
  is_published: boolean;
  name: string;
  product_ids: string[];
  sections: SectionPayload[];
}

export interface ItemControlPoint {
  control_point_id: string;
  label: string;
  color: string;
  value?: string;
}

export interface TemplateDetailItem {
  id: string;
  label: string;
  type: string;
  minValue: string;
  maxValue: string;
  controlPoints: ItemControlPoint[];
  sortOrder?: number;
}

export interface TemplateDetailSection {
  id: string;
  name: string;
  items: TemplateDetailItem[];
  sortOrder?: number;
}

export interface TemplateDetailProduct {
  productId: string;
  partName: string;
  partNumber: string;
}

export interface TemplateDetailReference {
  id: string;
  url: string;
  storageKey: string;
  uploadedAt: string;
}

export interface TemplateEquipmentUsage {
  currentUsage: string;
  frequencyTypeId: string;
  lastUsage: string;
  lastUsageDate: string;
  threshold: number;
}

export interface TemplateDetail {
  templateId: string;
  familyId: string;
  name: string;
  status: string;
  frequency: string;
  customDays: number;
  isUsageTracking: boolean;
  equipmentId: string;
  equipmentName: string;
  equipmentCode: string;
  equipmentUsage?: TemplateEquipmentUsage;
  sections: TemplateDetailSection[];
  products: TemplateDetailProduct[];
  references: TemplateDetailReference[];
  versionList: number[];
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  publishedAt: string;
}

export interface TemplateVersionHistoryEntry {
  version: number;
  status?: TemplateStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  publishedAt: string;
}

export type Params = Record<string, string | number | boolean | undefined>;
export interface ListPage<T> {
  items: T[];
  next_page_token?: string;
  total_count: number;
}
export interface Line {
  line_id: string;
  line_code: string;
  line_name?: string;
  group_id?: string;
  group_code?: string;
  product_id?: string;
  product_code?: string;
  product_name?: string;
  group_name?: string;
}
export interface MasterRecord {
  id: string;
  code?: string;
  name?: string;
  production_line_id?: string;
  part_number?: string;
  product_id?: string;
  production_line_group_id?: string;
  product_code?: string;
  product_name?: string;
  group_code?: string;
  group_name?: string;
  line_code?: string;
  line_name?: string;
  part_name?: string;
  label?: string;
}
export interface Thresholds {
  warning_pct: number;
  ng_pct: number;
  is_default?: boolean;
}
export interface FormulaToken {
  type: "variable" | "number" | "operator" | "lparen" | "rparen" | "function" | "comma";
  value?: string;
  number?: number;
  unit?: string;
  label?: string;
}
export interface FormulaVersion {
  id?: string;
  scope_level: string;
  scope_id?: string;
  scope_code?: string;
  name: string;
  version_no: number;
  status?: string;
  tokens?: FormulaToken[];
  reads_as?: string;
  effective_from?: string;
  updated_by?: string;
  updated_at?: string;
  is_system_default?: boolean;
}
export interface LineCapacity {
  line: Line;
  year?: number;
  month?: number;
  loading_pcs?: number;
  available_pcs?: number;
  capacity_pct?: number;
  status?: string;
  problem?: string;
  formula?: FormulaVersion;
  substituted?: string;
  values?: { code: string; label: string; unit?: string; value: number; source: string }[];
  cycle_time_seconds?: number;
  pcs_per_hour?: number;
  efficiency_pct?: number;
  daily_capacity_pcs?: number;
}
export interface Dashboard {
  total_lines: number;
  ng_lines?: Line[];
  warning_lines?: Line[];
  unknown_lines?: number;
  overall_capacity_pct?: number;
  overall_status?: string;
  uploads_today: number;
  latest_upload_at?: string;
  unmapped_part_count: number;
  thresholds?: Thresholds;
}
export interface ProductionPart {
  part_id: string;
  part_number: string;
  part_name?: string;
  model?: string;
  line: Line;
  loading_pcs?: number;
  line_status?: string;
  bottleneck?: boolean;
}
export interface ActivityPlan {
  id: string;
  activity: string;
  production_line_id?: string;
  line_code?: string;
  line?: Line;
  pic?: string;
  due_date?: string;
  status: string;
}
export interface UploadResult {
  id: string;
  kind: string;
  file_name: string;
  file_size_bytes: string;
  status: string;
  total_rows?: number;
  imported_rows?: number;
  unmatched_count?: number;
  log?: { level: string; message: string }[];
  created_at?: string;
}
export interface LoadingCapacity {
  lines?: {
    line: Line;
    points?: { offset: number; label: string; capacity?: LineCapacity; before?: LineCapacity }[];
  }[];
  thresholds: Thresholds;
}
export interface Overtime {
  id: string;
  code: string;
  production_line_id: string;
  line_code?: string;
  line?: Line;
  work_date: string;
  shift_type: string;
  hours: number;
  workers: number;
  reason: string;
}
export interface BridgingCase {
  id: string;
  code: string;
  source_line_code: string;
  target_line_code: string;
  part_number: string;
  qty: number;
  before_cap_pct?: number;
  before_status?: string;
  after_cap_pct?: number;
  after_status?: string;
  created_at?: string;
  status: string;
}
export interface BridgingInput {
  source_line_id: string;
  target_line_id: string;
  part_id: string;
  year: number;
  month: number;
  qty: number;
  plan?: string;
  note?: string;
}
export interface BridgingPreview {
  source_before: LineCapacity;
  source_after: LineCapacity;
  target_before: LineCapacity;
  target_after: LineCapacity;
}
export interface Trend {
  line: Line;
  months?: {
    month: number;
    capacity?: LineCapacity;
    previous_year?: LineCapacity;
    shift_capacities?: { shifts_per_day: number; capacity_pct?: number; available_pcs?: number; status?: string }[];
  }[];
  summary: string;
  thresholds: Thresholds;
}
export interface LineAssignments {
  global_default?: FormulaVersion;
  global_default_line_count: number;
  total_lines: number;
  items?: { line: Line; formula?: FormulaVersion; own?: boolean; upcoming?: FormulaVersion; upcoming_from?: string }[];
}
export interface FormulaCatalog {
  variables?: { code: string; label: string; unit?: string; group: string; description: string; source: string }[];
  constants?: { number: number; unit?: string; label?: string }[];
  templates?: { code: string; name: string; description: string; tokens: FormulaToken[]; reads_as: string }[];
}
export interface ScopeInfo {
  current?: FormulaVersion;
  inherited?: FormulaVersion;
  next_version_no: number;
  applies_to?: Line[];
  total_lines: number;
  overridden?: { line: Line; by: FormulaVersion }[];
}
export interface FormulaValidation {
  valid: boolean;
  error?: { code: string; message: string; token_index: number; suggestion?: { description: string; tokens: FormulaToken[] } };
  tokens?: FormulaToken[];
  reads_as?: string;
}
export interface FormulaImpactItem {
  line: Line;
  current?: LineCapacity;
  proposed?: LineCapacity;
  overridden_by?: FormulaVersion;
}
export interface FormulaPreview {
  valid?: boolean;
  error?: FormulaValidation["error"];
  in_scope?: FormulaImpactItem[];
  compared?: FormulaImpactItem[];
}
export interface FormulaReview {
  formula_version: FormulaVersion;
  replaces?: FormulaVersion;
  replaces_tokens?: { token: FormulaToken; changed: boolean }[];
  new_tokens?: { token: FormulaToken; changed: boolean }[];
  applies_to?: Line[];
  activation_blocker?: string;
  valid?: boolean;
  error?: FormulaValidation["error"];
  overridden?: { line: Line; by: FormulaVersion }[];
  total_lines?: number;
}
export interface FormulaImpact {
  year: number;
  month: number;
  items?: FormulaImpactItem[];
}
export interface FormulaDraft {
  scope_level: string;
  scope_ids: string[];
  name: string;
  tokens: FormulaToken[];
  effective_from: string;
}

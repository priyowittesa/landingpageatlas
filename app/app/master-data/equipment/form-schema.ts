import { z } from "zod";

/** Normalise an API date string (`YYYY-MM-DD...`) to the form display format. */
function toFormDate(value: string): string {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : "";
}

/** Convert a form date (`MM/dd/yyyy`) to the API's ISO `YYYY-MM-DD` format. */
function toApiDate(value: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1]}-${match[2]}` : undefined;
}

export const equipmentFormSchema = z.object({
  // Basic Information
  code: z.string().trim().min(1, "Equipment code is required.").max(50),
  name: z.string().trim().min(1, "Equipment name is required.").max(100),
  category: z.string().trim().min(1, "Category is required."),
  type_class: z.string().trim(),
  brand: z.string().trim().max(100),
  model: z.string().trim().max(100),
  serial_number: z.string().trim().max(100),
  description: z.string().trim().max(500),

  // Specifications
  specification: z.string().trim().max(255),
  manufacture_year: z.string().trim(),
  capacity_size: z.string().trim().max(100),
  capacity_unit: z.string().trim(),
  fuel_type: z.string().trim(),
  operating_weight: z.string().trim().max(100),
  operating_weight_unit: z.string().trim(),

  // Ownership & Location
  ownership_type: z.string().trim().min(1, "Ownership type is required."),
  owned_by: z.string().trim().min(1, "Owned by is required."),
  purchase_date: z.string().trim(),
  purchase_price: z.string().trim(),
  currency: z.string().trim(),
  supplier: z.string().trim().max(150),
  invoice_no: z.string().trim().max(100),
  warranty_start: z.string().trim(),
  warranty_end: z.string().trim(),
  country: z.string().trim().min(1, "Country is required."),
  state_province: z.string().trim(),
  city_region: z.string().trim(),
  site_location: z.string().trim().min(1, "Site / location is required."),
  department: z.string().trim(),
  project: z.string().trim(),
  detailed_address: z.string().trim().max(255),

  // Status & Usage
  status: z.string().trim().min(1, "Status is required."),
  condition: z.string().trim(),

  // Maintenance Threshold
  frequency_type_id: z.string().trim(),
  service_interval: z.string().trim().min(1, "Service interval is required.").refine(
    (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
    "Service interval must be a valid number.",
  ),
  warning_threshold: z.string().trim().min(1, "Warning threshold is required.").refine(
    (value) => Number.isFinite(Number(value)) && Number(value) >= 0,
    "Warning threshold must be a valid number.",
  ),
  is_auto_create_work_order: z.boolean(),
});

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;

export const EMPTY_EQUIPMENT_FORM: EquipmentFormValues = {
  code: "",
  name: "",
  category: "",
  type_class: "",
  brand: "",
  model: "",
  serial_number: "",
  description: "",
  specification: "",
  manufacture_year: "",
  capacity_size: "",
  capacity_unit: "",
  fuel_type: "",
  operating_weight: "",
  operating_weight_unit: "",
  ownership_type: "",
  owned_by: "",
  purchase_date: "",
  purchase_price: "",
  currency: "USD",
  supplier: "",
  invoice_no: "",
  warranty_start: "",
  warranty_end: "",
  country: "",
  state_province: "",
  city_region: "",
  site_location: "",
  department: "",
  project: "",
  detailed_address: "",
  status: "Active",
  condition: "",
  frequency_type_id: "",
  service_interval: "",
  warning_threshold: "",
  is_auto_create_work_order: false,
};

/** Raw equipment object returned by GET /v1/construction/equipment/{id}. */
export type EquipmentApiDetail = EquipmentApiPayload & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

/** Maps a GET /v1/construction/equipment/{id} response to form values. */
export function fromEquipmentApi(
  data: Record<string, unknown>,
): EquipmentFormValues {
  const str = (key: string): string => {
    const v = data[key];
    return v == null ? "" : String(v);
  };
  const numStr = (key: string): string => {
    const v = data[key];
    return v == null ? "" : String(v);
  };
  return {
    code: str("code"),
    name: str("name"),
    category: str("category_id"),
    type_class: str("type_class_id"),
    brand: str("brand_manufacturer"),
    model: str("model"),
    serial_number: str("serial_number_vin"),
    description: str("description"),
    specification: str("specification"),
    manufacture_year: numStr("manufacture_year"),
    capacity_size: numStr("capacity_size"),
    capacity_unit: str("capacity_unit_id"),
    fuel_type: str("fuel_type"),
    operating_weight: numStr("operating_weight"),
    operating_weight_unit: str("operating_weight_unit_id"),
    ownership_type: str("ownership_type"),
    owned_by: str("owned_by_company_id"),
    purchase_date: toFormDate(str("purchase_date")),
    purchase_price: numStr("purchase_price"),
    currency: str("purchase_price_currency") || "USD",
    supplier: str("supplier_vendor"),
    invoice_no: str("invoice_document_no"),
    warranty_start: toFormDate(str("warranty_start_date")),
    warranty_end: toFormDate(str("warranty_end_date")),
    country: str("country"),
    state_province: str("state_province"),
    city_region: str("city_region"),
    site_location: str("site_location"),
    department: str("department_id"),
    project: str("project_id"),
    detailed_address: str("detailed_address"),
    status: str("status") || "Active",
    condition: str("condition"),
    frequency_type_id: str("frequency_type_id"),
    service_interval: str("service_interval"),
    warning_threshold: str("warning_threshold"),
    is_auto_create_work_order:
      data.is_auto_create_work_order === true ||
      String(data.is_auto_create_work_order).toLowerCase() === "true",
  };
}

/** Payload shape expected by POST /v1/construction/equipment. */
export type EquipmentApiPayload = {
  brand_manufacturer?: string;
  capacity_size?: number;
  capacity_unit_id?: string;
  category_id?: string;
  city_region?: string;
  code: string;
  condition?: string;
  country?: string;
  department_id?: string;
  description?: string;
  detailed_address?: string;
  emission_standard?: string;
  engine_make?: string;
  engine_model?: string;
  engine_number?: string;
  engine_power?: string;
  fuel_type?: string;
  invoice_document_no?: string;
  location?: string;
  manufacture_year?: number;
  model?: string;
  name: string;
  notes?: string;
  operating_weight?: number;
  operating_weight_unit_id?: string;
  owned_by_company_id?: string;
  ownership_type?: string;
  power_rating?: string;
  project_id?: string;
  purchase_date?: string;
  purchase_price?: number;
  purchase_price_currency?: string;
  serial_number_vin?: string;
  site_location?: string;
  specification?: string;
  state_province?: string;
  status?: string;
  supplier_vendor?: string;
  transmission_type?: string;
  type_class_id?: string;
  warranty_end_date?: string;
  warranty_start_date?: string;
  frequency_type_id?: string;
  service_interval?: number;
  warning_threshold?: number;
  is_auto_create_work_order?: boolean;
};

const toNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Maps form values to the API payload, omitting empty optional fields so we do
 * not send blank strings for optional references (e.g. category_id).
 */
export function toEquipmentApiPayload(
  values: EquipmentFormValues,
): EquipmentApiPayload {
  const draft: EquipmentApiPayload = {
    code: values.code.trim(),
    name: values.name.trim(),
    category_id: values.category,
    type_class_id: values.type_class,
    brand_manufacturer: values.brand,
    model: values.model,
    serial_number_vin: values.serial_number,
    description: values.description,
    specification: values.specification,
    manufacture_year: toNumber(values.manufacture_year),
    capacity_size: toNumber(values.capacity_size),
    capacity_unit_id: values.capacity_unit,
    fuel_type: values.fuel_type,
    operating_weight: toNumber(values.operating_weight),
    operating_weight_unit_id: values.operating_weight_unit,
    ownership_type: values.ownership_type,
    owned_by_company_id: values.owned_by,
    purchase_date: toApiDate(values.purchase_date),
    purchase_price: toNumber(values.purchase_price),
    purchase_price_currency: values.currency,
    supplier_vendor: values.supplier,
    invoice_document_no: values.invoice_no,
    warranty_start_date: toApiDate(values.warranty_start),
    warranty_end_date: toApiDate(values.warranty_end),
    country: values.country,
    state_province: values.state_province,
    city_region: values.city_region,
    site_location: values.site_location,
    department_id: values.department,
    project_id: values.project,
    detailed_address: values.detailed_address,
    status: values.status,
    condition: values.condition,
    frequency_type_id: values.frequency_type_id,
    service_interval: toNumber(values.service_interval),
    warning_threshold: toNumber(values.warning_threshold),
    is_auto_create_work_order: values.is_auto_create_work_order,
  };

  return Object.fromEntries(
    Object.entries(draft).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as EquipmentApiPayload;
}

type Option = { label: string; value: string };

const toOptions = (values: string[]): Option[] =>
  values.map((value) => ({ label: value, value }));

export const CATEGORY_OPTIONS = toOptions([
  "Earthmoving",
  "Transport",
  "Lifting",
  "Power",
  "Support",
  "Material Handling",
]);

export const TYPE_CLASS_OPTIONS = toOptions([
  "Heavy Equipment",
  "Vehicle",
  "Machinery",
  "Power Tool",
  "Attachment",
  "Accessory",
]);

export const MANUFACTURE_YEAR_OPTIONS: Option[] = Array.from(
  { length: new Date().getFullYear() - 1989 },
  (_, index) => {
    const year = String(new Date().getFullYear() - index);
    return { label: year, value: year };
  },
);

export const CAPACITY_UNIT_OPTIONS = toOptions([
  "Ton",
  "Kg",
  "Liter",
  "m³",
  "HP",
  "kVA",
  "Unit",
]);

export const FUEL_TYPE_OPTIONS = toOptions([
  "Diesel",
  "Petrol",
  "Electric",
  "Hybrid",
  "Gas",
  "None",
]);

export const WEIGHT_UNIT_OPTIONS = toOptions(["kg", "ton", "lb"]);

export const OWNERSHIP_TYPE_OPTIONS = toOptions(["Owned", "Rented", "Leased"]);

export const OWNED_BY_OPTIONS = toOptions([
  "Company",
  "Client",
  "Subcontractor",
  "Third Party",
]);

export const CURRENCY_OPTIONS = toOptions(["USD", "IDR", "SGD", "EUR"]);

export const SITE_LOCATION_OPTIONS = toOptions([
  "Project Alpha",
  "Project Beta",
  "Project Gamma",
  "Project Delta",
  "Warehouse Main",
  "Head Office",
]);

export const DEPARTMENT_OPTIONS = toOptions([
  "Operations",
  "Logistics",
  "Maintenance",
  "Finance",
  "Human Resources",
]);

export const PROJECT_OPTIONS = toOptions([
  "Project Alpha",
  "Project Beta",
  "Project Gamma",
  "Project Delta",
]);

export const STATUS_OPTIONS = toOptions([
  "Active",
  "Under Maintenance",
  "Out of Service",
  "Inactive",
]);

export const CONDITION_OPTIONS = toOptions([
  "New",
  "Good",
  "Fair",
  "Poor",
  "Needs Repair",
]);

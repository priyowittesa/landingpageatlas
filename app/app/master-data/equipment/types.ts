import { z } from "zod";

export type EquipmentStatus =
  | "active"
  | "under_maintenance"
  | "out_of_service";

export type EquipmentOwnership = "owned" | "rented" | "leased";

export const EQUIPMENT_STATUS_LABEL: Record<EquipmentStatus, string> = {
  active: "Active",
  under_maintenance: "Under Maintenance",
  out_of_service: "Out of Service",
};

export const EQUIPMENT_OWNERSHIP_LABEL: Record<EquipmentOwnership, string> = {
  owned: "Owned",
  rented: "Rented",
  leased: "Leased",
};

export const equipmentSchema = z.object({
  code: z.string().trim().min(1, "Equipment code is required.").max(50),
  name: z.string().trim().min(1, "Equipment name is required.").max(100),
  category: z.string().trim().min(1, "Category is required.").max(100),
  model: z.string().trim().max(100),
  manufacturer: z.string().trim().max(100),
  serial_number: z.string().trim().max(100),
  status: z.enum(["active", "under_maintenance", "out_of_service"]),
  ownership: z.enum(["owned", "rented", "leased"]),
  location: z.string().trim().max(100),
  notes: z.string().trim().max(255),
});

export type EquipmentPayload = z.infer<typeof equipmentSchema>;

export interface Equipment extends EquipmentPayload {
  id: string;
}

export const EMPTY_EQUIPMENT: EquipmentPayload = {
  code: "",
  name: "",
  category: "",
  model: "",
  manufacturer: "",
  serial_number: "",
  status: "active",
  ownership: "owned",
  location: "",
  notes: "",
};

export function equipmentToPayload(equipment: Equipment): EquipmentPayload {
  const {
    code,
    name,
    category,
    model,
    manufacturer,
    serial_number,
    status,
    ownership,
    location,
    notes,
  } = equipment;
  return {
    code,
    name,
    category,
    model,
    manufacturer,
    serial_number,
    status,
    ownership,
    location,
    notes,
  };
}

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category_id: string;
  type_class_id: string;
  brand_manufacturer: string;
  model: string;
  serial_number_vin: string;
  status: string;
  ownership_type: string;
  site_location: string;
  city_region: string;
  country: string;
  state_province: string;
  condition: string;
  fuel_type: string;
  manufacture_year: number;
  capacity_size: number;
  capacity_unit_id: string;
  operating_weight: number;
  operating_weight_unit_id: string;
  department_id: string;
  project_id: string;
  owned_by_company_id: string;
  purchase_date: string;
  purchase_price: number;
  purchase_price_currency: string;
  supplier_vendor: string;
  invoice_document_no: string;
  warranty_start_date: string;
  warranty_end_date: string;
  detailed_address: string;
  description: string;
  specification: string;
  notes: string;
  location: string;
  emission_standard: string;
  engine_make: string;
  engine_model: string;
  engine_number: string;
  engine_power: string;
  power_rating: string;
  transmission_type: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentListResponse {
  items: EquipmentItem[];
  next_page_token: string;
  total_count: number;
}

export interface EquipmentListParams {
  category_id?: string;
  type_class_id?: string;
  department_id?: string;
  project_id?: string;
  owned_by_company_id?: string;
  status?: string;
  location?: string;
  page_size?: number;
  page_token?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export function normalizeStatus(value: string): EquipmentStatus {
  const normalized = value.toLowerCase().replace(/[ -]/g, "_");
  if (normalized === "under_maintenance" || normalized === "maintenance")
    return "under_maintenance";
  if (normalized === "out_of_service" || normalized === "inactive")
    return "out_of_service";
  return "active";
}

export function normalizeOwnership(value: string): EquipmentOwnership {
  const normalized = value.toLowerCase();
  if (normalized === "rented" || normalized === "rent") return "rented";
  if (normalized === "leased" || normalized === "lease") return "leased";
  return "owned";
}

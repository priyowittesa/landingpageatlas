import { z } from "zod";

export const frequencyTypeSchema = z.object({
  code: z.string().trim().min(1, "Frequency code is required."),
  name: z.string().trim().min(1, "Frequency type name is required."),
  category_id: z.string().min(1, "Category is required."),
  description: z.string().trim().max(255, "Description cannot exceed 255 characters."),
  unit_id: z.string().min(1, "Unit is required."),
  interval_value: z.number({ error: "Interval value is required." }).positive("Interval value must be greater than zero."),
  status: z.enum(["active", "inactive"]),
});

export type FrequencyTypePayload = z.infer<typeof frequencyTypeSchema>;

export type FrequencyTypeOption = {
  id: string;
  name: string;
  description?: string;
  value_type?: string;
  internal_value?: number;
};

export type FrequencyType = FrequencyTypePayload & {
  id: string;
  category_name: string;
  unit_name: string;
  updated_at: string;
};

export type FrequencyTypeAudit = {
  id: string;
  action: string;
  entityType: string;
  actorName: string;
  createdAt: string;
  description: string;
  statusBefore: string;
  statusAfter: string;
  dataBefore: Record<string, unknown>;
  dataAfter: Record<string, unknown>;
};

export const EMPTY_FREQUENCY_TYPE: FrequencyTypePayload = {
  code: "",
  name: "",
  category_id: "",
  description: "",
  unit_id: "",
  interval_value: 1,
  status: "active",
};

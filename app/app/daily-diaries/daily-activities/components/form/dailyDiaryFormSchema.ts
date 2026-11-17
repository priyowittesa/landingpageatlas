import { z } from "zod";

const equipmentEntrySchema = z.object({
  id: z.string(),
  model: z.string(),
  workType: z.string(),
  usedHours: z.number().min(0, "Used hours can't be negative"),
});

const activityEntrySchema = z.object({
  id: z.string(),
  desc: z.string(),
  name: z.string(),
  hours: z.number(),
});

const selectedEmployeeSchema = z.object({
  id: z.string(),
  labour_id: z.string(),
  name: z.string(),
  role: z.string(),
  sap: z.string().optional(),
  total_hours: z.number().min(0, "Total hours can't be negative"),
  break_time: z.number().min(0, "Break hours can't be negative"),
  equipments: z.array(equipmentEntrySchema),
  activities: z.array(activityEntrySchema),
});

const issueSchema = z.object({
  // Server-assigned id; absent for issues added locally and not yet saved.
  id: z.string().optional(),
  type: z.string().min(1, "Issue type is required"),
  delay_hours: z.number().min(0, "Delay hours can't be negative"),
  status: z.string().min(1, "Status is required"),
  description: z.string().min(1, "Description is required"),
  responsible_party: z.string().min(1, "Responsible party is required"),
  corrective_action: z.string().optional(),
});

export const dailyDiaryFormSchema = z.object({
  weather_condition: z.string().min(1, "Weather condition is required"),
  weather_temperature_c: z
    .number()
    .min(-50, "Temperature can't be less than -50°C")
    .max(60, "Temperature can't be more than 60°C"),
  weather_humidity_pct: z
    .number()
    .min(0, "Humidity can't be less than 0%")
    .max(100, "Humidity can't be more than 100%"),
  weather_wind_kmh: z.number().min(0, "Wind speed can't be negative"),
  weather_impact_on_work: z.string().min(1, "Impact on work is required"),
  site_conditions_notes: z
    .string()
    .min(1, "Site conditions notes are required"),
  execution_description: z.string().min(1, "Description is required"),
  execution_employees: z.array(selectedEmployeeSchema),
  issues: z.array(issueSchema),
});

export type DailyDiaryFormValues = z.infer<typeof dailyDiaryFormSchema>;
export type SelectedEmployee = z.infer<typeof selectedEmployeeSchema>;
export type DailyDiaryIssue = z.infer<typeof issueSchema>;
export type ActivityEntry = z.infer<typeof activityEntrySchema>;
export type EquipmentEntry = z.infer<typeof equipmentEntrySchema>;

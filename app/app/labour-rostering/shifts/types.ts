import { z } from "zod";

const timeField = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format.");
const durationField = z.string().regex(/^(?:([01]\d|2[0-3]):[0-5]\d|24:00)$/, "Use HH:mm format.");
const optionalTimeField = z.union([durationField, z.literal("")]);

export const shiftSchema = z
  .object({
    code: z.string().trim().min(1, "Shift code is required.").max(50),
    name: z.string().trim().min(1, "Shift name is required.").max(100),
    description: z.string().trim().max(255),
    start_time: timeField,
    end_time: timeField,
    is_overnight: z.boolean(),
    break_duration: durationField,
    auto_calculate_working_hours: z.boolean(),
    working_hours: durationField,
    allow_overtime: z.boolean(),
    overtime_threshold: optionalTimeField,
    minimum_working_hours: optionalTimeField,
    maximum_working_hours: optionalTimeField,
    notes: z.string().trim().max(255),
  })
  .refine(
    (data) => !data.allow_overtime || Boolean(data.overtime_threshold),
    { path: ["overtime_threshold"], message: "Overtime threshold is required when overtime is enabled." },
  )
  .refine(
    (data) =>
      !data.minimum_working_hours ||
      !data.maximum_working_hours ||
      timeToMinutes(data.minimum_working_hours) <= timeToMinutes(data.maximum_working_hours),
    { path: ["maximum_working_hours"], message: "Maximum hours must be greater than minimum hours." },
  );

export type ShiftPayload = z.infer<typeof shiftSchema>;

export type ShiftStatus = "active" | "inactive" | "on_leave";

export interface Shift extends ShiftPayload {
  id: string;
  shift_type: string;
  working_pattern: string;
  status: ShiftStatus;
}

export const EMPTY_SHIFT: ShiftPayload = {
  code: "",
  name: "",
  description: "",
  start_time: "07:00",
  end_time: "16:00",
  is_overnight: false,
  break_duration: "01:00",
  auto_calculate_working_hours: true,
  working_hours: "08:00",
  allow_overtime: false,
  overtime_threshold: "00:30",
  minimum_working_hours: "04:00",
  maximum_working_hours: "12:00",
  notes: "",
};

export function timeToMinutes(value: string): number {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const safeValue = Math.max(0, Math.min(Math.round(value), 24 * 60));
  return `${String(Math.floor(safeValue / 60)).padStart(2, "0")}:${String(safeValue % 60).padStart(2, "0")}`;
}

export function calculateWorkingHours(
  startTime: string,
  endTime: string,
  breakDuration: string,
  overnight: boolean,
): string {
  const start = timeToMinutes(startTime);
  let end = timeToMinutes(endTime);
  if (overnight && end <= start) end += 24 * 60;
  return minutesToTime(Math.max(0, end - start - timeToMinutes(breakDuration)));
}

export function shiftToPayload(shift: Shift): ShiftPayload {
  const {
    code,
    name,
    description,
    start_time,
    end_time,
    is_overnight,
    break_duration,
    auto_calculate_working_hours,
    working_hours,
    allow_overtime,
    overtime_threshold,
    minimum_working_hours,
    maximum_working_hours,
    notes,
  } = shift;
  return {
    code,
    name,
    description,
    start_time,
    end_time,
    is_overnight,
    break_duration,
    auto_calculate_working_hours,
    working_hours,
    allow_overtime,
    overtime_threshold,
    minimum_working_hours,
    maximum_working_hours,
    notes,
  };
}

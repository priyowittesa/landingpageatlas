import z from "zod";

export const employeeSchema = z.object({
  address: z.string().trim().max(255, "Max length is 255 characters.").optional(),
  code: z.string().trim().min(1, "Employee code is required."),
  date_of_birth: z.string().optional(),
  department_id: z.string().optional(),
  email: z.string().trim().email("Please enter a valid email address."),
  full_name: z.string().trim().min(1, "Full name is required."),
  gender: z.string().optional(),
  phone_number: z
    .string()
    .min(1, "Phone number is required.")
    .regex(/^\+?[0-9]{8,15}$/, "Please enter a valid phone number."),
  position_id: z.string().optional(),
  preferred_name: z.string().optional(),
  role_id: z.string().min(1, "Role is required."),
  type: z.string().min(1, "Employment type is required."),
  available_shift_ids: z.array(z.string()),

  // Additional employee fields.
  status: z.string().min(1, "Employment status is required."),
  contract_end_date: z.string().optional(),
  rate_card_id: z.string().optional(),
  cost_rate: z.string().optional(),
  note: z.string().max(255, "Max length is 255 characters.").optional(),
});

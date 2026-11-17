import { employeeSchema } from "@/app/app/master-data/components/schema";
import z from "zod";

export type Employee = {
  id: string;
  address: string;
  code: string;
  date_of_birth: string;
  department_id: string;
  department_name: string;
  email: string;
  full_name: string;
  gender: string;
  phone_number: string;
  position_id: string;
  position_name: string;
  preferred_name?: string;
  role_id: string;
  role_name: string;
  type: string;
  available_shift_ids?: string[];
  status: string;
  contract_end_date: string;
  rate_card_id: string;
  cost_rate: string;
  note: string;
  avatar_url?: string;
};

export type EmployeeForm = z.infer<typeof employeeSchema>;

export type EmployeePayload = {
  address: string;
  code: string;
  date_of_birth: string;
  department_id: string;
  email: string;
  full_name: string;
  gender: string;
  phone_number: string;
  position_id: string;
  preferred_name: string;
  role_id: string;
  type: string;
  available_shift_ids: string[];
  status: string;
  contract_end_date: string;
  rate_card_id: string;
  cost_rate: string;
  note: string;
};

export const EMPTY_EMPLOYEE: EmployeeForm = {
  address: "",
  code: "",
  date_of_birth: "",
  department_id: "",
  email: "",
  full_name: "",
  gender: "",
  phone_number: "",
  position_id: "",
  preferred_name: "",
  role_id: "",
  type: "",
  available_shift_ids: [],
  status: "",
  contract_end_date: "",
  rate_card_id: "",
  cost_rate: "",
  note: "",
};

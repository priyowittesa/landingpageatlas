import FormSelectField from "@/components/FormSelectField";
import type { SelectOption } from "@/components/FormSelectField";
import FormDateField from "@/components/FormDateField";
import { EmployeeForm } from "@/types/type-employee";
import { Control, FieldErrors } from "react-hook-form";

type EmployeeEmploymentInfoFieldProps = {
  errors: FieldErrors<EmployeeForm>;
  control: Control<EmployeeForm>;
  required: Record<keyof EmployeeForm, boolean>;
  departments: SelectOption[];
  positions: SelectOption[];
  roles: SelectOption[];
  labourTypes: SelectOption[];
  shifts: SelectOption[];
  loadingShifts: boolean;
  shiftsError: boolean;
  onAddDepartment: () => void;
  onAddPosition: () => void;
};
export default function EmployeeEmploymentInfoField({
  errors,
  required,
  control,
  departments,
  positions,
  roles,
  labourTypes,
  shifts,
  loadingShifts,
  shiftsError,
  onAddDepartment,
  onAddPosition,
}: EmployeeEmploymentInfoFieldProps) {
  return (
    <>
      <FormSelectField
        label="Department"
        name="department_id"
        control={control}
        error={errors.department_id}
        required={required.department_id}
        placeholder="Select department"
        options={departments}
        search
        className="col-span-2"
        onAddNew={onAddDepartment}
      />
      <FormSelectField
        label="Position"
        name="position_id"
        control={control}
        error={errors.position_id}
        required={required.position_id}
        placeholder="Select position"
        options={positions}
        search
        className="col-span-2"
        onAddNew={onAddPosition}
      />
      <FormSelectField
        label="Role"
        name="role_id"
        control={control}
        error={errors.role_id}
        required={required.role_id}
        placeholder="Select role"
        options={roles}
        search
        className="col-span-2"
      />
      <FormSelectField
        label="Employment Type"
        name="type"
        control={control}
        error={errors.type}
        required={required.type}
        placeholder="Select employment type"
        options={labourTypes}
        className="col-span-3"
      />
      <FormDateField
        label="Contract End Date"
        name="contract_end_date"
        control={control}
        error={errors.contract_end_date}
        required={required.contract_end_date}
        fromYear={new Date().getFullYear()}
        toYear={new Date().getFullYear() + 20}
        placeholder="YYYY-MM-DD"
        className="col-span-3"
      />
      <FormSelectField
        label="Available Shifts"
        name="available_shift_ids"
        control={control}
        error={errors.available_shift_ids}
        required={required.available_shift_ids}
        placeholder={
          loadingShifts ? "Loading shifts..." : "Select available shifts"
        }
        options={shifts}
        multiple
        search
        searchPlaceholder="Search shift..."
        emptyMessage={
          shiftsError ? "Failed to load shifts." : "No shift found."
        }
        className="col-span-6"
      />
    </>
  );
}

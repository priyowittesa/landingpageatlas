import FormDateField from "@/components/FormDateField";
import FormPhoneNumberField from "@/components/FormPhoneNumberField";
import FormSelectField from "@/components/FormSelectField";
import FormTextField from "@/components/FormTextField";
import { EmployeeForm } from "@/types/type-employee";
import { Control, FieldErrors, UseFormRegister } from "react-hook-form";

type EmployeeBasicInfoFieldProps = {
  isEdit?: boolean;
  register: UseFormRegister<EmployeeForm>;
  errors: FieldErrors<EmployeeForm>;
  control: Control<EmployeeForm>;
  required: Record<keyof EmployeeForm, boolean>;
  genders: { label: string; value: string }[];
  statuses: { label: string; value: string }[];
};
export default function EmployeeBasicInfoField({
  isEdit = false,
  register,
  errors,
  required,
  control,
  genders,
  statuses,
}: EmployeeBasicInfoFieldProps) {
  return (
    <>
      <FormTextField
        label="Employee Code"
        name="code"
        register={register}
        error={errors.code}
        required={required.code}
        placeholder="e.g. EMP-00128"
        disabled={isEdit}
        className="col-span-2"
      />
      <FormTextField
        label="Full Name"
        name="full_name"
        register={register}
        error={errors.full_name}
        required={required.full_name}
        placeholder="Enter full name"
        className="col-span-2"
      />
      <FormTextField
        label="Preferred Name"
        name="preferred_name"
        register={register}
        error={errors.preferred_name}
        required={required.preferred_name}
        placeholder="Enter preferred name"
        className="col-span-2"
      />
      <FormTextField
        label="Email"
        name="email"
        register={register}
        error={errors.email}
        required={required.email}
        placeholder="Enter email address"
        className="col-span-3"
      />
      <FormPhoneNumberField
        label="Phone Number"
        name="phone_number"
        control={control}
        error={errors.phone_number}
        required={required.phone_number}
        defaultDialCode="62"
        className="col-span-3"
      />
      <FormSelectField
        label="Gender"
        name="gender"
        control={control}
        error={errors.gender}
        required={required.gender}
        search={false}
        placeholder="Select gender"
        options={genders}
        className="col-span-3"
      />
      <FormDateField
        label="Date of Birth"
        name="date_of_birth"
        control={control}
        error={errors.date_of_birth}
        required={required.date_of_birth}
        toYear={new Date().getFullYear()}
        placeholder="YYYY-MM-DD"
        className="col-span-3"
      />
      <FormTextField
        label="Address"
        name="address"
        as="textarea"
        register={register}
        error={errors.address}
        required={required.address}
        placeholder="Enter complete home address"
        className="col-span-6"
      />
      <FormSelectField
        label="Employment Status"
        name="status"
        control={control}
        error={errors.status}
        required={required.status}
        placeholder="Select employment status"
        options={statuses}
        className="col-span-6"
      />
    </>
  );
}

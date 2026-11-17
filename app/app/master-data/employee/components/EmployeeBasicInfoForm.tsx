import { useFormContext } from "react-hook-form";
import { Users } from "lucide-react";
import { EmployeeForm } from "@/types/type-employee";
import { getRequiredFields } from "@/lib/is-field-required";
import { employeeSchema } from "../../components/schema";
import EmployeeBasicInfoField from "./EmployeeBasicInfoField";
import { EmployeeSection } from "./employee-section";

const required = getRequiredFields(employeeSchema);

export default function EmployeeBasicInfoForm({
  isEdit = false,
  genders,
  statuses,
}: {
  isEdit?: boolean;
  genders: { label: string; value: string }[];
  statuses: { label: string; value: string }[];
}) {
  const methods = useFormContext<EmployeeForm>();

  return (
    <EmployeeSection
      title="Basic Information"
      subtitle="Enter the employee's personal details."
      icon={Users}
    >
      <div className="grid grid-cols-6 gap-4">
        <EmployeeBasicInfoField
          isEdit={isEdit}
          register={methods.register}
          errors={methods.formState.errors}
          control={methods.control}
          required={required}
          genders={genders}
          statuses={statuses}
        />
      </div>
    </EmployeeSection>
  );
}

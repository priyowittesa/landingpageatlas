import { useFormContext } from "react-hook-form";
import { IdCard } from "lucide-react";
import { EmployeeForm } from "@/types/type-employee";
import { getRequiredFields } from "@/lib/is-field-required";
import { employeeSchema } from "../../components/schema";
import EmployeeEmploymentInfoField from "./EmployeeEmploymentInfoField";
import type { SelectOption } from "@/components/FormSelectField";
import { EmployeeSection } from "./employee-section";

const required = getRequiredFields(employeeSchema);

export default function EmployeeEmploymentInfoForm({
  departments,
  positions,
  roles,
  labourTypes,
  shifts,
  loadingShifts,
  shiftsError,
  onAddDepartment,
  onAddPosition,
}: {
  departments: SelectOption[];
  positions: SelectOption[];
  roles: SelectOption[];
  labourTypes: SelectOption[];
  shifts: SelectOption[];
  loadingShifts: boolean;
  shiftsError: boolean;
  onAddDepartment: () => void;
  onAddPosition: () => void;
}) {
  const methods = useFormContext<EmployeeForm>();

  return (
    <EmployeeSection
      title="Job Information"
      subtitle="Enter the employment and organizational information."
      icon={IdCard}
    >
      <div className="grid grid-cols-6 gap-4">
        <EmployeeEmploymentInfoField
          errors={methods.formState.errors}
          control={methods.control}
          required={required}
          departments={departments}
          positions={positions}
          roles={roles}
          labourTypes={labourTypes}
          shifts={shifts}
          loadingShifts={loadingShifts}
          shiftsError={shiftsError}
          onAddDepartment={onAddDepartment}
          onAddPosition={onAddPosition}
        />
      </div>
    </EmployeeSection>
  );
}

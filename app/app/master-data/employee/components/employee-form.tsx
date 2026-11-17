"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import PageHeader from "@/components/PageHeader";
import type { SelectOption } from "@/components/FormSelectField";
import { Button } from "@/components/ui/button";
import AddDepartmentDialog from "@/components/quick-add/AddDepartmentDialog";
import AddPositionDialog from "@/components/quick-add/AddPositionDialog";
import type { RefOption } from "@/hooks/useConstructionRefs";
import { employeeSchema } from "../../components/schema";
import type { RateCardPayload } from "../../rate-cards/types";
import {
  EMPTY_EMPLOYEE,
  type EmployeeForm as EmployeeFormValues
} from "@/types/type-employee";
import EmployeeBasicInfoForm from "./EmployeeBasicInfoForm";
import EmployeeEmploymentInfoForm from "./EmployeeEmploymentInfoForm";
import EmployeeNotesForm from "./EmployeeNotesForm";
import EmployeePlanningForm from "./EmployeePlanningForm";
import { useRateCards } from "../../rate-cards/use-rate-cards";
import { useShifts } from "../../../labour-rostering/shifts/use-shifts";
import {
  useEmployeeDepartments,
  useEmployeePositions,
  useEmployeeRoles,
  useLabourEnums
} from "../use-employees";

export type RateCardOption = SelectOption & {
  baseRate: number;
  unit: RateCardPayload["unit"];
};

interface EmployeeFormProps {
  isEdit?: boolean;
  title: string;
  description: string;
  initialValues?: EmployeeFormValues;
  pending: boolean;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (payload: EmployeeFormValues) => void | Promise<void>;
}

export function EmployeeForm({
  isEdit = false,
  title,
  description,
  initialValues = EMPTY_EMPLOYEE,
  pending,
  submitLabel,
  onCancel,
  onSubmit
}: EmployeeFormProps) {
  const methods = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: initialValues
  });
  const { reset } = methods;
  const [quickAdd, setQuickAdd] = useState<"department" | "position" | null>(null);
  const [createdDepartments, setCreatedDepartments] = useState<RefOption[]>([]);
  const [createdPositions, setCreatedPositions] = useState<RefOption[]>([]);
  const { data: departments = [] } = useEmployeeDepartments();
  const { data: positions = [] } = useEmployeePositions();
  const { data: roles = [] } = useEmployeeRoles();
  const { data: labourEnums } = useLabourEnums();
  const { data: rateCards = [] } = useRateCards();
  const {
    data: shifts = [],
    isLoading: loadingShifts,
    isError: shiftsError
  } = useShifts();

  useEffect(() => reset(initialValues), [initialValues, reset]);

  const referenceOptions = useMemo(
    () => ({
      departments: [
        ...departments.map((item) => ({ label: item.name, value: item.id })),
        ...createdDepartments.filter(
          (created) => !departments.some((item) => item.id === created.value),
        ),
      ],
      positions: [
        ...positions.map((item) => ({ label: item.name, value: item.id })),
        ...createdPositions.filter(
          (created) => !positions.some((item) => item.id === created.value),
        ),
      ],
      roles: roles.map((item) => ({ label: item.name, value: item.id })),
      genders: (labourEnums?.labour_gender ?? []).map((item) => ({
        label: item.label,
        value: item.value
      })),
      statuses: (labourEnums?.labour_status ?? []).map((item) => ({
        label: item.label,
        value: item.value
      })),
      labourTypes: (labourEnums?.labour_type ?? []).map((item) => ({
        label: item.label,
        value: item.value
      })),
      rateCards: rateCards.map((item) => ({
        label: `${item.code} - ${item.name}`,
        value: item.id,
        baseRate: item.base_rate,
        unit: item.unit
      })),
      shifts: shifts.map((item) => ({
        label: `${item.code} - ${item.name}`,
        value: item.id
      }))
    }),
    [createdDepartments, createdPositions, departments, labourEnums, positions, rateCards, roles, shifts]
  );

  const handleCreated = (type: "department" | "position", option: RefOption) => {
    if (type === "department") {
      setCreatedDepartments((current) => [...current, option]);
      methods.setValue("department_id", option.value, { shouldValidate: true });
    } else {
      setCreatedPositions((current) => [...current, option]);
      methods.setValue("position_id", option.value, { shouldValidate: true });
    }
    setQuickAdd(null);
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeader title={title} subtitle={description} />

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
          <EmployeeBasicInfoForm
            isEdit={isEdit}
            genders={referenceOptions.genders}
            statuses={referenceOptions.statuses}
          />
          <EmployeeEmploymentInfoForm
            {...referenceOptions}
            loadingShifts={loadingShifts}
            shiftsError={shiftsError}
            onAddDepartment={() => setQuickAdd("department")}
            onAddPosition={() => setQuickAdd("position")}
          />
          <EmployeePlanningForm rateCards={referenceOptions.rateCards} />
          <EmployeeNotesForm />

          <div className="flex justify-between rounded-md bg-white px-5 py-4 shadow-md">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending} className="min-w-36">
              <Save className="h-4 w-4" />
              {pending ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </FormProvider>

      <AddDepartmentDialog
        open={quickAdd === "department"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onCreated={(option) => handleCreated("department", option)}
      />
      <AddPositionDialog
        open={quickAdd === "position"}
        onOpenChange={(open) => !open && setQuickAdd(null)}
        onCreated={(option) => handleCreated("position", option)}
      />
    </div>
  );
}

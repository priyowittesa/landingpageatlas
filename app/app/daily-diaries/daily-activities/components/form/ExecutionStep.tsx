"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { ChevronDown, ChevronUp, CircleHelp, Trash2 } from "lucide-react";
import FormTextField from "@/components/FormTextField";
import { GuidanceBanner } from "./GuidanceBanner";
import { EmployeeModal } from "./EmployeeModal";
import { ActivityModal } from "./ActivityModal";
import { EquipmentModal } from "./EquipmentModal";
import AddButton from "@/components/AddButton";
import { useGetProjectActivities } from "../../hooks/useDailyDiaries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
// import {
//   ActivityEntry,
//   DailyDiaryFormValues,
//   SelectedEmployee,
// } from "@/types/type-daily-diaries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ActivityEntry,
  DailyDiaryFormValues,
  EquipmentEntry,
  SelectedEmployee
} from "./dailyDiaryFormSchema";

const ROWS_PER_PAGE = 5;
const ACTIVITY_GRID_COLUMNS =
  "minmax(220px,1.4fr) minmax(185px,1fr) 130px 130px 36px";

function totalActivityHours(employee: SelectedEmployee) {
  return employee.activities.reduce(
    (total, activity) => total + (Number(activity.hours) || 0),
    0
  );
}

function clampHours(value: number, max: number) {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(value, Math.max(0, max));
}

export function ExecutionStep({
  form,
  onBlurSave
}: {
  form: UseFormReturn<DailyDiaryFormValues>;
  onBlurSave?: () => void;
}) {
  const params = useParams();

  const selectedEmployees =
    useWatch({ control: form.control, name: "execution_employees" }) ?? [];

  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalEmployeeId, setActivityModalEmployeeId] = useState<
    string | null
  >(null);
  const [equipmentModalEmployeeId, setEquipmentModalEmployeeId] = useState<
    string | null
  >(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  function addActivities(values: ActivityEntry[]) {
    form.setValue(
      "execution_employees",
      selectedEmployees.map((employee) => ({
        ...employee,
        activities: values
      })),
      { shouldDirty: true }
    );
  }

  function addActivitiesToEmployee(
    employeeId: string,
    values: ActivityEntry[]
  ) {
    form.setValue(
      "execution_employees",
      selectedEmployees.map((employee) =>
        String(employee.id) === String(employeeId)
          ? { ...employee, activities: values }
          : employee
      ),
      { shouldDirty: true }
    );
  }

  function setSelectedEmployees(employees: SelectedEmployee[]) {
    form.setValue("execution_employees", employees, { shouldDirty: true });
  }

  function updateEmployee(
    employeeId: string,
    patch: Partial<SelectedEmployee>
  ) {
    setSelectedEmployees(
      selectedEmployees.map((employee) =>
        String(employee.id) === String(employeeId)
          ? { ...employee, ...patch }
          : employee
      )
    );
  }

  function setEquipmentsForEmployee(
    employeeId: string,
    equipments: EquipmentEntry[]
  ) {
    updateEmployee(employeeId, { equipments });
  }

  function removeEmployee(employeeId: string) {
    setSelectedEmployees(
      selectedEmployees.filter(
        (employee) => String(employee.id) !== String(employeeId)
      )
    );

    if (String(expandedEmployee) === String(employeeId)) {
      setExpandedEmployee(null);
    }
  }

  function updateEquipment(
    employeeId: string,
    equipmentId: string,
    patch: Partial<EquipmentEntry>
  ) {
    const employee = selectedEmployees.find(
      (item) => String(item.id) === String(employeeId)
    );
    if (!employee) return;

    updateEmployee(employeeId, {
      equipments: employee.equipments.map((equipment) =>
        equipment.id === equipmentId ? { ...equipment, ...patch } : equipment
      )
    });
  }

  function updateActivityHours(
    employeeId: string,
    activityId: string,
    hours: number
  ) {
    const employee = selectedEmployees.find(
      (item) => String(item.id) === String(employeeId)
    );
    if (!employee) return;

    updateEmployee(employeeId, {
      activities: employee.activities.map((activity) =>
        activity.id === activityId ? { ...activity, hours } : activity
      )
    });
  }

  const { data: activityData, isLoading: activityLoading } =
    useGetProjectActivities({ project_id: params.projectId as string });

  const activityModalEmployee = selectedEmployees.find(
    (employee) => String(employee.id) === String(activityModalEmployeeId)
  );
  const equipmentModalEmployee = selectedEmployees.find(
    (employee) => String(employee.id) === String(equipmentModalEmployeeId)
  );

  const pageCount = Math.max(
    1,
    Math.ceil(selectedEmployees.length / ROWS_PER_PAGE)
  );
  const currentPage = Math.min(page, pageCount - 1);
  const visibleEmployees = selectedEmployees.slice(
    currentPage * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE
  );

  return (
    <div>
      <GuidanceBanner step="execution" />
      <div className="mt-3">
        <FormTextField
          label="Description"
          name="execution_description"
          as="textarea"
          rows={3}
          placeholder="Input Description"
          register={form.register}
          error={form.formState.errors.execution_description}
          inputClassName="min-h-20 resize-none text-xs"
          required
          onBlur={onBlurSave}
        />
      </div>

      <section className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <AddButton
            label="Add Employee"
            onClick={() => setEmployeeModalOpen(true)}
          />
          <AddButton
            label="Add Activity"
            onClick={() => setActivityModalOpen(true)}
            disabled={selectedEmployees.length === 0}
          />
        </div>

        <div
          className="mt-4 grid min-w-[730px] items-center gap-2 px-4 text-sm text-gray-500"
          style={{ gridTemplateColumns: ACTIVITY_GRID_COLUMNS }}
        >
          <span>Employee</span>
          <span className="flex items-center gap-1">
            Activity <CircleHelp className="h-3.5 w-3.5" />
          </span>
          <span>Total Hours</span>
          <span>Break Hours</span>
          <span className="sr-only">Actions</span>
        </div>

        <div className="mt-2 min-w-[730px] space-y-2 pb-1">
          {selectedEmployees.length ? (
            visibleEmployees.map((employee) => {
              const expanded = String(employee.id) === String(expandedEmployee);
              const activityHours = totalActivityHours(employee);
              const maxBreakHours = Math.max(
                0,
                employee.total_hours - activityHours
              );
              const remainingHours =
                employee.total_hours - employee.break_time - activityHours;

              return (
                <div
                  key={employee.id}
                  className={cn(
                    "overflow-hidden rounded-lg border",
                    expanded ? "border-primary-300" : "border-gray-200"
                  )}
                >
                  <div
                    className={cn(
                      "grid min-w-[730px] items-center gap-2 p-3",
                      expanded && "bg-primary-50/60"
                    )}
                    style={{ gridTemplateColumns: ACTIVITY_GRID_COLUMNS }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedEmployee(expanded ? null : employee.id)
                      }
                      className="flex min-w-0 items-center text-left"
                    >
                      <span className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-600 text-white">
                        {expanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </span>
                      <span className="min-w-0 text-sm">
                        <strong className="block truncate font-semibold">
                          {employee.name}
                        </strong>
                        <span className="block truncate text-gray-500">
                          {employee.role}
                        </span>
                      </span>
                    </button>

                    <div
                      className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1"
                      title={employee.activities
                        .map((activity) => activity.name)
                        .join(", ")}
                    >
                      {employee.activities.length === 0 ? (
                        <span className="text-sm text-gray-400">-</span>
                      ) : (
                        <>
                          <span className="min-w-0 truncate rounded-sm border border-primary-300 bg-primary-50 px-2 py-0.5 text-xs text-primary-600">
                            {employee.activities[0].name}
                          </span>
                          {employee.activities.length > 1 && (
                            <span className="shrink-0 rounded-sm border border-primary-300 bg-primary-50 px-2 py-0.5 text-xs text-primary-600">
                              +{employee.activities.length - 1}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <input
                      type="number"
                      min={0}
                      value={
                        employee.total_hours === 0 ? "" : employee.total_hours
                      }
                      onChange={(event) =>
                        updateEmployee(employee.id, {
                          total_hours: Number(event.target.value)
                        })
                      }
                      onBlur={onBlurSave}
                      className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
                    />

                    <input
                      type="number"
                      min={0}
                      max={maxBreakHours}
                      title={`Maximum ${maxBreakHours}h (total hours minus activity hours)`}
                      value={
                        employee.break_time === 0 ? "" : employee.break_time
                      }
                      onChange={(event) =>
                        updateEmployee(employee.id, {
                          break_time: clampHours(
                            Number(event.target.value),
                            maxBreakHours
                          )
                        })
                      }
                      onBlur={onBlurSave}
                      className="h-8 w-full rounded-md border border-gray-200 bg-white px-2 text-sm"
                    />

                    <button
                      type="button"
                      aria-label={`Remove ${employee.name}`}
                      onClick={() => {
                        removeEmployee(employee.id);
                        onBlurSave?.();
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {expanded && (
                    <div className="border-t border-gray-100 p-3 text-sm flex flex-col gap-4">
                      <span className="font-bold">Other Details</span>
                      <Table containerClassName="rounded-md border">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-medium text-muted-foreground p-2 bg-white">
                              Equipment
                            </TableHead>
                            <TableHead className="font-medium text-muted-foreground p-2 bg-white">
                              Work Type
                            </TableHead>
                            <TableHead className="font-medium text-muted-foreground p-2 bg-white w-40">
                              Used Hours
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {employee.equipments.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center">
                                No equipment
                              </TableCell>
                            </TableRow>
                          ) : (
                            employee.equipments.map((equipment) => (
                              <TableRow key={equipment.id}>
                                <TableCell className="pl-2">
                                  {equipment.model}
                                </TableCell>
                                <TableCell className="pl-2">
                                  <Select
                                    value={equipment.workType}
                                    onValueChange={(value) => {
                                      updateEquipment(
                                        employee.id,
                                        equipment.id,
                                        { workType: value }
                                      );
                                      onBlurSave?.();
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-full rounded-md text-sm shadow-none">
                                      <SelectValue placeholder="Choose Work Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="normal">
                                        Normal
                                      </SelectItem>
                                      <SelectItem value="overtime">
                                        Overtime
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="pl-2">
                                  <input
                                    type="number"
                                    min={0}
                                    value={
                                      equipment.usedHours === 0
                                        ? ""
                                        : equipment.usedHours
                                    }
                                    onChange={(event) =>
                                      updateEquipment(
                                        employee.id,
                                        equipment.id,
                                        {
                                          usedHours: Number(event.target.value)
                                        }
                                      )
                                    }
                                    onBlur={onBlurSave}
                                    className="h-8 w-full rounded-md border border-gray-200 px-2 text-sm"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit text-primary-600"
                        onClick={() => setEquipmentModalEmployeeId(employee.id)}
                      >
                        + Add Equipment
                      </Button>

                      <span className="font-bold">Activity Details</span>
                      <Table containerClassName="rounded-md border">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-medium text-muted-foreground p-2 bg-white">
                              Activity
                            </TableHead>
                            <TableHead className="font-medium text-muted-foreground p-2 bg-white">
                              Hours
                            </TableHead>
                            <TableHead className="font-medium text-muted-foreground p-2 bg-white">
                              Description
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {employee.activities.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center">
                                No activity
                              </TableCell>
                            </TableRow>
                          ) : (
                            employee.activities.map((activity) => {
                              const maxActivityHours = Math.max(
                                0,
                                employee.total_hours -
                                  employee.break_time -
                                  (activityHours -
                                    (Number(activity.hours) || 0))
                              );

                              return (
                                <TableRow key={activity.id}>
                                  <TableCell className="pl-2">
                                    {activity.name}
                                  </TableCell>
                                  <TableCell className="pl-2 w-40">
                                    <input
                                      type="number"
                                      min={0}
                                      max={maxActivityHours}
                                      title={`Maximum ${maxActivityHours}h (total hours minus break and other activities)`}
                                      value={
                                        activity.hours === 0
                                          ? ""
                                          : activity.hours
                                      }
                                      onChange={(event) =>
                                        updateActivityHours(
                                          employee.id,
                                          activity.id,
                                          clampHours(
                                            Number(event.target.value),
                                            maxActivityHours
                                          )
                                        )
                                      }
                                      onBlur={onBlurSave}
                                      className="h-8 w-full rounded-md border border-gray-200 px-2 text-sm"
                                    />
                                  </TableCell>
                                  <TableCell className="pl-2">
                                    {activity.desc}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>

                      <span
                        className={cn(
                          "text-xs",
                          remainingHours < 0 ? "text-red-600" : "text-gray-500"
                        )}
                      >
                        {remainingHours < 0
                          ? `Break and activity hours exceed total hours by ${Math.abs(remainingHours)}h.`
                          : `${remainingHours}h of ${employee.total_hours}h still unallocated.`}
                      </span>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit text-primary-600"
                        onClick={() => setActivityModalEmployeeId(employee.id)}
                      >
                        + Add Activity
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-gray-200 py-7 text-center text-sm text-gray-400">
              Add employees to start recording work hours.
            </div>
          )}
        </div>

        {selectedEmployees.length > 0 && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500">
              {visibleEmployees.length} of {selectedEmployees.length} Row(s)
              Shown.
            </span>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="px-4"
                disabled={currentPage === 0}
                onClick={() => setPage(Math.max(0, currentPage - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                className="px-4"
                disabled={currentPage >= pageCount - 1}
                onClick={() =>
                  setPage(Math.min(pageCount - 1, currentPage + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </section>

      {employeeModalOpen && (
        <EmployeeModal
          selected={selectedEmployees}
          onSave={(employees) => {
            setSelectedEmployees(employees);
            onBlurSave?.();
          }}
          onClose={() => setEmployeeModalOpen(false)}
        />
      )}

      {activityModalOpen && (
        <ActivityModal
          selected={selectedEmployees}
          onSave={(values) => {
            addActivities(values);
            onBlurSave?.();
          }}
          onClose={() => setActivityModalOpen(false)}
          activities={activityData?.items}
          isLoading={activityLoading}
          projectId={params.projectId as string}
        />
      )}

      {activityModalEmployeeId !== null && activityModalEmployee && (
        <ActivityModal
          selected={[activityModalEmployee]}
          onSave={(values) => {
            addActivitiesToEmployee(activityModalEmployeeId, values);
            onBlurSave?.();
          }}
          onClose={() => setActivityModalEmployeeId(null)}
          activities={activityData?.items}
          isLoading={activityLoading}
          projectId={params.projectId as string}
        />
      )}

      {equipmentModalEmployeeId !== null && equipmentModalEmployee && (
        <EquipmentModal
          selected={equipmentModalEmployee.equipments}
          onSave={(values) => {
            setEquipmentsForEmployee(equipmentModalEmployeeId, values);
            onBlurSave?.();
          }}
          onClose={() => setEquipmentModalEmployeeId(null)}
        />
      )}
    </div>
  );
}

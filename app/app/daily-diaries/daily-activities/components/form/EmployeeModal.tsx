"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormModal } from "./FormModal";
import { useLabourMembers } from "@/app/app/master-data/projects/use-projects";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { getInitials } from "@/lib/text-manipulation";
import { Button } from "@/components/ui/button";
import type { SelectedEmployee } from "./dailyDiaryFormSchema";

export function EmployeeModal({
  selected,
  onSave,
  onClose
}: {
  selected: SelectedEmployee[];
  onSave: (employees: SelectedEmployee[]) => void;
  onClose: () => void;
}) {
  const params = useParams();

  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string[]>(
    selected.map((employee) => String(employee.id))
  );

  const { data, isLoading } = useLabourMembers({
    projectId: params.projectId as string
  });
  const employees = data?.members;

  const filtered = useMemo(
    () =>
      employees?.filter((employee) =>
        employee.labour_name.toLowerCase().includes(query.toLowerCase())
      ),
    [query, employees]
  );

  const isAddDisabled = chosen.length === 0;

  function toggleChosen(employeeId: string) {
    setChosen((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    );
  }

  function handleAddEmployee() {
    if (!employees) return;

    const result: SelectedEmployee[] = employees
      .filter((employee) => chosen.includes(String(employee.id)))
      .map((employee) => {
        const previous = selected.find(
          (item) => String(item.id) === String(employee.id)
        );

        return {
          ...employee,
          id: employee.id,
          labour_id: employee.labour_id,
          name: employee.labour_name,
          role: employee.labour_role_name,
          sap: previous?.sap ?? "",
          total_hours: previous?.total_hours ?? 0,
          break_time: previous?.break_time ?? 0,
          equipments: previous?.equipments ?? [],
          activities: previous?.activities ?? []
        } as unknown as SelectedEmployee;
      });

    onSave(result);
    onClose();
  }

  return (
    <FormModal
      title="Add Employee"
      description="Search and select employees to add"
      onClose={onClose}
    >
      <label className="relative block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Employee"
          className="h-10 w-full rounded-md border border-gray-200 pl-9 pr-3 text-xs outline-none focus:border-primary-400"
        />
      </label>

      <div className="mt-3 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-50">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : !employees ? (
          <p className="h-50 flex items-center justify-center text-sm text-gray-500">
            No employee data
          </p>
        ) : (
          filtered?.map((employee) => {
            const isChosen = chosen.includes(String(employee.id));

            return (
              <div
                key={employee.id}
                role="button"
                tabIndex={0}
                onClick={() => toggleChosen(String(employee.id))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleChosen(String(employee.id));
                  }
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3",
                  isChosen
                    ? "border-primary-300 bg-primary-50/30"
                    : "border-gray-200"
                )}
              >
                <Checkbox
                  checked={isChosen}
                  onCheckedChange={() => toggleChosen(String(employee.id))}
                  onClick={(event) => event.stopPropagation()}
                />

                <span className="flex min-w-0 flex-1 items-center text-left text-sm">
                  <span className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm text-white">
                    {getInitials(employee.labour_name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate">
                      {employee.labour_name}
                    </strong>
                    <span className="block text-gray-500">
                      {employee.labour_role_name}
                    </span>
                  </span>
                  <span className="text-sm space-x-3">
                    <span>SAP#: (SAP ID)</span>
                    <span className="font-semibold">ATLAS</span>
                  </span>
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          className="px-3 py-2 text-xs"
        >
          Cancel
        </Button>

        <Button
          onClick={handleAddEmployee}
          disabled={isAddDisabled}
          className="rounded-md bg-primary-700 px-3 py-2 text-xs text-white"
        >
          Add +
        </Button>
      </div>
    </FormModal>
  );
}

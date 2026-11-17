"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { EmployeeForm } from "../../components/employee-form";
import {
  employeeToForm,
  useEmployee,
  useUpdateEmployee,
} from "../../use-employees";

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: employee, isLoading, isError, refetch } = useEmployee(id);
  const updateEmployee = useUpdateEmployee();

  useEffect(() => {
    if (!employee) return;

    setBreadcrumbItems([
      { title: "Master Data" },
      { title: "Employees", href: "/app/master-data/employee" },
      { title: employee.full_name },
      { title: "Edit" },
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, employee, setBreadcrumbItems]);

  if (isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
        Loading employee...
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
        <p className="text-sm text-muted-foreground">
          Employee details could not be loaded.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <EmployeeForm
      isEdit
      title="Edit Employee"
      description="Update employee information."
      initialValues={employeeToForm(employee)}
      pending={updateEmployee.isPending}
      submitLabel="Save Changes"
      onCancel={() => router.push("/app/master-data/employee")}
      onSubmit={(payload) =>
        updateEmployee.mutate(
          { id, payload },
          { onSuccess: () => router.push("/app/master-data/employee") },
        )
      }
    />
  );
}

"use client";

import { useRouter } from "next/navigation";

import { EmployeeForm } from "../components/employee-form";
import { useCreateEmployee } from "../use-employees";

export default function AddEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  return (
    <EmployeeForm
      title="Add Employee"
      description="Create a new employee record in the system."
      pending={createEmployee.isPending}
      submitLabel="Save Employee"
      onCancel={() => router.push("/app/master-data/employee")}
      onSubmit={(payload) =>
        createEmployee.mutate(payload, {
          onSuccess: () => router.push("/app/master-data/employee"),
        })
      }
    />
  );
}

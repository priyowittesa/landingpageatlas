"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { ShiftForm } from "../../components/shift-form";
import { shiftToPayload } from "../../types";
import { useShift, useUpdateShift } from "../../use-shifts";

export default function EditShiftPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: shift, isLoading, isError, refetch } = useShift(id);
  const updateShift = useUpdateShift();

  useEffect(() => {
    if (!shift) return;

    setBreadcrumbItems([
      { title: "Labour Rostering" },
      { title: "Shifts", href: "/app/labour-rostering/shifts" },
      { title: shift.name },
      { title: "Edit" },
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, setBreadcrumbItems, shift]);

  if (isLoading) {
    return <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading shift...</div>;
  }

  if (isError || !shift) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
        <p className="text-sm text-muted-foreground">Shift details could not be loaded.</p>
        <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  return (
    <ShiftForm
      isEdit
      title="Edit Shift"
      description="Update shift details, working hours, and schedules."
      initialValues={shiftToPayload(shift)}
      pending={updateShift.isPending}
      submitLabel="Save Changes"
      onCancel={() => router.push("/app/labour-rostering/shifts")}
      onSubmit={(payload) => updateShift.mutate({ id, payload }, { onSuccess: () => router.push("/app/labour-rostering/shifts") })}
    />
  );
}

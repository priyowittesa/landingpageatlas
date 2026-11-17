"use client";

import { useRouter } from "next/navigation";

import { ShiftForm } from "../components/shift-form";
import { useCreateShift } from "../use-shifts";

export default function AddShiftPage() {
  const router = useRouter();
  const createShift = useCreateShift();

  return (
    <ShiftForm
      title="Add Shift"
      description="Create a new shift to manage working hours and schedules."
      pending={createShift.isPending}
      submitLabel="Add Shift"
      onCancel={() => router.push("/app/labour-rostering/shifts")}
      onSubmit={(payload) => createShift.mutate(payload, { onSuccess: () => router.push("/app/labour-rostering/shifts") })}
    />
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import FormTextField from "@/components/FormTextField";
import FormSelectField from "@/components/FormSelectField";
import FormDateField from "@/components/FormDateField";

import {
  testResultStatusOptions,
  type AddTestResultDto,
  type TestResultStatus,
} from "../../../types";
import {
  useAddTestResult,
  usePrototype,
} from "../../../hooks/usePrototypes";

const TESTERS = [
  { label: "Rina Halim", value: "rina-halim" },
  { label: "Sari Puspita", value: "sari-puspita" },
  { label: "Andi Wijaya", value: "andi-wijaya" },
];

const defaultValues: AddTestResultDto = {
  test_name: "",
  criteria: "",
  actual_result: "",
  status: "pending",
  tested_by: "",
  tested_at: "",
};

export default function AddTestResultPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: iteration, isLoading } = usePrototype(params.id);
  const create = useAddTestResult();

  const { control, register, reset, handleSubmit, watch, setValue } =
    useForm<AddTestResultDto>({ defaultValues });

  const watchStatus = watch("status");

  useEffect(() => {
    if (!isLoading && !iteration) {
      router.push("/app/product-development/prototype");
    }
  }, [isLoading, iteration, router]);

  const onSubmit = handleSubmit((values) => {
    create.mutate(
      { id: params.id, payload: values },
      {
        onSuccess: () => {
          reset(defaultValues);
          router.push(`/app/product-development/prototype/${params.id}`);
        },
      }
    );
  });

  if (isLoading || !iteration) {
    return (
      <div className="mx-auto max-w-2xl pb-10 text-xs text-gray-400">
        Loading iteration...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            router.push(`/app/product-development/prototype/${params.id}`)
          }
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Iteration
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            router.push(`/app/product-development/prototype/${params.id}`)
          }
        >
          Cancel
        </Button>
      </div>

      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
          Add Test Result
        </h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {iteration.iteration_no} · {iteration.name}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-md border bg-white p-5"
      >
        <FormTextField
          label="Test Name"
          name="test_name"
          register={register}
          required
          placeholder="e.g. Dimension Verification"
        />
        <FormTextField
          label="Criteria / Expected Result"
          name="criteria"
          register={register}
          required
          placeholder="e.g. Wall thickness ≥3.2mm at all entry points"
        />
        <FormTextField
          label="Actual Result"
          name="actual_result"
          as="textarea"
          register={register}
          placeholder="Fill in once the test has been run"
          rows={3}
        />
        <FormSelectField
          label="Status"
          name="status"
          control={control}
          options={testResultStatusOptions.map((s) => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            value: s,
          }))}
        />
        <FormSelectField
          label="Tested By"
          name="tested_by"
          control={control}
          options={TESTERS}
          placeholder="Select Person"
        />
        <FormDateField
          label="Test Date"
          name="tested_at"
          control={control}
          required
        />

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            type="button"
            onClick={() =>
              router.push(`/app/product-development/prototype/${params.id}`)
            }
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary-700 hover:bg-primary-800"
            disabled={create.isPending}
          >
            {create.isPending ? "Saving..." : "Add Test Result"}
          </Button>
        </div>
      </form>
    </div>
  );
}
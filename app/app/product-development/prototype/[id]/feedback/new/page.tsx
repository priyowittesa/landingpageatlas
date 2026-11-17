"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import FormFieldLayout from "@/components/FormFieldLayout";
import FormSelectField from "@/components/FormSelectField";

import {
  feedbackCategories,
  type AddFeedbackDto,
} from "../../../types";
import {
  useAddFeedback,
  usePrototype,
} from "../../../hooks/usePrototypes";

const CATEGORY_OPTIONS = feedbackCategories.map((c) => ({
  label: c,
  value: c,
}));

const defaultValues: AddFeedbackDto = {
  category: CATEGORY_OPTIONS[0].value,
  text: "",
};

export default function AddFeedbackPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: iteration, isLoading } = usePrototype(params.id);
  const create = useAddFeedback();

  const { control, register, reset, handleSubmit, watch } =
    useForm<AddFeedbackDto>({ defaultValues });

  const text = watch("text");

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
          Add Feedback
        </h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {iteration.iteration_no} · {iteration.name}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-md border bg-white p-5"
      >
        <FormSelectField
          label="Category"
          name="category"
          control={control}
          options={CATEGORY_OPTIONS}
        />
        <FormFieldLayout label="Feedback" htmlFor="text">
          <textarea
            id="text"
            {...register("text")}
            placeholder="Add your feedback context for the iteration..."
            rows={4}
            className="min-h-24 w-full rounded-sm border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </FormFieldLayout>

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
            className="bg-gray-900 text-xs hover:bg-gray-800"
            disabled={create.isPending || !text?.trim()}
          >
            {create.isPending ? "Saving..." : "Submit Feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
}
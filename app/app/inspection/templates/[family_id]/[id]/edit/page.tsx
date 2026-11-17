"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TemplateForm } from "../../../components/template-form";
import { useTemplateDetail } from "../../../use-templates";
import type { TemplateCategory } from "../../../types";

function EditTemplateContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const familyId = params.family_id as string;
  const id = params.id as string;
  const category = (searchParams.get("category") ??
    "asset") as TemplateCategory;

  const {
    data: detail,
    isLoading,
    isError,
    error
  } = useTemplateDetail(familyId, id, category);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl pb-10">
        <p className="text-sm text-gray-400">Loading template...</p>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="mx-auto max-w-6xl pb-10">
        <p className="text-sm text-red-500">
          Failed to load template.
          {error ? ` ${error.message}` : ""}
        </p>
      </div>
    );
  }

  return <TemplateForm editing category={category} initialData={detail} />;
}

export default function EditInspectionTemplatePage() {
  return (
    <Suspense>
      <EditTemplateContent />
    </Suspense>
  );
}

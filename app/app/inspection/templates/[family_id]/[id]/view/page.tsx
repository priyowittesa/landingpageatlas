"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TemplateView } from "../../../components/template-view";
import type { TemplateCategory } from "../../../types";

function ViewTemplateContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const familyId = params.family_id as string;
  const id = params.id as string;
  const category = (searchParams.get("category") ??
    "asset") as TemplateCategory;

  return (
    <TemplateView
      familyId={familyId}
      templateId={id}
      category={category}
    />
  );
}

export default function ViewInspectionTemplatePage() {
  return (
    <Suspense>
      <ViewTemplateContent />
    </Suspense>
  );
}

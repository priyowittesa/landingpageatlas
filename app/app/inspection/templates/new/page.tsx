"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TemplateForm } from "../components/template-form";
import type { TemplateCategory } from "../types";

function NewTemplateContent() {
  const searchParams = useSearchParams();
  const category = (searchParams.get("category") ??
    "asset") as TemplateCategory;

  return <TemplateForm category={category} />;
}

export default function NewInspectionTemplatePage() {
  return (
    <Suspense>
      <NewTemplateContent />
    </Suspense>
  );
}

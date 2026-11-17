import { Suspense } from "react";
import { TemplateList } from "./components/template-list";

export default function InspectionTemplatesPage() {
  return (
    <Suspense>
      <TemplateList />
    </Suspense>
  );
}

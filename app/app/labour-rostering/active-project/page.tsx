import { Suspense } from "react";

import { ProjectList } from "../../master-data/projects/components/project-list";

export default function ActiveProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
          Loading projects...
        </div>
      }
    >
      <ProjectList
        activeOnly
        title="Active Project"
        subtitle="View and manage active projects for labour rostering."
      />
    </Suspense>
  );
}
import { Suspense } from "react";

import { ProjectList } from "./components/project-list";

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
          Loading projects...
        </div>
      }
    >
      <ProjectList />
    </Suspense>
  );
}
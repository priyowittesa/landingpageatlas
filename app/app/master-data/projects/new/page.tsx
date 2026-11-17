"use client";

import { useRouter } from "next/navigation";
import { ProjectForm } from "../components/project-form";
import { useCreateProject } from "../use-projects";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useCreateProject();

  return (
    <ProjectForm
      title="Add Project"
      description="Create a new project record in the system."
      pending={createProject.isPending}
      submitLabel="Save Project"
      onCancel={() => router.push("/app/master-data/projects")}
      onSubmit={(payload) => createProject.mutate(payload, { onSuccess: () => router.push("/app/master-data/projects") })}
    />
  );
}

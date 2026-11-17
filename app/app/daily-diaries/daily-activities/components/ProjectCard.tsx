import type { Project } from "@/app/app/master-data/projects/types";
import type { ProjectDiarySummary } from "../project-diary-summary";
import { ProjectRow } from "./ProjectRow";

export function ProjectCard({
  project,
  summary
}: {
  project: Project;
  summary: ProjectDiarySummary;
}) {
  return <ProjectRow project={project} summary={summary} />;
}

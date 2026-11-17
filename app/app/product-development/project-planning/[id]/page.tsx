import { ProjectPlanningDetail } from "./components/ProjectPlanningDetail";

export default async function ProjectPlanningDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ProjectPlanningDetail projectId={id} />;
}

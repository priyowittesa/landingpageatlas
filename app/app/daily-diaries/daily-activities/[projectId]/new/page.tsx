import { findProject } from "../../data";
import { NewDailyDiaryForm } from "../../components/form/NewDailyDiaryForm";

export default async function NewDailyDiaryPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ date?: string; diaryId?: string }>;
}) {
  const [{ projectId }, query] = await Promise.all([params, searchParams]);
  return (
    <NewDailyDiaryForm
      project={findProject(projectId)}
      projectId={projectId}
      date={query.date ?? "2026-07-20"}
      diaryId={query.diaryId ?? null}
    />
  );
}

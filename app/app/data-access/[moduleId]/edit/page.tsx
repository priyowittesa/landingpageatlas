import { DataAccessEditor } from "../../components/DataAccessEditor";

export default async function EditDataAccessPage({
  params
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  return <DataAccessEditor moduleId={moduleId} />;
}

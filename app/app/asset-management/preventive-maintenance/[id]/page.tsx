import { PreventiveMaintenanceDetail } from "./preventive-maintenance-detail";

export default async function PreventiveMaintenanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PreventiveMaintenanceDetail id={id} />;
}

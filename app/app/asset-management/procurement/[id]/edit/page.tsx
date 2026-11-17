import { ProcurementEditForm } from "../../components/procurement-edit-form";

export default async function ProcurementEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProcurementEditForm id={id} />;
}

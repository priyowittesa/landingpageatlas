import { InspectionDetailView } from "../../components/inspection-detail";

export default async function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InspectionDetailView inspectionId={id} />;
}

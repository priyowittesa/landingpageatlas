import { FrequencyTypeDetail } from "./frequency-type-detail";

export default async function FrequencyTypeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FrequencyTypeDetail id={id} />;
}

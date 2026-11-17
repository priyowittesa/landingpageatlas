import { ProcurementReview } from "../components/procurement-review";

export default async function ProcurementReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProcurementReview id={id} />;
}

import { PrototypeDetail } from "./components/PrototypeDetail";

export default async function PrototypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PrototypeDetail iterationId={id} />;
}

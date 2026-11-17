import { DesignDetail } from "./components/DesignDetail";

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DesignDetail designId={id} />;
}

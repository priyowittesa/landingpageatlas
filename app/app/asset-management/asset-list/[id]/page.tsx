import { AssetDetail } from "./asset-detail";

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <AssetDetail id={(await params).id} />;
}

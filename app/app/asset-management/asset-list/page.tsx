import { Suspense } from "react";
import { AssetList } from "./asset-list";

export default function AssetListPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading assets..." />}>
      <AssetList />
    </Suspense>
  );
}

function PageLoading({ label }: { label: string }) {
  return <div className="py-20 text-center text-sm text-gray-500">{label}</div>;
}

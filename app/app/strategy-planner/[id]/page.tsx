export default function StrategyPlannerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-medium">Strategy Detail</h1>
      <p className="text-sm text-gray-500">Strategy ID: {params.id}</p>
    </div>
  );
}

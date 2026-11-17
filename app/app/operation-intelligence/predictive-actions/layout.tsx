import { requireRouteAccess } from "@/lib/require-auth";

export default async function PredictiveActionsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireRouteAccess("/app/operation-intelligence/predictive-actions");
  return children;
}

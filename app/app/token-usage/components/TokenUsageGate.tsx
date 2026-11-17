"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useTokenUsageAccess } from "../hooks/useTokenUsage";

function EmptyState({
  title,
  description,
  actionHref,
  actionLabel
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <Card className="mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
        <Lock className="h-5 w-5 text-primary-700" />
      </div>
      <h2 className="text-base font-bold text-gray-950">{title}</h2>
      <p className="text-sm leading-5 text-gray-500">{description}</p>
      <Link href={actionHref}>
        <Button className="mt-1 gap-1.5 bg-primary-700 text-xs hover:bg-primary-800">
          <Sparkles className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      </Link>
    </Card>
  );
}

/**
 * Gates the Token Usage pages.
 *
 * - Non-admin pages (Overview, Usage History) need at least one subscription
 *   on GET /v1/auth/me.
 * - Admin pages (Monitoring, Clients, Audit Trail) only require `is_admin`,
 *   regardless of subscription status.
 */
export function TokenUsageGate({
  children,
  requireAdmin = false
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { isLoading, canViewTokenUsage, isAdmin } = useTokenUsageAccess();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  // Admin pages are gated by is_admin alone — no subscription required.
  if (requireAdmin) {
    if (!isAdmin) {
      return (
        <EmptyState
          title="Admin access required"
          description="This page is limited to workspace admins. Ask an admin to grant you access or go back to the overview."
          actionHref="/app/token-usage/overview"
          actionLabel="Back to Overview"
        />
      );
    }
    return <>{children}</>;
  }

  if (!canViewTokenUsage) {
    return (
      <EmptyState
        title="No active subscription"
        description="Token Usage is available once your workspace has an active subscription. Explore the available packages to get started."
        actionHref="/app/workspace-dashboard/explore-module"
        actionLabel="Explore modules"
      />
    );
  }

  return <>{children}</>;
}

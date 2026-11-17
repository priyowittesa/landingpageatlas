"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";

import { useRequest, useRequestApprovals } from "../../hooks/useRequests";
import { RequestForm } from "../../create/components/RequestForm";

export default function EditRequestPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requestId = params?.id ?? "";
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: request, isLoading } = useRequest(requestId);
  const { data: approvalsData } = useRequestApprovals(requestId);

  const latestDecision =
    approvalsData && approvalsData.length > 0
      ? approvalsData[approvalsData.length - 1].decision
      : undefined;
  const decisionClosed =
    latestDecision === "accept" || latestDecision === "reject";

  useEffect(() => {
    if (!request) return;

    setBreadcrumbItems([
      { title: "Product Development", href: "/app/product-development/requests" },
      { title: "Requests", href: "/app/product-development/requests" },
      {
        title: request.code || request.title || "Request",
        href: `/app/product-development/requests/${requestId}`,
      },
      { title: "Edit" },
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, request, requestId, setBreadcrumbItems]);

  // Redirect away if the request is already approved/rejected — the Edit
  // button is disabled in the detail view, but this catches direct URL hits.
  useEffect(() => {
    if (!isLoading && !request) {
      router.push("/app/product-development/requests");
    } else if (!isLoading && request && decisionClosed) {
      router.push(`/app/product-development/requests/${requestId}`);
    }
  }, [isLoading, request, decisionClosed, requestId, router]);

  if (isLoading || !request) {
    return (
      <div className="mx-auto max-w-3xl pb-10 text-xs text-gray-400">
        Loading request...
      </div>
    );
  }

  if (decisionClosed) {
    return (
      <div className="mx-auto max-w-3xl pb-10 text-xs text-gray-400">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            router.push(`/app/product-development/requests/${requestId}`)
          }
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Request
        </button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() =>
            router.push(`/app/product-development/requests/${requestId}`)
          }
        >
          Cancel
        </Button>
      </div>

      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-gray-950">
          Edit Request
        </h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          {request.code} · {request.title}
        </p>
      </div>

      <RequestForm mode="edit" initialRequest={request} />
    </div>
  );
}

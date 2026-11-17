"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import { useBreadcrumbStore } from "@/stores/breadcrumb-store";

import { useRequest } from "../hooks/useRequests";
import { RequestDetail } from "./components/RequestDetail";

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requestId = params?.id ?? "";

  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  const { data: request } = useRequest(requestId);

  useEffect(() => {
    if (!request) return;

    setBreadcrumbItems([
      { title: "Product Development", href: "/app/product-development/requests" },
      { title: "Requests", href: "/app/product-development/requests" },
      {
        // Use code/title — never the id.
        title: request.code || request.title || "Request",
      },
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, request, setBreadcrumbItems]);

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-10">
      {requestId ? (
        <RequestDetail requestId={requestId} />
      ) : (
        <div className="py-8 text-xs text-gray-400">
          <button
            type="button"
            onClick={() => router.push("/app/product-development/requests")}
            className="text-primary-700 hover:underline"
          >
            ← Back to Requests
          </button>
          <p className="mt-2">Request id is missing from the URL.</p>
        </div>
      )}
    </div>
  );
}
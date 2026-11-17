"use client";

import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { NonConformanceDetailContent } from "./content";
import { useNonConformanceDetail } from "../use-non-conformance";

export default function NonConformanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading, isError, error } = useNonConformanceDetail(id);

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-10">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-semibold text-gray-800 hover:text-primary-700"
        onClick={() => router.push("/app/inspection/non-conformance")}
      >
        <ChevronLeft className="h-4 w-4" /> Non-Conformance
      </button>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-sm text-gray-400">
          Loading...
        </div>
      ) : isError || !data ? (
        <div className="flex h-64 items-center justify-center text-sm text-red-500">
          Failed to load non-conformance.{error ? ` ${error.message}` : ""}
        </div>
      ) : (
        <NonConformanceDetailContent id={id} detail={data} />
      )}
    </div>
  );
}

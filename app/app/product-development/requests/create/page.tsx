"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { RequestForm } from "./components/RequestForm";

export default function CreateRequestPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-10">
      <div>
        <button
          type="button"
          onClick={() => router.push("/app/product-development/requests")}
          className="flex items-center gap-1 text-[22px] font-bold leading-tight tracking-[-0.02em] text-gray-900 hover:text-primary-700"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" /> New Request
        </button>
        <p className="ml-5 mt-1 text-xs leading-5 text-gray-500">
          Submit a new engineering request for Gate 1 review
        </p>
      </div>

      <RequestForm mode="create" />
    </div>
  );
}

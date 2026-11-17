"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
      <p className="text-sm text-gray-500">
        {error?.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        Try again
      </button>
    </div>
  );
}

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-sm text-gray-500">
          You do not have permission to access this page.
        </p>
      </div>
      <Link href="/app/workspace-dashboard">
        <Button variant="outline">Back to Dashboard</Button>
      </Link>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Info, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ModuleHealth } from "../types";

export const CONNECTIONS_HREF = "/app/ai-studio/master-connections";

export function ManageConnections() {
  return (
    <Button variant="outline" asChild>
      <Link href={CONNECTIONS_HREF}>Manage Connection</Link>
    </Button>
  );
}

export function DesignIcon({
  name,
  small = false
}: {
  name: string;
  small?: boolean;
}) {
  const size = small ? 21.7143 : 32;
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary-50",
        small ? "size-[38px] rounded-[11px]" : "size-14 rounded-2xl"
      )}
    >
      <Image
        src={`/images/data-access/${name}.svg`}
        width={size}
        height={size}
        alt=""
        unoptimized
      />
    </span>
  );
}

export function PreviewNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs leading-5 text-blue-800">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>
        List statistics, health and history are a browser-only preview and do
        not reflect live module connections.
      </p>
    </div>
  );
}

export function HealthBadge({ health }: { health: ModuleHealth }) {
  const styles = {
    healthy: "bg-green-50 text-green-700",
    incomplete: "bg-amber-50 text-amber-600",
    error: "bg-red-50 text-red-600",
    "not-configured": "bg-gray-100 text-gray-500"
  };
  const labels = {
    healthy: "Healthy",
    incomplete: "Incomplete",
    error: "Error",
    "not-configured": "Not configured"
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[health]
      )}
    >
      {labels[health]}
    </span>
  );
}

export function LoadingState() {
  return (
    <div
      role="status"
      className="flex min-h-64 items-center justify-center gap-2 text-sm text-gray-500"
    >
      <LoaderCircle className="size-5 animate-spin" />
      Loading Data Access...
    </div>
  );
}

export function ErrorState({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border p-8 text-center">
      <h2 className="font-semibold">Unable to load Data Access</h2>
      <p className="my-3 text-sm text-gray-500">
        Check your connection and session, then try again. Existing saved
        configurations have not been overwritten.
      </p>
      <Button variant="outline" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

export function formatUpdated(at: string) {
  return new Date(at).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

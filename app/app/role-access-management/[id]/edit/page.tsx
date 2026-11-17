"use client";

import { LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { RoleEditForm } from "../../components/role-edit-form";
import { useRole } from "../../use-roles";

export default function EditRolePage() {
  const { id } = useParams<{ id: string }>();
  const roleQuery = useRole(id);
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);

  useEffect(() => {
    if (!roleQuery.data) return;

    setBreadcrumbItems([
      { title: "Role Access Management" },
      { title: "Roles", href: "/app/role-access-management" },
      { title: roleQuery.data.name },
      { title: "Edit" }
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, roleQuery.data, setBreadcrumbItems]);

  if (roleQuery.isLoading) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin" /> Loading role...
      </div>
    );
  }

  if (roleQuery.isError || !roleQuery.data) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">
          Role data could not be loaded.
        </p>
        <Button variant="outline" onClick={() => roleQuery.refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  return <RoleEditForm role={roleQuery.data} />;
}

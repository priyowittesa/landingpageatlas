"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { useEmployees } from "../../../master-data/employee/use-employees";
import {
  useProject,
  useRoles,
  useRosterProjectMembers
} from "../../../master-data/projects/use-projects";
import { useShifts } from "../../shifts/use-shifts";
import { RosteringConfigurator } from "../components/rostering-configurator";
import {
  getPeriodEnd,
  getPeriodStart,
  getScheduleDays
} from "../components/rostering-period";

function initialMemberDateRange() {
  const today = new Date();
  const days = getScheduleDays(
    getPeriodStart(today, "monthly"),
    getPeriodEnd(today, "monthly")
  );
  return {
    endDate: days[days.length - 1]?.date ?? "",
    startDate: days[0]?.date ?? ""
  };
}

export default function ConfigureActiveProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [memberDateRange, setMemberDateRange] = useState(
    initialMemberDateRange
  );
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const projectQuery = useProject(id);
  const projectMembersQuery = useRosterProjectMembers(id, {
    ...memberDateRange,
    pageSize: 1000
  });
  const rolesQuery = useRoles();
  const employeeQuery = useEmployees();
  const shiftQuery = useShifts();
  const updateMemberDateRange = useCallback(
    (startDate: string, endDate: string) => {
      setMemberDateRange((current) =>
        current.startDate === startDate && current.endDate === endDate
          ? current
          : { endDate, startDate }
      );
    },
    []
  );

  useEffect(() => {
    if (!projectQuery.data) return;

    setBreadcrumbItems([
      { title: "Labour Rostering" },
      {
        title: "Active Project",
        href: "/app/labour-rostering/active-project"
      },
      { title: projectQuery.data.title }
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, projectQuery.data, setBreadcrumbItems]);

  if (
    projectQuery.isLoading ||
    projectMembersQuery.isLoading ||
    rolesQuery.isLoading ||
    employeeQuery.isLoading ||
    shiftQuery.isLoading
  ) {
    return (
      <div className="flex min-h-96 items-center justify-center text-sm text-muted-foreground">
        Loading rostering workspace...
      </div>
    );
  }

  if (
    projectQuery.isError ||
    projectMembersQuery.isError ||
    rolesQuery.isError ||
    !projectQuery.data
  ) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
        <p className="text-sm text-muted-foreground">
          Active project could not be loaded.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            projectQuery.refetch();
            projectMembersQuery.refetch();
            rolesQuery.refetch();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <RosteringConfigurator
      project={projectQuery.data}
      employees={employeeQuery.data ?? []}
      memberGroups={projectMembersQuery.data?.groups ?? []}
      members={projectMembersQuery.data?.members ?? []}
      onDateRangeChange={updateMemberDateRange}
      roles={rolesQuery.data ?? []}
      shifts={shiftQuery.data ?? []}
    />
  );
}

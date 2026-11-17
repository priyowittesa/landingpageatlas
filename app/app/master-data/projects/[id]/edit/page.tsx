"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { ProjectForm } from "../../components/project-form";
import {
  useAddProjectMembers,
  useBulkDeleteProjectMembers,
  useProject,
  useProjectMembers,
  useUpdateProjectMembers,
  useUpdateProject,
} from "../../use-projects";

function toFormDate(value: string) {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[2]}/${match[3]}/${match[1]}` : "";
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: project, isLoading, isError, refetch } = useProject(id);
  const {
    data: projectMembers,
    isLoading: isLoadingProjectMembers,
    isError: isProjectMembersError,
    refetch: refetchProjectMembers,
  } = useProjectMembers(id);
  const updateProject = useUpdateProject();
  const addProjectMembers = useAddProjectMembers();
  const deleteProjectMembers = useBulkDeleteProjectMembers();
  const updateProjectMembers = useUpdateProjectMembers();
  const initialValues = useMemo(() => project ? ({
    address: project.address,
    title: project.title,
    client_name: project.client_name === "-" ? "" : project.client_name,
    code: project.code,
    description: project.description,
    start_date: toFormDate(project.start_date),
    end_date: toFormDate(project.end_date),
    location: project.location,
    priority: project.priority,
    project_manager_id: project.project_manager_id,
    status: project.status,
    tags: project.tags,
    type: project.type,
    project_team: projectMembers ?? project.project_team,
  }) : undefined, [project, projectMembers]);

  useEffect(() => {
    if (!project) return;

    setBreadcrumbItems([
      { title: "Master Data", href: "/master-data" },
      { title: "Projects", href: "/app/master-data/projects" },
      { title: project.title },
      { title: "Edit" },
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, project, setBreadcrumbItems]);

  if (isLoading || isLoadingProjectMembers) return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-slate-500"><LoaderCircle className="h-5 w-5 animate-spin" /> Loading project...</div>;
  if (isError || isProjectMembersError || !project || !initialValues) return <div className="flex min-h-80 flex-col items-center justify-center gap-3"><p className="text-sm text-slate-600">Project data could not be loaded.</p><Button variant="outline" onClick={() => { refetch(); refetchProjectMembers(); }}>Try Again</Button></div>;

  return (
    <ProjectForm
      title="Edit Project"
      description="Update project information."
      initialValues={initialValues}
      pending={
        updateProject.isPending ||
        addProjectMembers.isPending ||
        deleteProjectMembers.isPending ||
        updateProjectMembers.isPending
      }
      submitLabel="Save Changes"
      showProjectTeam
      onCancel={() => router.push("/app/master-data/projects")}
      onSubmit={async (payload) => {
        const members = payload.project_team.map((member) => {
          const groupId = member.group_id || project.group_id;

          return {
            memberId: member.member_id,
            payload: {
              department_id: member.department_id,
              labour_id: member.labour_id,
              project_id: id,
              role_in_project: member.role_id,
              ...(groupId ? { group_id: groupId } : {}),
              ...(member.responsibility
                ? { responsibility: member.responsibility }
                : {}),
            },
          };
        });
        const newMembers = members
          .filter((member) => !member.memberId)
          .map((member) => member.payload);
        const existingMembers = members.flatMap((member) => member.memberId
          ? [{ id: member.memberId, payload: member.payload }]
          : []);
        const submittedMemberIds = new Set(
          existingMembers.map((member) => member.id),
        );
        const deletedMemberIds = (projectMembers ?? project.project_team)
          .flatMap((member) => member.member_id ? [member.member_id] : [])
          .filter((memberId) => !submittedMemberIds.has(memberId));

        await updateProject.mutateAsync({ id, payload });
        if (deletedMemberIds.length > 0) {
          await deleteProjectMembers.mutateAsync({
            ids: deletedMemberIds,
            projectId: id,
          });
        }
        await Promise.all([
          newMembers.length > 0
            ? addProjectMembers.mutateAsync(newMembers)
            : Promise.resolve(),
          existingMembers.length > 0
            ? updateProjectMembers.mutateAsync(existingMembers)
            : Promise.resolve(),
        ]);
        router.push("/app/master-data/projects");
      }}
    />
  );
}

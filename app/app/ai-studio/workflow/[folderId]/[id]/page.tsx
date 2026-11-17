"use client";

import { useParams, useRouter } from "next/navigation";

import { WorkflowBuilder } from "../../components/WorkflowBuilder";
import { useGetFolder } from "../../hooks/useWorkflow";

export default function WorkflowCanvasPage() {
  const { folderId, id } = useParams<{ folderId: string; id: string }>();
  const router = useRouter();
  const folderQuery = useGetFolder(folderId);

  return (
    <div className="flex h-full flex-col">
      <WorkflowBuilder
        key={id}
        workflowId={id}
        folderName={folderQuery.data?.data.name}
        onBack={() => router.replace("/app/ai-studio/workflow")}
      />
    </div>
  );
}

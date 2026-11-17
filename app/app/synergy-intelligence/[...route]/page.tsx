import { notFound } from "next/navigation";
import { SynergyIntelligencePage } from "../synergy-intelligence-page";

export default async function SynergyIntelligenceRoutePage({
  params
}: {
  params: Promise<{ route: string[] }>;
}) {
  const { route } = await params;
  const [view, resourceId, folderId] = route;

  if (view === "scheduled" && (route.length === 1 || route.length === 2)) {
    return (
      <SynergyIntelligencePage
        key={route.join("/")}
        initialScheduledView
        initialScheduledTaskId={resourceId ?? null}
      />
    );
  }

  if (view === "skills" && route.length === 1) {
    return <SynergyIntelligencePage key={route.join("/")} initialSkillsView />;
  }

  if (view === "f" && route.length === 2) {
    return (
      <SynergyIntelligencePage
        key={route.join("/")}
        initialProjectId={resourceId}
      />
    );
  }

  if (view === "c" && (route.length === 2 || route.length === 3)) {
    return (
      <SynergyIntelligencePage
        initialProjectId={folderId ?? null}
        initialSessionId={resourceId === "new" ? null : resourceId}
        initialNewChat={resourceId === "new"}
      />
    );
  }

  if (view === "m" && (route.length === 2 || route.length === 3)) {
    return (
      <SynergyIntelligencePage
        key={route.join("/")}
        initialProjectId={folderId ?? null}
        initialMemoId={resourceId}
      />
    );
  }

  notFound();
}

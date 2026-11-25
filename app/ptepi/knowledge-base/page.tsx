import { BookOpen, FileStack, Folder, Link2, NotebookText } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { NOTE_FOLDERS, NOTES, SOURCES } from "../knowledge/data";
import { countSourcesUsed, getKnowledgeGraph } from "../knowledge/logic";
import { KnowledgeBaseWorkspace } from "./components/KnowledgeBaseWorkspace";

export default function KnowledgeBasePage() {
  const graph = getKnowledgeGraph(NOTES);
  const sourcesUsed = countSourcesUsed(NOTES);

  return (
    <div className="space-y-8">
      <ScreenHeader
        icon={BookOpen}
        title="Knowledge Base"
        subtitle="Notes ATLAS builds from the source files: the rules and definitions Nexa uses to answer."
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Notes" value={NOTES.length} subtitle="Rules and definitions of the PMO" icon={NotebookText} />
        <KpiCard title="Links" value={graph.links.length} subtitle="Connections between notes" icon={Link2} />
        <KpiCard title="Source files used" value={sourcesUsed} subtitle={`Of ${SOURCES.length} files in Knowledge Source`} icon={FileStack} />
        <KpiCard title="Folders" value={NOTE_FOLDERS.length} subtitle="Delivery, commercial and procurement" icon={Folder} />
      </div>
      <KnowledgeBaseWorkspace folders={NOTE_FOLDERS} notes={NOTES} sources={SOURCES} />
    </div>
  );
}

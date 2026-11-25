import { CircleAlert, CircleCheck, FileStack, FolderOpen, LoaderCircle } from "lucide-react";
import { KpiCard } from "../components/KpiCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { NOTES, SOURCE_FOLDERS, SOURCES } from "../knowledge/data";
import { formatFileSize, getSourceStats } from "../knowledge/logic";
import { KnowledgeSourceBoard } from "./components/KnowledgeSourceBoard";

export default function KnowledgeSourcePage() {
  const stats = getSourceStats(SOURCES);

  return (
    <div className="space-y-8">
      <ScreenHeader
        icon={FolderOpen}
        title="Knowledge Source"
        subtitle="Contracts, BA and BAST, weekly reports and policies that ATLAS reads, so Nexa can answer with a source."
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Files" value={stats.total} subtitle={`${formatFileSize(stats.totalBytes)} in ${SOURCE_FOLDERS.length} folders`} icon={FileStack} />
        <KpiCard title="Ready for Nexa" value={stats.ready} subtitle="Extracted and searchable" icon={CircleCheck} tone="good" />
        <KpiCard title="Processing" value={stats.processing} subtitle="Uploaded or being chunked" icon={LoaderCircle} tone="watch" />
        <KpiCard title="Failed" value={stats.failed} subtitle="Need a searchable re-upload" icon={CircleAlert} tone="bad" />
      </div>
      <KnowledgeSourceBoard folders={SOURCE_FOLDERS} sources={SOURCES} notes={NOTES} />
    </div>
  );
}

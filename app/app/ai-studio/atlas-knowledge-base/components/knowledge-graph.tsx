"use client";

import { useCallback, useMemo } from "react";
import { FileText } from "lucide-react";
import { TextNetwork } from "@/components/text-network/TextNetwork";
import { buildEntityGraph } from "@/lib/text-network/buildEntityGraph";
import type { BuildGraphOptions, TextLine } from "@/lib/text-network/types";
import type { KnowledgeArtifact, KnowledgeEntity } from "../types";

type KnowledgeGraphProps = {
  artifacts: KnowledgeArtifact[];
  entities: KnowledgeEntity[];
  onOpen: (artifact: KnowledgeArtifact) => void;
  /** Artifact to locate in the graph; a new token repeats the request. */
  focus?: { artifactId: string; token: number };
};

/** Text for the network: entity names + descriptions, related entity pairs and any inline artifact content, tagged by artifact. */
function knowledgeLines(artifacts: KnowledgeArtifact[], entities: KnowledgeEntity[]): TextLine[] {
  const byId = new Map(entities.map((entity) => [entity.id, entity]));
  const lines: TextLine[] = [];
  entities.forEach((entity) => {
    const sourceId = entity.artifactId || undefined;
    lines.push({ text: entity.description ? `${entity.name}. ${entity.description}` : entity.name, sourceId });
  });
  const seen = new Set<string>();
  entities.flatMap((entity) => entity.relations).forEach((relation) => {
    const source = byId.get(relation.sourceEntityId), target = byId.get(relation.targetEntityId);
    if (!source || !target || seen.has(relation.id)) return;
    seen.add(relation.id);
    lines.push({ text: `${source.name} ${target.name}`, sourceId: source.artifactId || undefined });
  });
  artifacts.forEach((artifact) => { if (artifact.content.trim()) lines.push({ text: artifact.content, sourceId: artifact.id }); });
  return lines;
}

export function KnowledgeGraph({ artifacts, entities, onOpen, focus }: KnowledgeGraphProps) {
  const lines = useMemo(() => knowledgeLines(artifacts, entities), [artifacts, entities]);
  const buildDefaultGraph = useCallback((options: BuildGraphOptions) => buildEntityGraph(
    entities.map((entity) => ({ id: entity.id, name: entity.name, type: entity.type, description: entity.description, sourceId: entity.artifactId || undefined })),
    entities.flatMap((entity) => entity.relations).map((relation) => ({ id: relation.id, source: relation.sourceEntityId, target: relation.targetEntityId, type: relation.type })),
    options,
  ), [entities]);
  const artifactMap = useMemo(() => new Map(artifacts.map((item) => [item.id, item])), [artifacts]);
  const sourceLabels = useMemo(() => Object.fromEntries(artifacts.map((item) => [item.id, item.name])), [artifacts]);

  return <TextNetwork
    defaultLines={lines}
    buildDefaultGraph={entities.length ? buildDefaultGraph : undefined}
    focusSource={focus && { id: focus.artifactId, label: artifactMap.get(focus.artifactId)?.name, token: focus.token }}
    sourceLabels={sourceLabels}
    onOpenSource={(id) => { const artifact = artifactMap.get(id); if (artifact) onOpen(artifact); }}
    emptyState={<div className="pointer-events-none flex flex-col items-center gap-2 text-center text-[var(--tn-muted)]">
      <span className="flex size-11 items-center justify-center rounded-full border border-[var(--tn-panel-border)] bg-[var(--tn-hover)]"><FileText className="size-5" /></span>
      <p className="text-sm font-medium text-[var(--tn-label)]">No entities to visualize</p>
      <p className="max-w-xs text-xs">Upload a file, or paste text in the Text panel to build a graph.</p>
    </div>}
  />;
}

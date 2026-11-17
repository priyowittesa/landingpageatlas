export interface ArtifactFolder {
  id: string;
  title: string;
  parentId: string | null;
}

export interface KnowledgeArtifact {
  id: string;
  folderId: string;
  name: string;
  content: string;
  mimeType?: string;
  status?: string;
}

export interface KnowledgeEntity {
  id: string;
  artifactId: string;
  folderId: string;
  name: string;
  type: string;
  description?: string;
  relations: KnowledgeRelation[];
}

export interface KnowledgeRelation {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: string;
}

export type Tab = { id: string; kind: "graph" | "note" };
export type ManageTarget = { kind: "file" | "folder"; id: string; label: string; action: "rename" | "delete" };
export type CreateTarget = { kind: "file" | "folder"; folder?: string };
export type UploadResult = { name: string; status: "success" | "error"; message?: string };

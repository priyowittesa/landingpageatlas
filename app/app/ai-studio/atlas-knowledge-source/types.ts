export interface KnowledgeFolder {
  id: string;
  title: string;
  count_file: number;
}

export interface KnowledgeUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  status: KnowledgeUploadStatus;
  uploadedAt: string;
  isContentExtractionKnowledge: boolean;
  isContentExtractionTable: boolean;
}

export type KnowledgeUploadStatus = "uploaded" | "chunking" | "ready" | "failed";

export interface UploadTask {
  key: string;
  file: File;
  progress: number;
  state: "queued" | "uploading" | "complete" | "failed";
}

export type DeleteTarget = {
  kind: "folder" | "file" | "files";
  id?: string;
};

export interface FolderOrderPayload {
  items: Array<{ folder_id: string; order: number }>;
}

import { axiosConfig } from "@/lib/axios";
import { env } from "@/lib/env";
import type { ArtifactFolder, KnowledgeArtifact, KnowledgeEntity } from "./types";

const FOLDERS_URL = "/workflow/knowledge/artifact-folders";
const ARTIFACTS_URL = "/workflow/knowledge/artifacts";
const ENTITIES_URL = "/workflow/knowledge/entities";
const axios = axiosConfig(env.apiBaseUrl);

function objectOf(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function findList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const object = objectOf(value);
  for (const key of ["data", "items", "results", "folders", "artifacts", "entities"]) {
    const candidate = object[key];
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = findList(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
}

function unwrap(value: unknown): Record<string, unknown> {
  let current = objectOf(value);
  for (let i = 0; i < 3; i += 1) {
    const data = objectOf(current.data);
    if (!Object.keys(data).length) break;
    current = data;
  }
  return current;
}

export function extractFolders(value: unknown): ArtifactFolder[] {
  return findList(value).map((raw, index) => {
    const item = objectOf(raw);
    return { id: String(item.id ?? item.folder_id ?? index), title: String(item.title ?? item.name ?? "Untitled folder"), parentId: item.parent_id == null ? null : String(item.parent_id) };
  });
}

export function extractArtifacts(value: unknown): KnowledgeArtifact[] {
  return findList(value)
    .map((raw, index) => normalizeArtifact(raw, index))
    .filter((artifact) => !isTurtleArtifact(artifact));
}

export function normalizeArtifact(value: unknown, index = 0): KnowledgeArtifact {
  const item = unwrap(value);
  const name = String(item.display_name ?? item.original_filename ?? item.original_file_name ?? item.file_name ?? item.filename ?? item.title ?? item.name ?? "Untitled file");
  return {
    id: String(item.id ?? item.artifact_id ?? index),
    folderId: String(item.folder_id ?? item.artifact_folder_id ?? ""),
    name,
    content: String(item.content ?? item.markdown ?? item.text ?? item.extracted_text ?? item.body ?? ""),
    mimeType: item.mime_type || item.content_type || item.file_type ? String(item.mime_type ?? item.content_type ?? item.file_type) : undefined,
    status: item.status ? String(item.status) : undefined,
  };
}

function isTurtleArtifact(artifact: KnowledgeArtifact) {
  return /\.ttl$/i.test(artifact.name.trim()) || /(?:text\/turtle|application\/x-turtle)/i.test(artifact.mimeType ?? "");
}

export function extractDownloadUrl(value: unknown): string {
  if (typeof value === "string") return value;
  const item = objectOf(value);
  if (typeof item.download_url === "string") return item.download_url;
  return item.data ? extractDownloadUrl(item.data) : "";
}

export function extractEntities(value: unknown, folderId = ""): KnowledgeEntity[] {
  return findList(value).map((raw, index) => {
    const item = objectOf(raw);
    const entityId = String(item.id ?? item.entity_id ?? index);
    const rawRelations = Array.isArray(item.relations)
      ? item.relations
      : Array.isArray(item.relationships)
        ? item.relationships
        : [];
    return {
      id: entityId,
      artifactId: String(item.artifact_id ?? item.source_artifact_id ?? ""),
      folderId: String(item.folder_id ?? folderId),
      name: String(item.name ?? item.title ?? item.label ?? item.value ?? "Entity"),
      type: String(item.entity_type ?? item.type ?? item.category ?? "entity").toLowerCase(),
      description: item.description == null ? undefined : String(item.description),
      relations: rawRelations.map((rawRelation, relationIndex) => {
        const relation = objectOf(rawRelation);
        return {
          id: String(relation.id ?? relation.relation_id ?? `${entityId}-${relationIndex}`),
          sourceEntityId: String(relation.source_entity_id ?? relation.source_id ?? relation.source ?? entityId),
          targetEntityId: String(relation.target_entity_id ?? relation.target_id ?? relation.target ?? ""),
          type: String(relation.relation_type ?? relation.type ?? relation.label ?? "RELATED_TO"),
        };
      }).filter((relation) => relation.sourceEntityId && relation.targetEntityId),
    };
  });
}

const api = {
  getFolders: async (search = "") => (await axios.get(FOLDERS_URL, { params: { parent_id: "", ...(search ? { search } : {}) } })).data,
  createFolder: async (title: string) => (await axios.post(FOLDERS_URL, { title, parent_id: null })).data,
  updateFolder: async (id: string, title: string) => (await axios.put(`${FOLDERS_URL}/${id}`, { title })).data,
  deleteFolder: async (id: string) => (await axios.delete(`${FOLDERS_URL}/${id}`)).data,
  reorderFolders: async (folderIds: string[]) => (await axios.put(`${FOLDERS_URL}/order`, { items: folderIds.map((folder_id, order) => ({ folder_id, order })) })).data,
  getArtifacts: async (folderId: string, search = "") => (await axios.get(ARTIFACTS_URL, { params: { folder_id: folderId, page_size: 100, ...(search ? { search } : {}) } })).data,
  getEntities: async (folderId: string) => (await axios.get(ENTITIES_URL, { params: { folder_id: folderId } })).data,
  getArtifactDownloadUrl: async (id: string) => (
    await axios.get(`${ARTIFACTS_URL}/${id}/download-url`)
  ).data,
  uploadArtifact: async (folderId: string, file: File) => { const form = new FormData(); form.append("folder_id", folderId); form.append("file", file); return (await axios.post(ARTIFACTS_URL, form, { headers: { "Content-Type": "multipart/form-data" } })).data; },
  updateArtifact: async (id: string, payload: { name?: string; content?: string; folder_id?: string }) => (await axios.put(`${ARTIFACTS_URL}/${id}`, payload)).data,
  deleteArtifact: async (id: string) => (await axios.delete(`${ARTIFACTS_URL}/${id}`)).data,
};

export function useKnowledgeBaseApi() { return api; }

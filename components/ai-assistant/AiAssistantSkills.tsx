"use client";

import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  NotebookPenIcon,
  Search,
  Trash2
} from "lucide-react";
import { useDeferredValue, useState } from "react";

import ConfirmationModal from "@/components/ConfirmationModal";
import { MarkdownPreview } from "@/components/markdown-preview";
import { Button } from "@/components/ui/button";
import {
  useCreateWorkflowSkill,
  useDeleteWorkflowSkill,
  useGetWorkflowSkill,
  useGetWorkflowSkills,
  useUpdateWorkflowSkill,
  type WorkflowSkill,
  type WorkflowSkillDetail
} from "./useWorkflowSkills";

type SkillDraft = Pick<
  WorkflowSkillDetail,
  "title" | "description" | "content"
>;

const EMPTY_DRAFT: SkillDraft = {
  title: "",
  description: "",
  content: ""
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function SkillEditor({
  draft,
  creating,
  saving,
  onChange,
  onCancel,
  onSave
}: {
  draft: SkillDraft;
  creating: boolean;
  saving: boolean;
  onChange: (draft: SkillDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const canSave = Boolean(
    draft.title.trim() && draft.description.trim() && draft.content.trim()
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 px-8 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Back to skills"
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:pointer-events-none disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
          {creating ? "Add Skill" : "Edit Skill"}
        </h2>
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button size="sm" disabled={saving || !canSave} onClick={onSave}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Title</span>
            <input
              autoFocus
              value={draft.title}
              onChange={(event) =>
                onChange({ ...draft, title: event.target.value })
              }
              placeholder="Enter a skill name"
              className="mt-1.5 h-10 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Description
            </span>
            <textarea
              value={draft.description}
              onChange={(event) =>
                onChange({ ...draft, description: event.target.value })
              }
              placeholder="Describe what this skill does"
              rows={3}
              className="mt-1.5 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
          <label className="flex min-h-[360px] flex-col">
            <span className="text-sm font-medium text-gray-700">Content</span>
            <textarea
              value={draft.content}
              onChange={(event) =>
                onChange({ ...draft, content: event.target.value })
              }
              placeholder="Write the skill instructions in Markdown"
              className="mt-1.5 min-h-[360px] flex-1 resize-none rounded-xl border border-gray-200 bg-white p-4 font-mono text-sm leading-6 text-gray-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function SkillDetail({
  skill,
  onBack,
  onEdit,
  onDelete
}: {
  skill: WorkflowSkillDetail;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 px-8 pt-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to skills"
          className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
          {skill.title}
        </h2>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-5">
        <div className="mx-auto max-w-4xl">
          <p className="max-w-3xl text-sm leading-6 text-gray-600">
            {skill.description}
          </p>
          <dl className="mt-5 grid max-w-md grid-cols-2 gap-6 text-xs">
            <div>
              <dt className="font-medium text-gray-900">Created by</dt>
              <dd className="mt-1 text-gray-500">
                {skill.created_by_name || skill.created_by}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900">Last updated</dt>
              <dd className="mt-1 text-gray-500">
                {formatDate(skill.updated_at)}
              </dd>
            </div>
          </dl>
          <div className="mt-6 rounded-xl border border-gray-200 bg-white px-5 py-4">
            <MarkdownPreview
              content={skill.content}
              className="!text-[15px] !leading-7 text-gray-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type SkillBrowserProps = {
  /** Restricts the catalog to system-provided skills. */
  systemOnly?: boolean;
  /** Included in workflow create requests. */
  createSource?: string;
};

export function SkillBrowser({
  systemOnly = false,
  createSource
}: SkillBrowserProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageTokens, setPageTokens] = useState([""]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SkillDraft | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<WorkflowSkill | null>(null);
  const deferredSearch = useDeferredValue(search.trim());

  const skillsQuery = useGetWorkflowSkills(
    deferredSearch,
    pageTokens[page] ?? ""
  );
  const detailQuery = useGetWorkflowSkill(selectedId);
  const createSkill = useCreateWorkflowSkill();
  const updateSkill = useUpdateWorkflowSkill();
  const deleteSkill = useDeleteWorkflowSkill();

  const skills = (skillsQuery.data?.data.items ?? []).filter(
    (skill) => !systemOnly || skill.source === "system"
  );
  const nextPageToken = skillsQuery.data?.data.next_page_token ?? "";
  const totalCount = skillsQuery.data?.data.total_count ?? 0;
  const selectedSkill = detailQuery.data?.data ?? null;
  const saving = createSkill.isPending || updateSkill.isPending;

  const startCreating = () => {
    setCreating(true);
    setDraft(EMPTY_DRAFT);
  };

  const startEditing = () => {
    if (!selectedSkill) return;
    setCreating(false);
    setDraft({
      title: selectedSkill.title,
      description: selectedSkill.description,
      content: selectedSkill.content
    });
  };

  const save = () => {
    if (!draft) return;
    const title = draft.title.trim();
    const description = draft.description.trim();
    const content = draft.content.trim();
    if (!title || !description || !content) return;

    if (creating) {
      createSkill.mutate(
        {
          title,
          description,
          content,
          ...(createSource ? { source: createSource } : { tenant: "manual" })
        },
        {
          onSuccess: (response) => {
            setSelectedId(response.data.id);
            setDraft(null);
          }
        }
      );
      return;
    }

    if (!selectedSkill) return;
    updateSkill.mutate(
      {
        skillId: selectedSkill.id,
        title,
        description,
        content,
        expected_revision: selectedSkill.revision
      },
      { onSuccess: () => setDraft(null) }
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteSkill.mutate(deleting.id, {
      onSuccess: () => {
        if (selectedId === deleting.id) setSelectedId(null);
        setDeleting(null);
      }
    });
  };

  const deleteConfirmation = (
    <ConfirmationModal
      open={Boolean(deleting)}
      onOpenChange={(open) => {
        if (!open && !deleteSkill.isPending) setDeleting(null);
      }}
      title="Delete skill?"
      description={`Are you sure you want to delete “${deleting?.title ?? "this skill"}”? This action cannot be undone.`}
      confirmLabel="Delete"
      isLoading={deleteSkill.isPending}
      onConfirm={confirmDelete}
    />
  );

  if (draft) {
    return (
      <SkillEditor
        draft={draft}
        creating={creating}
        saving={saving}
        onChange={setDraft}
        onCancel={() => setDraft(null)}
        onSave={save}
      />
    );
  }

  if (selectedId) {
    if (detailQuery.isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      );
    }
    if (!selectedSkill) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-8">
          <p className="text-sm text-gray-500">Skill not found.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedId(null)}
          >
            Back to skills
          </Button>
        </div>
      );
    }
    return (
      <>
        <SkillDetail
          skill={selectedSkill}
          onBack={() => setSelectedId(null)}
          onEdit={startEditing}
          onDelete={() => setDeleting(selectedSkill)}
        />
        {deleteConfirmation}
      </>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
            {skillsQuery.isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>
          <div className="flex gap-2">
            <label className="relative w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <span className="sr-only">Search by name</span>
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                  setPageTokens([""]);
                }}
                placeholder="Search by name"
                className="h-9 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-primary-400"
              />
            </label>
            <Button size="sm" onClick={startCreating}>
              Add Skill
            </Button>
          </div>
        </div>

        {skillsQuery.isLoading ? (
          <div className="flex py-16 justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : skills.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">
            No skills found.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {skills.map((skill) => (
              <div
                key={skill.id}
                className="flex min-h-20 items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-primary-300 hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(skill.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <NotebookPenIcon className="h-[18px] w-[18px] shrink-0 text-gray-700" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-gray-900">
                      {skill.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-gray-600">
                      {skill.description}
                    </span>
                  </span>
                  <ChevronRight className="h-[18px] w-[18px] shrink-0 text-gray-400" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${skill.title}`}
                  onClick={() => setDeleting(skill)}
                  className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {(page > 0 || Boolean(nextPageToken)) && (
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-500">
              {totalCount} {totalCount === 1 ? "skill" : "skills"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0 || skillsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextPageToken || skillsQuery.isFetching}
                onClick={() => {
                  setPageTokens((current) => [
                    ...current.slice(0, page + 1),
                    nextPageToken
                  ]);
                  setPage((current) => current + 1);
                }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      {deleteConfirmation}
    </div>
  );
}

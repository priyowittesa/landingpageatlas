"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Folder,
  Loader2,
  Mic,
  Paperclip,
  Plus,
  Search,
  Send,
  Sparkles,
  Square,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { KnowledgeFolder } from "@/app/app/ai-studio/atlas-knowledge-source/types";
import type { AiAssistantAttachment, AiAssistantMessage } from "./types";
import { uploadChatFile } from "./useAiAssistantChat";
import { useSpeechToText } from "./useSpeechToText";
import { useGetWorkflowSkills, type WorkflowSkill } from "./useWorkflowSkills";

const ENTER_HINT = "Enter to send · Shift + Enter for a new line";

const comparePngLast = (
  left: AiAssistantAttachment,
  right: AiAssistantAttachment
) => Number(/\.png$/i.test(left.name)) - Number(/\.png$/i.test(right.name));

type AiAssistantComposerProps = {
  disabled?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  initialMessage?: AiAssistantMessage;
  onSend: (
    content: string,
    attachments: AiAssistantAttachment[],
    projectId?: string | null,
    skillIds?: string[]
  ) => void;
  /** Knowledge folders offered in the "Select Project" menu. */
  projects?: KnowledgeFolder[];
  skillsEnabled?: boolean;
  /**
   * Project already assigned to the active session (from the session's
   * `project_names`). Shown as a locked badge — it cannot be changed.
   */
  lockedProjectName?: string | null;
  projectSelectionEnabled?: boolean;
  compact?: boolean;
};

export function AiAssistantComposer({
  disabled,
  value,
  onValueChange,
  initialMessage,
  onSend,
  projects,
  skillsEnabled = false,
  lockedProjectName = null,
  projectSelectionEnabled = true,
  compact = false
}: AiAssistantComposerProps) {
  const [attachments, setAttachments] = useState<AiAssistantAttachment[]>(() =>
    (initialMessage?.attachments ?? []).map((file) => ({
      ...file,
      fileId: file.id,
      mimeType: "",
      status: "complete"
    }))
  );
  const [isUploading, setIsUploading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    () => initialMessage?.skillIds ?? []
  );
  const [projectSearch, setProjectSearch] = useState("");
  const skillsQuery = useGetWorkflowSkills("", "", skillsEnabled);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    partialTranscript,
    error: speechError,
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording
  } = useSpeechToText({
    onTranscript: (text) =>
      onValueChange([value.trim(), text].filter(Boolean).join(" "))
  });

  const selectedProject = projects?.find(
    (project) => project.id === selectedProjectId
  );
  const filteredProjects = projects?.filter((project) =>
    project.title.toLowerCase().includes(projectSearch.trim().toLowerCase())
  );
  const skills = skillsQuery.data?.data.items ?? [];
  const selectedSkills = selectedSkillIds
    .map((skillId) => skills.find((skill) => skill.id === skillId))
    .filter((skill): skill is WorkflowSkill => Boolean(skill));
  const slashMatch = value.match(/(?:^|\s)\/([^\s/]*)$/);
  const slashQuery =
    skillsEnabled && slashMatch ? slashMatch[1].toLowerCase() : null;
  const slashSkills =
    slashQuery === null
      ? []
      : skills.filter(
          (skill) =>
            !selectedSkillIds.includes(skill.id) &&
            skill.title.toLowerCase().includes(slashQuery)
        );

  const isSpeechBusy = isTranscribing;
  const canSend =
    Boolean(value.trim()) && !disabled && !isUploading && !isSpeechBusy;

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId]
    );
  };

  const selectSlashSkill = (skill: WorkflowSkill) => {
    const slashIndex = value.lastIndexOf("/");
    onValueChange(
      slashIndex >= 0 ? value.slice(0, slashIndex).trimEnd() : value
    );
    setSelectedSkillIds((current) =>
      current.includes(skill.id) ? current : [...current, skill.id]
    );
  };

  const updateAttachment = (
    id: string,
    patch: Partial<AiAssistantAttachment>
  ) =>
    setAttachments((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

  /**
   * Uploads a single staged file through the /workflow/chat/uploads pipeline.
   * Resolves with the `file_id` and mirrors state into the chip for live UI.
   */
  const uploadAttachment = async (
    attachment: AiAssistantAttachment
  ): Promise<string> => {
    if (!attachment.file) {
      throw new Error("Attachment has no file to upload");
    }
    updateAttachment(attachment.id, { status: "uploading", error: undefined });
    try {
      const fileId = await uploadChatFile(attachment.file);
      updateAttachment(attachment.id, {
        status: "complete",
        fileId,
        file: undefined
      });
      return fileId;
    } catch (error) {
      updateAttachment(attachment.id, {
        status: "error",
        error: error instanceof Error ? error.message : "Upload failed"
      });
      throw error;
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const trimmed = value.trim();

    // Upload every staged file first. Already-complete attachments (e.g. from
    // a previous failed send) are reused; failed ones are retried.
    if (attachments.length > 0) {
      setIsUploading(true);
      const results = await Promise.allSettled(
        attachments.map(async (item) => {
          if (item.status === "complete" && item.fileId) return item.fileId;
          return uploadAttachment(item);
        })
      );
      setIsUploading(false);

      // If any upload failed, leave the chips in their error state so the user
      // can remove the offending file or hit send again to retry.
      if (results.some((result) => result.status === "rejected")) return;

      const finalAttachments = attachments.map((item, index) => {
        const result = results[index];
        const fileId =
          result.status === "fulfilled" ? result.value : item.fileId;
        return {
          ...item,
          status: "complete" as const,
          fileId,
          file: undefined
        };
      });

      onSend(trimmed, finalAttachments, selectedProjectId, selectedSkillIds);
    } else {
      onSend(trimmed, attachments, selectedProjectId, selectedSkillIds);
    }

    onValueChange("");
    setAttachments([]);
    setSelectedSkillIds([]);
  };

  return (
    <div
      className={cn("shrink-0", !compact && "border-t border-gray-100 p-3")}
    >
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((file) => (
            <span
              key={file.id}
              className={cn(
                "flex max-w-[200px] items-center gap-1 rounded-md px-2 py-1 text-[11px]",
                file.status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {file.status === "uploading" ? (
                <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
              ) : file.status === "error" ? (
                <AlertCircle className="h-3 w-3 shrink-0" />
              ) : (
                <Paperclip className="h-3 w-3 shrink-0" />
              )}
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((item) => item.id !== file.id)
                  )
                }
                aria-label={`Remove ${file.name}`}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isRecording ? (
        <div className="flex items-center gap-3 rounded-full border border-red-200 bg-red-50 px-3 py-2">
          <span className="flex items-center gap-0.5">
            {[0, 120, 240, 360, 480].map((delay) => (
              <span
                key={delay}
                className="w-0.5 animate-pulse rounded-full bg-red-500"
                style={{ height: "0.9rem", animationDelay: `${delay}ms` }}
              />
            ))}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-red-600">
            {partialTranscript || "Listening…"}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
          >
            <Square className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "relative flex items-end gap-1.5 border border-gray-200 bg-white px-2 py-1.5 transition-colors focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100",
              compact ? "rounded-lg shadow-sm" : "rounded-2xl"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                const newAttachments = files.map((file) => ({
                  id: `${file.name}-${file.lastModified}-${file.size}`,
                  name: file.name,
                  size: file.size,
                  mimeType: file.type || "application/octet-stream",
                  file,
                  status: "idle" as const
                }));
                setAttachments((current) =>
                  [...current, ...newAttachments].sort(comparePngLast)
                );
                event.target.value = "";
              }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Add attachments or project"
                  className={cn(
                    "flex shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100 hover:text-gray-600",
                    compact
                      ? "h-7 w-7 text-gray-700"
                      : "mb-0.5 h-8 w-8 text-gray-400"
                  )}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-44">
                <DropdownMenuItem
                  onSelect={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                  Add photos &amp; files
                </DropdownMenuItem>
                {projectSelectionEnabled &&
                  projects &&
                  projects.length > 0 &&
                  !lockedProjectName &&
                  !selectedProject && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <Folder className="h-4 w-4" />
                        Select Project
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56 p-0">
                        <label className="relative block p-2 pb-1">
                          <span className="sr-only">Search projects</span>
                          <input
                            value={projectSearch}
                            onChange={(event) =>
                              setProjectSearch(event.target.value)
                            }
                            onKeyDown={(event) => event.stopPropagation()}
                            placeholder="Search"
                            className="h-8 w-full rounded-md border border-gray-200 pl-8 pr-2 text-xs outline-none focus:border-primary-400"
                          />
                          <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                        </label>
                        <div className="max-h-48 overflow-y-auto p-1">
                          {filteredProjects?.length === 0 ? (
                            <p className="px-2 py-3 text-center text-xs text-gray-400">
                              No projects found.
                            </p>
                          ) : (
                            filteredProjects?.map((project) => (
                              <DropdownMenuItem
                                key={project.id}
                                onSelect={() => {
                                  setSelectedProjectId(project.id);
                                  setProjectSearch("");
                                }}
                              >
                                <Folder className="h-4 w-4 text-gray-500" />
                                <span className="truncate">
                                  {project.title}
                                </span>
                              </DropdownMenuItem>
                            ))
                          )}
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                {skillsEnabled && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Sparkles className="h-4 w-4" />
                      Use Skill
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      {skillsQuery.isLoading ? (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        </div>
                      ) : skills.length === 0 ? (
                        <p className="px-2 py-3 text-center text-xs text-gray-400">
                          No skills found.
                        </p>
                      ) : (
                        skills.map((skill) => {
                          const selected = selectedSkillIds.includes(skill.id);
                          return (
                            <DropdownMenuItem
                              key={skill.id}
                              onSelect={(event) => {
                                event.preventDefault();
                                toggleSkill(skill.id);
                              }}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {skill.title}
                              </span>
                              {selected && (
                                <Check className="h-4 w-4 text-primary-600" />
                              )}
                            </DropdownMenuItem>
                          );
                        })
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {slashQuery !== null && (
              <div className="absolute inset-x-0 bottom-full z-50 mb-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                {skillsQuery.isLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                ) : slashSkills.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-400">
                    No skills found.
                  </p>
                ) : (
                  slashSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSlashSkill(skill)}
                      className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {skill.title}
                    </button>
                  ))
                )}
              </div>
            )}

            <textarea
              id="ai-assistant-composer-input"
              autoFocus={Boolean(initialMessage)}
              rows={1}
              value={value}
              onChange={(event) => onValueChange(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  slashQuery !== null &&
                  slashSkills[0]
                ) {
                  event.preventDefault();
                  selectSlashSkill(slashSkills[0]);
                  return;
                }
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder="Ask me anything…"
              className={cn(
                "field-sizing-content max-h-28 min-w-0 flex-1 resize-none bg-transparent py-1 text-sm text-gray-800 outline-none placeholder:text-gray-400",
                compact ? "min-h-7" : "min-h-8 py-1.5"
              )}
            />

            <button
              type="button"
              onClick={() => void startRecording()}
              disabled={isSpeechBusy || disabled}
              aria-label={
                isTranscribing ? "Transcribing audio" : "Start voice input"
              }
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:pointer-events-none",
                compact
                  ? "h-7 w-7 text-gray-700"
                  : "mb-0.5 h-8 w-8 text-gray-400"
              )}
            >
              {isSpeechBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg transition-colors",
                compact ? "h-7 w-7" : "mb-0.5 h-8 w-8",
                canSend
                  ? "bg-primary-600 text-white hover:bg-primary-500"
                  : compact
                    ? "bg-primary-600/50 text-white"
                    : "bg-primary-100 text-white"
              )}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>

          {(selectedSkills.length > 0 ||
            lockedProjectName ||
            selectedProject) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="flex max-w-52 items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                >
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span className="truncate">{skill.title}</span>
                  <button
                    type="button"
                    onClick={() => toggleSkill(skill.id)}
                    aria-label={`Remove skill ${skill.title}`}
                    className="rounded p-0.5 text-blue-500 hover:bg-blue-100 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {(lockedProjectName || selectedProject) && (
                <span className="flex items-center gap-1.5 rounded-md bg-primary-50 px-2 py-1 text-xs font-medium text-primary-700">
                  <Folder className="h-3 w-3 shrink-0" />
                  <span className="max-w-[160px] truncate">
                    {lockedProjectName ?? selectedProject?.title}
                  </span>
                  {!lockedProjectName && projectSelectionEnabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(null)}
                      aria-label={`Remove project ${selectedProject?.title}`}
                      className="rounded p-0.5 text-primary-500 hover:bg-primary-100 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              )}
            </div>
          )}
        </>
      )}

      {isTranscribing && (
        <p className="mt-1.5 px-1 text-[10px] text-gray-400" role="status">
          Transcribing audio…
        </p>
      )}
      {speechError && (
        <p className="mt-1.5 px-1 text-[10px] text-red-600" role="alert">
          {speechError}
        </p>
      )}
      {!compact && !isSpeechBusy && !speechError && (
        <p className="mt-1.5 px-1 text-[10px] text-gray-400">{ENTER_HINT}</p>
      )}
    </div>
  );
}

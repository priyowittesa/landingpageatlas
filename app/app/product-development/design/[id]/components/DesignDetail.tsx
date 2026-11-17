"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Camera,
  Download,
  FileBox,
  MessageSquare,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { useAuthMe } from "@/hooks/useAuthMe";

import {
  statusClassMap,
  statusLabelMap,
  type DesignCommentDto,
  type DesignRevision,
} from "../../types";
import {
  useAddDesignComment,
  getDesignVersionDownloadUrl,
  useDesign,
  useDesignComments,
  useDesignVersions,
  useCreateDesign,
} from "../../hooks/useDesigns";
import { CadViewer } from "../../create/components/CadViewer";
import { DesignDecisionDialog } from "./DesignDecisionDialog";

const CAD_EXTENSIONS = ["step", "stp", "iges", "igs", "stl", "obj", "fbx", "glb", "gltf", "3ds", "dwg", "dxf"];
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).format(date);
}

export function DesignDetail({ designId }: { designId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionError, setRevisionError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [viewedRevision, setViewedRevision] = useState<DesignRevision | null>(null);
  const [fileLoadingId, setFileLoadingId] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const revisionInput = useRef<HTMLInputElement>(null);
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: me } = useAuthMe();

  const { data: design, isLoading, isError, error, refetch } = useDesign(designId);
  const selectedVersionId = viewedRevision?.id ?? design?.active_version_id;
  const {
    data: versionComments = [],
    isLoading: commentsLoading,
    isError: commentsError,
    refetch: refetchComments,
  } = useDesignComments(selectedVersionId);
  const {
    data: revisions = [],
    isLoading: revisionsLoading,
    isError: revisionsError,
    refetch: refetchRevisions,
  } = useDesignVersions(designId, activeTab === "revisions");
  const addComment = useAddDesignComment();
  const createRevision = useCreateDesign();

  const displayedVersion = viewedRevision?.version ?? design?.version ?? "";
  const displayedFileName = viewedRevision?.file_name ?? design?.file_name ?? "";
  const displayedFileSize = viewedRevision?.file_size ?? design?.file_size ?? "";
  const displayedUploadedAt = viewedRevision?.uploaded_at ?? design?.uploaded_at ?? "";

  const openRevisionFile = async (revision: DesignRevision, download = false) => {
    if (!download) {
      setViewedRevision(revision);
      setActiveTab("overview");
      return;
    }

    setFileLoadingId(revision.id);
    try {
      const url = await getDesignVersionDownloadUrl(revision.id);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to download design file");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const extension = extensionOf(revision.file_name ?? "");
      const baseName = revision.display_name ||
        (revision.file_name ? revision.file_name.replace(/\.[^.]+$/, "") : "design");
      const displayName = `${baseName}-${revision.version}`;
      const downloadName =
        extension && !displayName.toLowerCase().endsWith(`.${extension}`)
          ? `${displayName}.${extension}`
          : displayName;
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get file URL");
    } finally {
      setFileLoadingId("");
    }
  };

  useEffect(() => {
    if (!selectedVersionId) return;

    let cancelled = false;

    void (async () => {
      setPreviewLoading(true);
      setPreviewFile(null);
      try {
        const url = await getDesignVersionDownloadUrl(selectedVersionId);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load design file");
        const blob = await response.blob();
        if (cancelled) return;
        setPreviewFile(
          new File([blob], displayedFileName || `design-${displayedVersion}`, {
            type: blob.type || "application/octet-stream",
          })
        );
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load design file");
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedVersionId, displayedFileName, displayedVersion]);

  const chooseRevisionFile = (next?: File) => {
    if (!next) return;
    const extension = extensionOf(next.name);
    if (!CAD_EXTENSIONS.includes(extension)) {
      setRevisionError("File harus berupa CAD: STEP, STP, IGES, IGS, STL, OBJ, FBX, GLB, GLTF, 3DS, DWG, atau DXF.");
      setRevisionFile(null);
      return;
    }
    if (next.size > MAX_FILE_SIZE) {
      setRevisionError("Ukuran file CAD maksimal 100 MB.");
      setRevisionFile(null);
      return;
    }
    setRevisionError("");
    setRevisionFile(next);
  };

  const exitEditMode = () => {
    setEditMode(false);
    setRevisionFile(null);
    setRevisionError("");
  };

  const submitRevision = () => {
    if (!design) return;
    if (!revisionFile) {
      setRevisionError("Pilih file CAD terlebih dahulu.");
      return;
    }
    createRevision.mutate(
      {
        project_planning_id: design.project.id,
        code: design.design_no,
        title: design.name,
        description: design.description,
        file: revisionFile,
      },
      {
        onSuccess: (response) => {
          exitEditMode();
          setViewedRevision(null);
          const payload = response as Record<string, unknown> | undefined;
          const nested = payload?.data as Record<string, unknown> | undefined;
          const createdDesignId = String(payload?.id ?? nested?.id ?? "");
          router.push(createdDesignId ? `/app/product-development/design/${createdDesignId}` : "/app/product-development/design");
        },
      }
    );
  };

  useEffect(() => {
    if (!design) return;
    setBreadcrumbItems([
      { title: "Product Development" },
      { title: "Design", href: "/app/product-development/design" },
      { title: design.name || design.design_no || "Design" },
    ]);
  }, [design, setBreadcrumbItems]);

  useEffect(() => {
    return () => clearBreadcrumbs();
  }, [clearBreadcrumbs]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl pb-10 text-xs text-gray-400">
        Loading design...
      </div>
    );
  }

  if (isError || !design) {
    const message =
      error?.response?.data?.message ?? error?.message ?? "Design data was not found.";
    return (
      <div className="mx-auto max-w-7xl space-y-4 pb-10">
        <button
          type="button"
          onClick={() => router.push("/app/product-development/design")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> Design
        </button>
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-red-700">Failed to load design</p>
            <p className="text-xs text-red-500">{message}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/app/product-development/design")}
              >
                Back to list
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submitComment = () => {
    if (!selectedVersionId) {
      setCommentError("Design version was not found.");
      return;
    }
    if (!comment.trim()) {
      setCommentError("Please add a comment before posting.");
      return;
    }
    setCommentError("");
    const keycloakRole = me?.roles?.find(
      (role) =>
        role !== "offline_access" &&
        role !== "uma_authorization" &&
        !role.startsWith("default-roles-"),
    );
    const commenterRole = me?.labour?.role_name || keycloakRole || "";
    const payload: DesignCommentDto = {
      text: comment.trim(),
      commenter_role: commenterRole,
    };
    addComment.mutate(
      {
        designId: design.id,
        versionId: selectedVersionId,
        payload,
      },
      {
        onSuccess: () => setComment(""),
      }
    );
  };

  const decisionByLabel = design.status === "rejected" ? "REJECTED BY" : "APPROVED BY";
  const decisionByValue =
    design.status === "on_hold" || design.status === "deferred"
      ? "—"
      : design.approved_by || "—";

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => router.push("/app/product-development/design")}
          className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" /> {design.name}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={`text-[10px] font-medium ${statusClassMap[design.status]}`}
        >
          {statusLabelMap[design.status]}
        </Badge>
        <span className="text-[11px] text-gray-500">
          {design.design_no} · {displayedVersion} · {displayedFileSize}
        </span>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-10 w-full justify-start rounded-none border-b border-gray-200 bg-transparent p-0">
          <TabsTrigger
            value="overview"
            className="h-10 rounded-none border-b-2 border-transparent px-4 text-xs font-medium shadow-none data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:text-primary-700 data-[state=active]:shadow-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="revisions"
            className="h-10 rounded-none border-b-2 border-transparent px-4 text-xs font-medium shadow-none data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:text-primary-700 data-[state=active]:shadow-none"
          >
            Revision History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {revisionFile || previewFile ? (
                    <div className="[&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
                      <CadViewer file={revisionFile ?? previewFile!} />
                    </div>
                  ) : previewLoading ? (
                    <div className="flex h-72 items-center justify-center text-xs text-gray-400">
                      Loading design file...
                    </div>
                  ) : (
                    <div className="flex h-72 flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-50 to-primary-100 text-xs text-primary-500">
                    {design.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={design.thumbnail_url}
                        alt={design.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <Camera className="h-8 w-8" />
                        <span>CAD snapshot | reference image</span>
                        <span className="text-[10px] text-primary-400">
                          {displayedFileName} · {displayedFileSize}
                        </span>
                      </>
                    )}
                    </div>
                  )}
                </CardContent>
                {!editMode && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-800">
                        {displayedFileName || "CAD snapshot"}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-gray-500">
                        {[displayedFileName, displayedFileSize].filter(Boolean).join(" · ") || "No file information"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(true)}
                      >
                        <UploadCloud className="h-3.5 w-3.5" />
                        Revise File
                      </Button>
                    </div>
                  </div>
                )}

                {editMode && (
                  <div className="space-y-3 border-t border-gray-100 px-4 py-3">
                    <div>
                      <p className="text-xs font-medium text-gray-800">Upload revised CAD file</p>
                      <p className="mt-0.5 text-[11px] text-gray-500">Replace the current file when corrections or missing details are found.</p>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => revisionInput.current?.click()}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") revisionInput.current?.click();
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        chooseRevisionFile(event.dataTransfer.files[0]);
                      }}
                      className={`flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 text-center transition ${
                        dragging
                          ? "border-violet-700 bg-violet-100"
                          : "border-violet-300 bg-violet-50"
                      }`}
                    >
                      <input
                        ref={revisionInput}
                        type="file"
                        className="hidden"
                        accept=".step,.stp,.iges,.igs,.stl,.obj,.fbx,.glb,.gltf,.3ds,.dwg,.dxf"
                        onChange={(event) => chooseRevisionFile(event.target.files?.[0])}
                      />
                      {revisionFile ? (
                        <>
                          <FileBox className="mb-2 h-6 w-6 text-violet-700" />
                          <p className="text-xs font-semibold text-gray-900">
                            {revisionFile.name}
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-500">
                            {formatBytes(revisionFile.size)} · {extensionOf(revisionFile.name).toUpperCase()} CAD
                          </p>
                          <button
                            type="button"
                            className="mt-2 inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRevisionFile(null);
                            }}
                          >
                            <X className="h-3 w-3" /> Remove file
                          </button>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="mb-2 h-6 w-6 text-violet-700" />
                          <p className="text-xs font-semibold text-violet-800">
                            Drop revised CAD file or browse
                          </p>
                          <p className="mt-0.5 text-[10px] text-gray-500">
                            3D: STL, OBJ, FBX, GLB, GLTF, 3DS - 2D: DWG, DXF - max 100 MB
                          </p>
                        </>
                      )}
                    </div>
                    {revisionError && (
                      <p className="rounded-md bg-red-50 px-2 py-1.5 text-[11px] text-red-600">
                        {revisionError}
                      </p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exitEditMode}
                        disabled={createRevision.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-violet-700 hover:bg-violet-800"
                        onClick={submitRevision}
                        disabled={createRevision.isPending || !revisionFile}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {createRevision.isPending ? "Saving..." : "Save Revision for Review"}
                      </Button>
                    </div>
                  </div>
                )}

              </Card>

              <Card>
                <CardHeader className="border-b border-gray-100 px-4 py-3">
                  <CardTitle className="text-xs font-semibold">
                    Review Comments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 py-4">
                  {commentsLoading ? (
                    <p className="text-xs text-gray-400">Loading comments...</p>
                  ) : commentsError ? (
                    <div className="flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2">
                      <p className="text-xs text-red-600">Failed to load comments.</p>
                      <Button size="sm" variant="outline" onClick={() => refetchComments()}>
                        Retry
                      </Button>
                    </div>
                  ) : versionComments.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      No comments yet. Reviewers can leave annotations below.
                    </p>
                  ) : (
                    versionComments.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-md border border-gray-100 bg-gray-50/50 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-medium text-gray-700">
                            {entry.author} · {entry.role}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{entry.text}</p>
                      </div>
                    ))
                  )}
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <Textarea
                      value={comment}
                      onChange={(event) => {
                        setComment(event.target.value);
                        if (commentError) setCommentError("");
                      }}
                      placeholder="Add a review comment or simulation..."
                      rows={3}
                      className="text-xs"
                    />
                    {commentError && (
                      <p className="text-[10px] text-red-500">{commentError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setComment("");
                          setCommentError("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="bg-primary-700 hover:bg-primary-800"
                        onClick={() => submitComment()}
                        disabled={addComment.isPending || !comment.trim()}
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Post
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border-dashed border-blue-200">
                <CardHeader className="border-b border-gray-100 px-4 py-3">
                  <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    Design Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 py-4 text-xs">
                  <Detail label="STATUS" value={
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${statusClassMap[design.status]}`}
                    >
                      {statusLabelMap[design.status]}
                    </Badge>
                  } />
                  <Detail label="VERSION" value={displayedVersion} />
                  <Detail label="REVISIONS" value={String(design.revisions.length)} />
                  <Detail label="UPLOADED BY" value={design.uploaded_by || "—"} />
                  <Detail label="UPLOAD DATE" value={formatDate(displayedUploadedAt)} />
                  <Detail label="FILE SIZE" value={displayedFileSize || "—"} />
                  <Detail label={decisionByLabel} value={decisionByValue} />

                  {(design.status === "draft" || design.status === "in_review" || design.status === "on_hold" || design.status === "deferred") && (
                    <Button
                      className="mt-2 w-full bg-violet-700 hover:bg-violet-800"
                      onClick={() => setDecisionDialogOpen(true)}
                    >
                      Design Decision
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revisions" className="space-y-3">
          <Card>
            <CardHeader className="border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs font-semibold">
                Revision History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 px-4 py-4">
              {revisionsLoading ? (
                <p className="text-xs text-gray-400">Loading revision history...</p>
              ) : revisionsError ? (
                <div className="flex items-center justify-between gap-3 rounded-md bg-red-50 px-3 py-2">
                  <p className="text-xs text-red-600">Failed to load revision history.</p>
                  <Button size="sm" variant="outline" onClick={() => refetchRevisions()}>
                    Retry
                  </Button>
                </div>
              ) : revisions.length === 0 ? (
                <p className="text-xs text-gray-400">No previous revisions.</p>
              ) : (
                revisions.map((revision, index) => (
                  <div
                    key={revision.id || `${revision.version}-${index}`}
                    className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50/40 px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {revision.version}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {revision.file_name || revision.uploaded_by} · {formatDate(revision.uploaded_at)} ·{" "}
                        {revision.file_size}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        disabled={fileLoadingId === revision.id}
                        onClick={() => openRevisionFile(revision)}
                      >
                        {fileLoadingId === revision.id ? "Loading..." : "View"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        disabled={fileLoadingId === revision.id}
                        onClick={() => openRevisionFile(revision, true)}
                      >
                        <Download className="mr-1 h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DesignDecisionDialog
        open={decisionDialogOpen}
        onOpenChange={setDecisionDialogOpen}
        designId={design.id}
        versionId={selectedVersionId ?? ""}
        designNo={design.design_no}
        designName={design.name}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 text-xs font-medium text-gray-800">
        {value || "—"}
      </div>
    </div>
  );
}

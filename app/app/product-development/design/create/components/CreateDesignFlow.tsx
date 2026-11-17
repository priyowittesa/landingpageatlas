"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileBox, RotateCcw, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProjectList } from "../../../project-planning/hooks/useProjectPlanning";
import { useCreateDesign } from "../../hooks/useDesigns";
import { CadViewer } from "./CadViewer";

const CAD_EXTENSIONS = ["step", "stp", "iges", "igs", "stl", "obj", "fbx", "glb", "gltf", "3ds", "dwg", "dxf"];
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CreateDesignFlow() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [projectId, setProjectId] = useState("");
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const { data: projectData, isLoading: projectsLoading } = useProjectList({ page_size: 100 });
  const create = useCreateDesign();

  const chooseFile = (next?: File) => {
    if (!next) return;
    const extension = extensionOf(next.name);
    if (!CAD_EXTENSIONS.includes(extension)) {
      setError("File harus berupa CAD: STEP, STP, IGES, IGS, STL, OBJ, FBX, GLB, GLTF, 3DS, DWG, atau DXF.");
      setFile(null);
      return;
    }
    if (next.size > MAX_FILE_SIZE) {
      setError("Ukuran file CAD maksimal 100 MB.");
      setFile(null);
      return;
    }
    setError("");
    setFile(next);
  };

  const continueToReview = () => {
    if (!projectId || !code.trim() || !title.trim() || !file) {
      setError("Project, Code, Title, dan CAD File wajib diisi.");
      return;
    }
    setError("");
    setStep("review");
  };

  const saveDesign = () => {
    if (!file) return;
    create.mutate(
      {
        project_planning_id: projectId,
        code: code.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        file,
      },
      {
        onSuccess: (response) => {
          const payload = response as Record<string, unknown> | undefined;
          const nested = payload?.data as Record<string, unknown> | undefined;
          const id = String(payload?.id ?? nested?.id ?? "");
          router.push(id ? `/app/product-development/design/${id}` : "/app/product-development/design");
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 pb-10">
      <button type="button" onClick={() => step === "review" ? setStep("upload") : router.push("/app/product-development/design")} className="flex items-center gap-2 text-sm font-semibold text-gray-800 hover:text-primary-700">
        <ArrowLeft className="h-4 w-4" /> {step === "upload" ? "New Design" : title}
      </button>
      <div>
        <h1 className="text-2xl font-bold text-gray-950">{step === "upload" ? "New Design" : "Review CAD Design"}</h1>
        <p className="mt-1 text-sm text-gray-500">{step === "upload" ? "Every design belongs to a project. Upload a valid engineering CAD file to continue." : "Inspect the model, then save the design."}</p>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-violet-700"><span className="grid h-6 w-6 place-items-center rounded-full bg-violet-700 text-white">1</span> Details & file</span>
        <div className="h-px w-12 bg-gray-200" />
        <span className={`inline-flex items-center gap-1.5 font-semibold ${step === "review" ? "text-violet-700" : "text-gray-400"}`}><span className={`grid h-6 w-6 place-items-center rounded-full ${step === "review" ? "bg-violet-700 text-white" : "bg-gray-100"}`}>2</span> Preview & review</span>
      </div>

      {step === "upload" ? (
        <Card><CardContent className="space-y-5 p-6">
          <div className="space-y-1.5"><label className="text-sm font-semibold text-gray-700">Project *</label>
            <Select value={projectId} onValueChange={setProjectId}><SelectTrigger className="h-11"><SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select project"} /></SelectTrigger><SelectContent>{(projectData?.items ?? []).map((project) => <SelectItem key={project.id} value={project.id}>{project.project_no} — {project.name}</SelectItem>)}</SelectContent></Select>
            <p className="text-xs text-gray-400">Pick the project this design belongs to.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label htmlFor="design-code" className="text-sm font-semibold text-gray-700">Code *</label><Input id="design-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="e.g. CAD-MVC-2.0" className="h-11" /></div>
            <div className="space-y-1.5"><label htmlFor="design-title" className="text-sm font-semibold text-gray-700">Title *</label><Input id="design-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. MV-CONN-001 — IP68 Housing Assembly" className="h-11" /></div>
          </div>
          <div className="space-y-1.5"><label htmlFor="design-description" className="text-sm font-semibold text-gray-700">Description</label><Textarea id="design-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Briefly describe the design intent, scope, or notes for engineering reviewers." /></div>
          <div className="space-y-1.5"><label className="text-sm font-semibold text-gray-700">CAD File *</label>
            <div role="button" tabIndex={0} onClick={() => fileInput.current?.click()} onKeyDown={(event) => { if (event.key === "Enter") fileInput.current?.click(); }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files[0]); }} className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 text-center transition ${dragging ? "border-violet-700 bg-violet-100" : "border-violet-500 bg-violet-50"}`}>
              <input ref={fileInput} type="file" className="hidden" accept=".step,.stp,.iges,.igs,.stl,.obj,.fbx,.glb,.gltf,.3ds,.dwg,.dxf" onChange={(event) => chooseFile(event.target.files?.[0])} />
              {file ? <><FileBox className="mb-3 h-7 w-7 text-violet-700" /><p className="font-semibold text-gray-900">{file.name}</p><p className="mt-1 text-xs text-gray-500">{formatBytes(file.size)} - {extensionOf(file.name).toUpperCase()} CAD</p><Progress value={100} className="mt-4 h-1.5 max-w-72" /><p className="mt-2 text-xs font-medium text-violet-700">Upload ready</p></> : <><UploadCloud className="mb-3 h-7 w-7 text-violet-700" /><p className="font-semibold text-violet-800">Drop CAD file or browse files</p><p className="mt-1 text-xs text-gray-500">3D: STL, OBJ, FBX, GLB, GLTF, 3DS - 2D: DWG, DXF - max 100 MB</p></>}
            </div>
            {file && <button type="button" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600" onClick={() => setFile(null)}><X className="h-3 w-3" /> Remove file</button>}
          </div>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 border-t pt-4"><Button variant="outline" onClick={() => router.push("/app/product-development/design")}>Cancel</Button><Button className="bg-violet-700 hover:bg-violet-800" onClick={continueToReview}>Continue to Preview</Button></div>
        </CardContent></Card>
      ) : file && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <CadViewer file={file} />
          </div>
          <div className="space-y-4"><Card><CardContent className="space-y-4 p-5"><h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Design Info</h2><Info label="Project" value={(projectData?.items ?? []).find((project) => project.id === projectId)?.name ?? projectId} /><Info label="Code" value={code} /><Info label="Title" value={title} /><Info label="Description" value={description || "—"} /><Info label="File" value={file.name} /><Info label="Format" value={extensionOf(file.name).toUpperCase()} /><Info label="File size" value={formatBytes(file.size)} /><Info label="Status" value="Draft" /></CardContent></Card>
            <Button className="w-full bg-violet-700 hover:bg-violet-800" onClick={saveDesign} disabled={create.isPending}><CheckCircle2 className="h-4 w-4" />{create.isPending ? "Saving Design..." : "Save Design"}</Button>
            <Button variant="outline" className="w-full" onClick={() => setStep("upload")}><RotateCcw className="h-4 w-4" /> Edit Details</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-gray-100 pb-3 last:border-0"><p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p><p className="mt-1 break-words text-sm font-medium text-gray-800">{value || "—"}</p></div>;
}

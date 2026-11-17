"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, CalendarDays, ChevronDown, ChevronUp, Circle, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LazySelect from "@/components/LazySelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { useEmployees } from "@/app/app/master-data/employee/use-employees";
import { categoryClassMap, taskPriorityClassMap, taskStatusClassMap, type ProjectPlanning, type ProjectStage, type ProjectTask, type ProjectWorkPackage } from "../../types";
import { useAddWorkPackage, useDeleteWorkPackage, useProject, useProjectTasks, useProjectTimeline, useProjectWorkPackages } from "../../hooks/useProjectPlanning";
import { TaskDialog } from "./TaskDialog";

const STAGES: { key: ProjectStage; label: string }[] = [
  { key: "planning", label: "Planning" }, { key: "design", label: "Design" },
  { key: "prototype", label: "Prototype" }, { key: "completed", label: "Completed" },
];
const WORK_PACKAGE_OPTIONS = ["Design Phase", "Prototype Phase"];

export function ProjectPlanningDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workPackageDialogOpen, setWorkPackageDialogOpen] = useState(false);
  const [deletingWorkPackage, setDeletingWorkPackage] = useState<ProjectWorkPackage | null>(null);
  const [dialogPhase, setDialogPhase] = useState<string>();
  const [dialogWorkPackageId, setDialogWorkPackageId] = useState("");
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { data: project, isLoading, isError, error } = useProject(projectId);
  const { data: workPackages = [], isLoading: workPackagesLoading } = useProjectWorkPackages(projectId);
  const { data: tasks = [] } = useProjectTasks(projectId, workPackages);
  const { data: timeline = [] } = useProjectTimeline(projectId);
  const availableWorkPackageOptions = WORK_PACKAGE_OPTIONS.filter(
    (option) =>
      !workPackages.some(
        (workPackage) =>
          workPackage.name.trim().toLowerCase() === option.toLowerCase(),
      ),
  );

  useEffect(() => {
    if (!project) return;

    setBreadcrumbItems([
      { title: "Product Development" },
      {
        title: "Project Planning",
        href: "/app/product-development/project-planning",
      },
      { title: project.name || project.project_no || "Project" },
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, project, setBreadcrumbItems]);

  if (isLoading) return <div className="mx-auto max-w-7xl pb-10 text-xs text-gray-400">Loading project...</div>;
  if (isError || !project) return <Card className="mx-auto max-w-7xl"><CardContent className="p-5"><p className="text-sm font-medium text-red-700">Failed to load project planning</p><p className="mt-1 text-xs text-red-500">{error?.response?.data?.message ?? error?.message ?? "Project planning data was not found."}</p></CardContent></Card>;
  const activeStageIndex = Math.max(0, STAGES.findIndex((stage) => stage.key === project.current_stage));
  const openAdd = (workPackage: ProjectWorkPackage) => { setSelectedTask(null); setDialogPhase(workPackage.name); setDialogWorkPackageId(workPackage.id); setDialogOpen(true); };
  const openEdit = (task: ProjectTask) => { setSelectedTask(task); setDialogPhase(task.phase); setDialogWorkPackageId(task.work_package_id); setDialogOpen(true); };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-10">
      <div>
        <button type="button" onClick={() => router.push("/app/product-development/project-planning")} className="flex items-center gap-2 text-base font-semibold text-gray-900 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" /> {project.name}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-2 pl-6">
          {project.risk_tags.map((tag) => <Badge key={tag} variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-600">{tag}</Badge>)}
          <Badge variant="outline" className={`text-[10px] ${categoryClassMap[project.category]}`}>{titleCase(project.category)}</Badge>
        </div>
      </div>
      <Lifecycle activeStageIndex={activeStageIndex} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center border-b border-gray-200">
          <TabsList className="h-9 flex-1 justify-start rounded-none bg-transparent p-0">
            {[["overview", "Overview"], ["work-packages", "Work Packages"], ["timeline", "Timeline"]].map(([value, label]) => (
              <TabsTrigger key={value} value={value} className="h-9 rounded-none border-b-2 border-transparent px-4 text-xs shadow-none data-[state=active]:border-primary-600 data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:shadow-none">{label}</TabsTrigger>
            ))}
          </TabsList>
          {activeTab === "work-packages" && availableWorkPackageOptions.length > 0 && <Button size="sm" variant="outline" className="mb-1 h-8" onClick={() => setWorkPackageDialogOpen(true)}><Plus className="mr-1 h-3.5 w-3.5" /> Add Work Package</Button>}
        </div>

        <TabsContent value="overview" className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Work Packages" value={project.summary.work_packages || workPackages.length} />
            <SummaryCard label="Total Tasks" value={project.summary.total} />
            <SummaryCard label="In Progress" value={project.summary.in_progress_tasks} />
            <SummaryCard label="Completed" value={project.summary.completed_tasks} />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_270px]">
            <Card>
              <CardHeader className="px-5 pb-2 pt-4"><CardTitle className="text-sm">Project Details</CardTitle></CardHeader>
              <CardContent className="grid gap-x-10 gap-y-4 px-5 pb-5 text-xs sm:grid-cols-2">
                <Detail label="Customer" value={project.customer} /><Detail label="Classification" value={titleCase(project.classification)} />
                <Detail label="Project Manager" value={project.project_manager.name} /><Detail label="Current Stage" value={titleCase(project.current_stage)} />
                <Detail label="Start Date" value={formatDate(project.start_date)} /><Detail label="Due Date" value={formatDate(project.due_date)} />
                <div className="sm:col-span-2"><p className="text-[9px] uppercase text-gray-400">Source Request</p><div className="mt-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700"><span className="font-semibold">{project.source_request.request_no || "—"}</span>{project.source_request.name && `  ${project.source_request.name}`}{project.source_request.approved_at && `  Gate 1 approved ${formatDate(project.source_request.approved_at)}`}</div></div>
              </CardContent>
            </Card>
            <ProgressCard project={project} />
          </div>
        </TabsContent>

        <TabsContent value="work-packages" className="space-y-3 pt-1">
          {workPackagesLoading ? <p className="py-6 text-center text-xs text-gray-400">Loading work packages...</p> : <>{workPackages.length === 0 ? <Card><CardContent className="py-10 text-center text-xs text-gray-400">No work packages found.</CardContent></Card> : workPackages.map((workPackage) => <WorkPackage key={workPackage.id} phase={workPackage.name} tasks={tasks.filter((task) => task.work_package_id === workPackage.id)} owner={workPackage.owner_name || project.project_manager.name} onAdd={() => openAdd(workPackage)} onEdit={openEdit} onDelete={() => setDeletingWorkPackage(workPackage)} />)}</>}
        </TabsContent>

        <TabsContent value="timeline" className="pt-1">
          <Card><CardHeader className="px-5 py-4"><CardTitle className="text-sm">Activity History</CardTitle></CardHeader><CardContent className="px-5 pb-5">
            {timeline.length === 0 ? <p className="text-xs text-gray-400">No timeline events yet.</p> : <div>{timeline.map((entry, index) => <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">{index < timeline.length - 1 && <span className="absolute left-[5px] top-3 h-full w-px bg-gray-200" />}<Circle className="relative z-10 mt-1 h-3 w-3 fill-primary-600 text-primary-600" /><div><p className="font-mono text-[10px] text-gray-400">{formatDateTime(entry.timestamp)}</p><p className="mt-1 text-xs font-medium text-gray-800">{entry.description}</p><p className="mt-0.5 text-[10px] text-gray-400">Updated by: {entry.actor || "System"}</p></div></div>)}</div>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} projectId={projectId} workPackageId={dialogWorkPackageId} phase={dialogPhase} task={selectedTask} />
      <AddWorkPackageDialog open={workPackageDialogOpen} onOpenChange={setWorkPackageDialogOpen} projectId={projectId} options={availableWorkPackageOptions} />
      <DeleteWorkPackageDialog workPackage={deletingWorkPackage} onOpenChange={(open) => { if (!open) setDeletingWorkPackage(null); }} projectId={projectId} />
    </div>
  );
}

function AddWorkPackageDialog({ open, onOpenChange, projectId, options }: { open: boolean; onOpenChange: (open: boolean) => void; projectId: string; options: string[] }) {
  const create = useAddWorkPackage();
  const employeesQuery = useEmployees();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !ownerId) return;
    const owner = employeesQuery.data?.find((employee) => employee.id === ownerId);
    if (!owner) return;
    create.mutate(
      {
        project_id: projectId,
        title: title.trim(),
        description: description.trim(),
        owner_id: owner.id,
        owner_name: owner.full_name,
        status: "pending",
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setOwnerId("");
          onOpenChange(false);
        },
      },
    );
  };

  const employeeOptions = (employeesQuery.data ?? []).map((employee) => ({
    label: `${employee.full_name}${employee.code ? ` (${employee.code})` : ""}`,
    value: employee.id,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Work Package</DialogTitle>
          <DialogDescription>
            Select a work package that has not been added yet.
          </DialogDescription>
        </DialogHeader>
        <form id="work-package-form" onSubmit={submit} className="space-y-3">
          <LazySelect
            label="Work Package"
            name="work-package-title"
            value={title}
            onChange={setTitle}
            options={options.map((option) => ({ label: option, value: option }))}
            totalLoaded={options.length}
            isLoading={false}
            isFetchingNextPage={false}
            hasMore={false}
            onLoadMore={() => undefined}
            placeholder="Select work package"
            searchPlaceholder="Search work package..."
            emptyMessage="No work package found."
            required
          />
          <LazySelect
            label="Owner"
            name="work-package-owner"
            value={ownerId}
            onChange={setOwnerId}
            options={employeeOptions}
            totalLoaded={employeeOptions.length}
            isLoading={employeesQuery.isLoading}
            isFetchingNextPage={false}
            hasMore={false}
            onLoadMore={() => undefined}
            placeholder="Select employee"
            searchPlaceholder="Search employee..."
            emptyMessage="No employee found."
            error={employeesQuery.isError ? "Failed to load employees." : undefined}
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="work-package-description" className="text-xs font-medium">
              Description
            </label>
            <Textarea
              id="work-package-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe this work package"
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="work-package-form" disabled={create.isPending || !title || !ownerId}>
            {create.isPending ? "Saving..." : "Add Work Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteWorkPackageDialog({ workPackage, onOpenChange, projectId }: { workPackage: ProjectWorkPackage | null; onOpenChange: (open: boolean) => void; projectId: string }) {
  const remove = useDeleteWorkPackage();
  const confirmDelete = () => {
    if (!workPackage) return;
    remove.mutate(
      { project_id: projectId, work_package_id: workPackage.id },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return <Dialog open={Boolean(workPackage)} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Delete Work Package</DialogTitle><DialogDescription>Delete {workPackage?.name}? Tasks inside this work package may also be deleted.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="button" variant="destructive" disabled={remove.isPending} onClick={confirmDelete}>{remove.isPending ? "Deleting..." : "Delete"}</Button></DialogFooter></DialogContent></Dialog>;
}

function Lifecycle({ activeStageIndex }: { activeStageIndex: number }) {
  return <Card><CardContent className="px-5 py-4"><p className="text-sm font-semibold text-gray-800">Project Lifecycle</p><div className="mt-4 flex items-start">{STAGES.map((stage, index) => <div key={stage.key} className="flex min-w-0 flex-1 items-start last:flex-none"><div className="flex flex-col items-center"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] ${index <= activeStageIndex ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-400"}`}>{index + 1}</span><span className={`mt-1 text-[10px] ${index <= activeStageIndex ? "text-primary-700" : "text-gray-400"}`}>{stage.label}</span></div>{index < STAGES.length - 1 && <span className={`mx-3 mt-3 h-px flex-1 ${index < activeStageIndex ? "bg-primary-500" : "bg-gray-200"}`} />}</div>)}</div></CardContent></Card>;
}

function WorkPackage({ phase, tasks, owner, onAdd, onEdit, onDelete }: { phase: string; tasks: ProjectTask[]; owner: string; onAdd: () => void; onEdit: (task: ProjectTask) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const isCompleted = tasks.length > 0 && completed === tasks.length;
  const hours = tasks.reduce((total, task) => total + (task.estimate_hours ?? 0), 0);
  return <Card><div className="flex items-center"><button type="button" onClick={() => setExpanded((value) => !value)} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-5 py-3 text-left"><div><p className="text-xs font-semibold text-gray-800">{phase}</p><p className="mt-1 text-[10px] text-gray-500">Owner: <span className="font-medium text-gray-700">{owner || "Unassigned"}</span>{hours > 0 && ` · Allocated: ${hours}h`}</p></div><div className="flex items-center gap-3"><Badge variant="outline" className={isCompleted ? "border-emerald-200 bg-emerald-50 text-[10px] text-emerald-600" : "border-amber-200 bg-amber-50 text-[10px] text-amber-600"}>{isCompleted ? "Completed" : "In Progress"}</Badge><span className="flex items-center gap-1 text-[10px] text-gray-600"><CalendarDays className="h-3 w-3" /> {completed}/{tasks.length} Tasks</span>{expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</div></button><Button type="button" variant="ghost" size="icon" onClick={onDelete} className="mr-3 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${phase}`}><Trash2 className="h-4 w-4" /></Button></div>{expanded && <><div className="overflow-x-auto border-y border-gray-100"><Table className="min-w-190"><TableHeader><TableRow className="bg-gray-50/70 hover:bg-gray-50/70"><TableHead>Task Name</TableHead><TableHead>Assignee</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Estimate</TableHead><TableHead>Due Date</TableHead><TableHead className="text-center">Risk</TableHead></TableRow></TableHeader><TableBody>{tasks.length === 0 ? <TableRow><TableCell colSpan={7} className="py-6 text-center text-xs text-gray-400">No tasks in this work package.</TableCell></TableRow> : tasks.map((task) => <TableRow key={task.id} onClick={() => onEdit(task)} className="cursor-pointer border-gray-100 hover:bg-primary-50/40"><TableCell className="text-xs font-medium text-gray-800">{task.task_name}</TableCell><TableCell className="text-xs text-gray-600">{task.assignee?.name || "Unassigned"}</TableCell><TableCell><Badge variant="outline" className={`text-[10px] ${taskStatusClassMap[task.status]}`}>{titleCase(task.status)}</Badge></TableCell><TableCell><Badge variant="outline" className={`text-[10px] ${taskPriorityClassMap[task.priority]}`}>{titleCase(task.priority)}</Badge></TableCell><TableCell className="text-xs text-gray-500">{task.estimate_hours ? `${task.estimate_hours}h` : "—"}</TableCell><TableCell className="font-mono text-[10px] text-gray-600">{formatDate(task.end_date || task.due_date)}</TableCell><TableCell className="text-center">{task.status === "blocked" || task.priority === "critical" ? <AlertTriangle className="mx-auto h-3.5 w-3.5 text-amber-500" /> : "—"}</TableCell></TableRow>)}</TableBody></Table></div><button type="button" onClick={onAdd} className="flex w-full items-center gap-1 px-5 py-3 text-left text-xs font-medium text-primary-700 hover:bg-primary-50/50"><Plus className="h-3.5 w-3.5" /> Add Task</button></>}</Card>;
}

function ProgressCard({ project }: { project: ProjectPlanning }) {
  const rows = [["Total", project.summary.total, "bg-primary-600"], ["Done", project.summary.done, "bg-emerald-500"], ["Active", project.summary.active, "bg-sky-500"], ["Blocked", project.summary.blocked, "bg-red-500"]] as const;
  return <Card><CardContent className="p-5"><p className="text-[9px] uppercase text-gray-500">Progress</p><p className="mt-1 text-3xl font-bold text-gray-900">{project.progress_percent}<span className="ml-0.5 text-xs font-normal text-gray-500">%</span></p><Progress value={project.progress_percent} className="mt-3 h-1.5" /><div className="mt-5 space-y-3">{rows.map(([label, value, color]) => <div key={label} className="flex items-center text-[11px]"><span className={`mr-2 h-2 w-2 rounded-full ${color}`} /><span>{label}</span><span className="ml-auto font-medium">{value}</span></div>)}</div></CardContent></Card>;
}
function SummaryCard({ label, value }: { label: string; value: number }) { return <Card><CardContent className="p-5"><p className="text-[10px] text-gray-500">{label}</p><p className="mt-2 text-xl font-bold text-gray-900">{value}</p></CardContent></Card>; }
function Detail({ label, value }: { label: string; value: React.ReactNode }) { return <div><p className="text-[9px] uppercase text-gray-400">{label}</p><div className="mt-1 text-xs font-medium text-gray-800">{value || "—"}</div></div>; }
function titleCase(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDate(value?: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).format(date); }
function formatDateTime(value: string) { if (!value) return "—"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date); }

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import { ChevronLeft } from "lucide-react";
import type { Project } from "../../types";
import { WorkflowStepper } from "./WorkflowStepper";
import { SiteInfoStep } from "./SiteInfoStep";
import { ExecutionStep } from "./ExecutionStep";
import { IssuesStep } from "./IssuesStep";
import { AttachmentsStep } from "./AttachmentsStep";
import { FormFooter } from "./FormFooter";
import { WorkflowStep } from "@/types/type-daily-diaries";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  dailyDiaryFormSchema,
  DailyDiaryFormValues
} from "./dailyDiaryFormSchema";
import {
  diaryDetailToFormValues,
  executionItemToFormValues,
  issueItemsToFormValues,
  toDiaryCreatePayload,
  toDiaryExecutionPayload,
  toDiaryExecutionUpdatePayload,
  toDiaryIssuePayload,
  toDiaryUpdatePayload
} from "./diaryPayload";
import {
  useCreateDailyDiary,
  useCreateDiaryExecution,
  useCreateDiaryIssues,
  useGetDailyDiary,
  useGetDiaryAttachments,
  useGetDiaryExecution,
  useGetDiaryIssues,
  useUpdateDailyDiary,
  useUpdateDiaryExecution,
  useUpdateDiaryIssue,
  useUpdateDiaryStatus
} from "../../hooks/useDailyDiaries";
import { useLabourMembers } from "@/app/app/master-data/projects/use-projects";
import { useParams } from "next/navigation";

const steps: WorkflowStep[] = ["site", "execution", "issues", "attachments"];
const labels = {
  site: "Site Info",
  execution: "Execution",
  issues: "Issues",
  attachments: "Attachments"
};

export function NewDailyDiaryForm({
  project,
  projectId,
  date,
  diaryId: initialDiaryId
}: {
  project: Project;
  projectId: string;
  date: string;
  diaryId?: string | null;
}) {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const [activeStep, setActiveStep] = useState<WorkflowStep>("site");
  const [diaryId, setDiaryId] = useState<string | null>(initialDiaryId ?? null);
  // Mirror of diaryId for use inside async callbacks where the state closure
  // would be stale after setDiaryId fires (e.g. goNext awaiting saveSite).
  const diaryIdRef = useRef<string | null>(initialDiaryId ?? null);
  const syncDiaryId = useCallback((id: string | null) => {
    diaryIdRef.current = id;
    setDiaryId(id);
  }, []);
  // The execution record's own id, used as the PUT target once it exists.
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [attachmentsUploading, setAttachmentsUploading] = useState(false);

  const createDiary = useCreateDailyDiary();
  const createExecution = useCreateDiaryExecution();
  const createIssues = useCreateDiaryIssues();
  const updateDiary = useUpdateDailyDiary();
  const updateExecution = useUpdateDiaryExecution();
  const updateIssue = useUpdateDiaryIssue();
  const updateStatus = useUpdateDiaryStatus();

  // Fetch existing diary detail (only when opening an existing diary)
  const { data: existingDiary } = useGetDailyDiary(initialDiaryId ?? undefined);

  // Fetch labour members so execution employees can be enriched with names/roles
  const { data: labourData, isLoading: labourLoading } = useLabourMembers({
    projectId: params.projectId ?? projectId
  });
  const labourMembers = labourData?.members ?? [];

  // Fetch existing execution + issues + attachments for pre-fill
  const { data: existingExecution } = useGetDiaryExecution({
    diary_id: initialDiaryId ?? undefined
  });
  const { data: existingIssues } = useGetDiaryIssues({
    diary_id: initialDiaryId ?? undefined
  });
  const { data: existingAttachments } = useGetDiaryAttachments({
    diary_id: initialDiaryId ?? undefined
  });

  const form = useForm<DailyDiaryFormValues>({
    resolver: zodResolver(dailyDiaryFormSchema),
    defaultValues: {
      weather_condition: "",
      weather_temperature_c: 0,
      weather_humidity_pct: 0,
      weather_wind_kmh: 0,
      weather_impact_on_work: "",
      site_conditions_notes: "",
      execution_description: "",
      execution_employees: [],
      issues: []
    }
  });

  // Each resource resolves independently, so pre-fill each section as soon as
  // its data lands instead of gating everything on the diary detail response.
  const prefilled = useRef({ site: false, execution: false, issues: false });

  useEffect(() => {
    if (prefilled.current.site || !existingDiary) return;
    prefilled.current.site = true;
    form.reset({
      ...form.getValues(),
      ...diaryDetailToFormValues(existingDiary)
    });
  }, [existingDiary, form]);

  useEffect(() => {
    const execItem = existingExecution?.items?.[0];
    // Employee names/roles come from the labour roster, so let it settle first.
    if (prefilled.current.execution || !execItem || labourLoading) return;
    prefilled.current.execution = true;
    setExecutionId(execItem.id);

    const patch = executionItemToFormValues(execItem, labourMembers);
    form.setValue("execution_description", patch.execution_description ?? "");
    form.setValue("execution_employees", patch.execution_employees ?? []);
  }, [existingExecution, labourMembers, labourLoading, form]);

  useEffect(() => {
    if (prefilled.current.issues || !existingIssues?.items) return;
    prefilled.current.issues = true;
    form.setValue(
      "issues",
      issueItemsToFormValues(existingIssues.items).issues ?? []
    );
  }, [existingIssues, form]);

  const stepIndex = steps.indexOf(activeStep);
  const parsedDate = parseISO(date);
  const displayDate = isValid(parsedDate)
    ? format(parsedDate, "yyyy-MM-dd")
    : date;

  const isSubmitting =
    createDiary.isPending ||
    createExecution.isPending ||
    createIssues.isPending ||
    updateDiary.isPending ||
    updateExecution.isPending ||
    updateIssue.isPending ||
    updateStatus.isPending ||
    attachmentsUploading;

  // Track in-flight debounce for onBlur saves so rapid blur events coalesce.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A save can still be in flight when the next blur fires. Without this guard
  // a second create would run before the first response assigns an id, which
  // would duplicate the record.
  const inFlight = useRef<Partial<Record<WorkflowStep, boolean>>>({});

  const saveSite = useCallback(async () => {
    const values = form.getValues();
    try {
      if (diaryId) {
        await updateDiary.mutateAsync({
          id: diaryId,
          payload: toDiaryUpdatePayload(values)
        });
      } else {
        const created = await createDiary.mutateAsync(
          toDiaryCreatePayload(values, {
            projectId,
            diaryDate: displayDate
          })
        );
        if (created?.id) syncDiaryId(created.id);
      }
    } catch {
      // surfaced via mutation meta
    }
  }, [
    diaryId,
    form,
    updateDiary,
    createDiary,
    projectId,
    displayDate,
    syncDiaryId
  ]);

  const saveExecution = useCallback(async () => {
    if (!diaryId) return;
    const values = form.getValues();
    try {
      // PUT targets the execution record's own id, so only update once we know it.
      if (executionId) {
        await updateExecution.mutateAsync({
          id: executionId,
          payload: toDiaryExecutionUpdatePayload(values, diaryId)
        });
      } else {
        const created = await createExecution.mutateAsync(
          toDiaryExecutionPayload(values, diaryId)
        );
        if (created?.id) setExecutionId(created.id);
      }
    } catch {
      // surfaced via mutation meta
    }
  }, [diaryId, executionId, form, updateExecution, createExecution]);

  const saveIssues = useCallback(async () => {
    if (!diaryId) return;
    const issues = form.getValues().issues ?? [];

    // Issues carry their own ids: update the ones already persisted and create
    // the rest, writing the new ids back so later blurs update instead of
    // duplicating.
    const existing = issues.filter((issue) => issue.id);
    const created = issues
      .map((issue, index) => ({ issue, index }))
      .filter(({ issue }) => !issue.id);

    try {
      await Promise.all(
        existing.map((issue) =>
          updateIssue.mutateAsync({
            id: issue.id as string,
            payload: toDiaryIssuePayload(issue, diaryId)
          })
        )
      );

      if (created.length > 0) {
        const results = await createIssues.mutateAsync(
          created.map(({ issue }) => toDiaryIssuePayload(issue, diaryId))
        );

        results.forEach((result, position) => {
          const target = created[position];
          if (result?.id && target) {
            form.setValue(`issues.${target.index}.id`, result.id);
          }
        });
      }
    } catch {
      // surfaced via mutation meta
    }
  }, [diaryId, form, updateIssue, createIssues]);

  const handleBlurSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      const step = activeStep;
      const save =
        step === "site"
          ? saveSite
          : step === "execution"
            ? saveExecution
            : step === "issues"
              ? saveIssues
              : null;
      if (!save || inFlight.current[step]) return;

      inFlight.current[step] = true;
      try {
        await save();
      } finally {
        inFlight.current[step] = false;
      }
    }, 400);
  }, [activeStep, saveSite, saveExecution, saveIssues]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  function goBack() {
    if (stepIndex === 0) router.back();
    else setActiveStep(steps[stepIndex - 1]);
  }

  // Free navigation: Next/Back no longer require validation or saving.
  // Saving happens automatically on field blur. On the final step, "Complete"
  // marks the diary as submitted via PUT /v1/construction-diary/diaries/{id}/status.
  async function goNext() {
    if (stepIndex === steps.length - 1) {
      try {
        // Ensure the diary record exists before updating its status.
        if (!diaryId) {
          await saveSite();
        }
        const id = diaryIdRef.current;
        if (!id) return;
        await updateStatus.mutateAsync({
          id,
          status: "DIARY_STATUS_SUBMITTED"
        });
        router.push(`/app/daily-diaries/daily-activities/${projectId}`);
      } catch {
        // surfaced via mutation meta
      }
      return;
    }
    setActiveStep(steps[stepIndex + 1]);
  }

  return (
    <div className="pb-8">
      <header className="mb-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex hover:text-primary-700 gap-2.5"
        >
          <ChevronLeft size={20} className="mt-1" />
          <div>
            <strong className="block text-xl text-start font-semibold">
              {diaryId ? "Edit Daily Diary" : "New Daily Diary"}
            </strong>
            <span className="block text-sm text-muted-foreground">
              {displayDate} · Guided Workflow
            </span>
          </div>
        </button>
      </header>

      <main className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-5 sm:p-7 space-y-5">
        <div>
          <h1 className="text-xl font-bold">
            {diaryId ? "Edit Daily Diary" : "New Daily Diary"}
          </h1>
          <p className="text-sm text-gray-500">
            {diaryId
              ? "Update the daily diary entry"
              : "Create a new daily diary entry"}
          </p>
        </div>

        <WorkflowStepper activeStep={activeStep} />

        {activeStep === "site" && (
          <SiteInfoStep
            form={form}
            projectId={projectId}
            onBlurSave={handleBlurSave}
          />
        )}
        {activeStep === "execution" && (
          <ExecutionStep form={form} onBlurSave={handleBlurSave} />
        )}
        {activeStep === "issues" && (
          <IssuesStep form={form} onBlurSave={handleBlurSave} />
        )}
        {activeStep === "attachments" && (
          <AttachmentsStep
            diaryId={diaryId}
            existing={existingAttachments?.items ?? []}
            onUploadingChange={setAttachmentsUploading}
          />
        )}

        <FormFooter
          nextLabel={labels[steps[Math.min(stepIndex + 1, steps.length - 1)]]}
          onBack={goBack}
          onNext={goNext}
          isFirst={stepIndex === 0}
          isLast={stepIndex === steps.length - 1}
          pending={isSubmitting}
        />
      </main>
    </div>
  );
}

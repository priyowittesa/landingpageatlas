"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  INITIAL_SIGNAL_SCHEDULE,
  scheduleDraft,
  scheduleSummary,
  type SignalSchedule
} from "./signal-schedule-data";
import { SignalScheduleForm } from "./signal-schedule-form";
import { errorMessage } from "./onboarding-api";
import { scheduleFieldErrors, type OnboardingScanSchedule } from "./onboarding-schedule-api";

export function SignalSchedulePanel({
  schedule, loading, error, actionError, busy, canManage,
  onRetry, onResetError, onUpdate, onStop
}: {
  schedule: OnboardingScanSchedule | null | undefined;
  loading: boolean;
  error: unknown;
  actionError: unknown;
  busy: boolean;
  canManage: boolean;
  onRetry: () => void;
  onResetError: () => void;
  onUpdate: (draft: SignalSchedule) => Promise<boolean>;
  onStop: () => Promise<boolean>;
}) {
  const draft = schedule ? scheduleDraft(schedule) : INITIAL_SIGNAL_SCHEDULE;
  const [candidate, setCandidate] = useState<SignalSchedule>(draft);
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<"" | "update" | "stop">("");
  const trigger = useRef<HTMLButtonElement>(null);
  const confirming = confirmation !== "";
  const stopping = confirmation === "stop";
  const statusLabel = schedule?.status === "completed" ? "Finished"
    : schedule?.status === "stopped" ? "Stopped" : "Active";
  const statusStyle = schedule?.status === "active"
    ? "bg-emerald-50 text-emerald-800"
    : "bg-white/20 text-white";

  async function confirm() {
    if (busy || !canManage) return;
    const success = stopping ? await onStop() : await onUpdate(candidate);
    setConfirmation("");
    if (success) setOpen(false);
  }

  return (
    <div className="mt-5 flex flex-col items-stretch gap-3 rounded-lg border border-white/10 bg-white/15 px-4 py-2.5 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <Image
          src="/images/operations-intelligence/schedule/calendar-white.svg"
          alt=""
          width={16}
          height={16}
          className="shrink-0"
        />
        {schedule && (
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
        )}
        <div
          role="status"
          aria-label="Scan schedule"
          className="flex flex-wrap items-center gap-x-2 gap-y-1"
        >
          {!schedule ? (
            <span>{loading ? "Loading schedule..." : error ? "Unable to load schedule." : "No schedule configured."}</span>
          ) : (
            scheduleSummary(draft, schedule.run_count).map(([label, value], index) => (
              <span key={label || "end"} className="inline-flex items-center gap-2">
                {index > 0 && (
                  <span aria-hidden="true" className="text-white/60">|</span>
                )}
                <span>
                  {label && `${label}: `}
                  <strong className="font-semibold">{value}</strong>
                </span>
              </span>
            ))
          )}
        </div>
        {schedule && (
          <p className="basis-full text-xs leading-5 text-white/85">
            Timezone: {schedule.timezone}
            {schedule.status === "active" && schedule.next_run_at && (
              <>{" \u00b7 Next run: "}{new Date(schedule.next_run_at).toLocaleString(undefined, { timeZone: schedule.timezone })}</>
            )}
          </p>
        )}
        {!!error && (
          <div role="alert" className="flex basis-full flex-wrap items-center gap-2 text-xs">
            <span>{errorMessage(error, "Unable to load schedule.")}</span>
            <button type="button" onClick={onRetry} className="font-semibold underline">
              Retry schedule
            </button>
          </div>
        )}
      </div>
      <Popover open={open} onOpenChange={(nextOpen) => {
        if (busy) return;
        setOpen(nextOpen);
        if (nextOpen) onResetError();
      }}>
        <PopoverTrigger asChild>
          <Button
            ref={trigger}
            variant="outline"
            disabled={loading || !!error || busy}
            className="h-7 shrink-0 self-end rounded-lg bg-white px-2 text-xs text-neutral-950 hover:bg-neutral-100 sm:self-auto"
          >
            View Schedule
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          aria-label="Scan schedule settings"
          className="max-h-[min(calc(100dvh_-_2rem),var(--radix-popover-content-available-height))] w-[291px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border-neutral-200 bg-white p-4 text-neutral-950"
          onInteractOutside={(event) => {
            if (confirming || busy) event.preventDefault();
          }}
        >
          {open && (
            <>
              {!!actionError && (
                <p role="alert" className="mb-3 whitespace-pre-line text-xs text-red-600">
                  {errorMessage(actionError, "Unable to change the schedule. Please try again.")}
                </p>
              )}
              <SignalScheduleForm
                schedule={draft}
                canStop={schedule?.status === "active"}
                canManage={canManage && !error}
                busy={busy}
                fieldErrors={scheduleFieldErrors(actionError)}
                onEdit={onResetError}
                onUpdate={(nextDraft) => {
                  setCandidate(nextDraft);
                  setConfirmation("update");
                }}
                onStop={() => setConfirmation("stop")}
              />
            </>
          )}
          <Dialog
            open={confirming}
            onOpenChange={(nextOpen) => {
              if (!nextOpen && !busy) setConfirmation("");
            }}
          >
            <DialogContent
              showCloseButton={false}
              className="w-[291px] gap-4 rounded-lg border-0 bg-white p-4 text-center text-neutral-950 sm:max-w-[291px]"
              onCloseAutoFocus={(event) => {
                if (!open) {
                  event.preventDefault();
                  trigger.current?.focus();
                }
              }}
              onEscapeKeyDown={(event) => {
                if (busy) event.preventDefault();
              }}
              onInteractOutside={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              <div className="mx-auto rounded-full bg-info/10 p-1.5">
                <Image
                  src="/images/operations-intelligence/schedule/circle-help.svg"
                  alt=""
                  width={24}
                  height={24}
                />
              </div>
              <div className="space-y-1.5">
                <DialogTitle className="text-base font-medium leading-6">
                  Are you sure you want to {stopping ? "stop" : "update"} this
                  schedule?
                </DialogTitle>
                <DialogDescription className="text-xs leading-4 text-neutral-500">
                  {stopping
                    ? "Scheduled scans will stop. Update the schedule to resume."
                    : "This updates the saved scan schedule, restarts it, and resets the run count."}
                </DialogDescription>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  className="h-7 rounded-lg bg-neutral-100 px-2 text-xs text-neutral-900 hover:bg-neutral-200"
                  onClick={() => setConfirmation("")}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  aria-busy={busy}
                  className="h-7 rounded-lg bg-info px-2 text-xs text-white hover:bg-info/90"
                  onClick={() => void confirm()}
                >
                  {busy ? stopping ? "Stopping..." : "Updating..." : stopping ? "Stop Now" : "Update"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </PopoverContent>
      </Popover>
    </div>
  );
}

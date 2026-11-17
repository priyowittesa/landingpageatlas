"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import type { DailyDiariesItem } from "@/types/type-daily-diaries";
import { format, isSameDay } from "date-fns";
import { AlertCircle, Copy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  mapSectionsToApi,
  useDuplicateDiary
} from "../../hooks/useDailyDiaries";
import { CalendarFilter } from "./CalendarFilter";

type DuplicateSection = "diary" | "execution" | "issues" | "attachments";

const sections: { id: DuplicateSection; title: string; description: string }[] =
  [
    {
      id: "diary",
      title: "Site Information",
      description: "Duplicate weather information and site conditions"
    },
    {
      id: "execution",
      title: "Execution",
      description: "Duplicate Labour, activity, equipment and work hours"
    },
    {
      id: "issues",
      title: "Issues",
      description:
        "Duplicate all logged issues, delay records, and related details."
    },
    {
      id: "attachments",
      title: "Attachment",
      description: "Duplicate Progress, Safety Photos, Documents and Reports"
    }
  ];

export function DuplicateDataDialog({
  open,
  onOpenChange,
  targetDate,
  records,
  hasExistingDiary,
  projectId
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDate: Date;
  records: DailyDiariesItem[];
  hasExistingDiary: boolean;
  projectId?: string;
}) {
  const [step, setStep] = useState<"date" | "sections" | "replace">("date");
  const [sourceDate, setSourceDate] = useState(targetDate);
  const [month, setMonth] = useState(targetDate);
  const [selectedSections, setSelectedSections] = useState<DuplicateSection[]>(
    sections.map(({ id }) => id)
  );

  const { mutateAsync: duplicateDiary, isPending: isDuplicating } =
    useDuplicateDiary();

  useEffect(() => {
    if (!open) return;
    setStep("date");
    setSourceDate(targetDate);
    setMonth(targetDate);
    setSelectedSections(sections.map(({ id }) => id));
  }, [open, targetDate]);

  function toggleSection(section: DuplicateSection) {
    setSelectedSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    );
  }

  const sourceDiaryId = useMemo(() => {
    const sourceKey = format(sourceDate, "yyyy-MM-dd");
    return records.find((r) => r.diary_date === sourceKey)?.id;
  }, [records, sourceDate]);

  const sourceDateIsTarget = isSameDay(sourceDate, targetDate);

  async function submitDuplicate() {
    if (!sourceDiaryId || !projectId) return;
    await duplicateDiary({
      project_id: projectId,
      sections: mapSectionsToApi(selectedSections),
      source_date: format(sourceDate, "yyyy-MM-dd"),
      target_date: format(targetDate, "yyyy-MM-dd")
    });
    onOpenChange(false);
  }

  function handleComplete() {
    if (hasExistingDiary) {
      setStep("replace");
      return;
    }
    void submitDuplicate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[544px]"
      >
        {step === "replace" ? (
          <div className="px-8 py-5 text-center">
            <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-red-50 text-red-500 ring-4 ring-red-50">
              <AlertCircle className="size-4" />
            </span>
            <DialogTitle className="mt-5 text-lg font-bold text-black">
              Existing Daily Diary Found
            </DialogTitle>
            <DialogDescription className="mt-4 text-xs font-normal leading-4 text-black">
              A daily diary already exists for this date. Continuing will
              replace the selected sections with the duplicated data.
            </DialogDescription>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={isDuplicating}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isDuplicating}
                onClick={() => void submitDuplicate()}
              >
                {isDuplicating ? "Replacing..." : "Replace"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader className="flex-row items-start gap-3 border-b border-gray-200 px-5 py-4 text-left">
              <span className="mt-1 flex size-4 shrink-0 items-center justify-center text-primary">
                <Copy className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-sm font-bold text-black">
                  Duplicate Data
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs font-semibold leading-4 text-black">
                  {step === "date"
                    ? "Select the date you want to duplicate data from."
                    : `Select data you want to duplicate from ${format(sourceDate, "d MMMM yyyy")}. Only the selected information will be copied to the current date.`}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="p-4">
              {step === "date" ? (
                <div className="flex min-h-[412px] items-center justify-center rounded-lg border border-gray-200 bg-white p-2">
                  <CalendarFilter
                    month={month}
                    selectedDate={sourceDate}
                    records={records}
                    onMonthChange={setMonth}
                    onDateChange={setSourceDate}
                    className="min-w-0 border-0 p-0 shadow-none lg:static"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  {sections.map((section) => (
                    <label
                      key={section.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-4"
                    >
                      <Checkbox
                        className="border-gray-400 shadow-sm data-[state=unchecked]:border-gray-400"
                        checked={selectedSections.includes(section.id)}
                        onCheckedChange={() => toggleSection(section.id)}
                      />
                      <span>
                        <span className="block text-xs font-bold text-black">
                          {section.title}
                        </span>
                        <span className="block text-xs font-semibold text-black">
                          {section.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              {step === "date" ? (
                <Button
                  size="sm"
                  disabled={sourceDateIsTarget || !sourceDiaryId}
                  onClick={() => setStep("sections")}
                >
                  Next
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={
                    !selectedSections.length || !sourceDiaryId || isDuplicating
                  }
                  onClick={handleComplete}
                >
                  {isDuplicating ? "Duplicating..." : "Complete"}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

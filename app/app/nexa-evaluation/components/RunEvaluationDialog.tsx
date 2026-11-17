"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DEFAULT_OPTIONS, TENANTS, isValidPeriod, mockEstimate,
  type ChatPeriod, type EvaluationOptions
} from "../mock-data";

const PERIOD_HELP: Record<ChatPeriod, string> = {
  "since-last-check": "From the day after your last check ended until you start this check again.",
  "last-30-days": "The 30 days before today, counting back from today.",
  custom: "Choose the exact dates you need."
};

export function RunEvaluationDialog({
  open,
  onOpenChange,
  onStart
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (options: EvaluationOptions) => void;
}) {
  const [options, setOptions] = useState<EvaluationOptions>({ ...DEFAULT_OPTIONS });
  const [advanced, setAdvanced] = useState(false);
  const valid = isValidPeriod(options);
  const estimate = mockEstimate(options);
  const setOption = <K extends keyof EvaluationOptions>(key: K, value: EvaluationOptions[K]) =>
    setOptions((current) => ({ ...current, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto p-0 sm:max-w-[500px]">
        <DialogHeader className="border-b border-gray-100 px-6 py-5 text-left">
          <DialogTitle className="text-base leading-5 text-gray-800">Run NEXA Evaluation</DialogTitle>
          <DialogDescription className="sr-only">
            Configure a simulated evaluation. This UI preview does not run a real check or incur any cost.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-6 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onStart(options);
          }}
        >
          <div>
            <p id="chat-period-label" className="mb-1 text-sm font-medium text-gray-950">Chat period</p>
            <Tabs value={options.period} onValueChange={(value) => setOption("period", value as ChatPeriod)}>
              <TabsList aria-labelledby="chat-period-label" className="grid h-auto grid-cols-3 gap-2.5 bg-transparent p-0">
                {([
                  ["since-last-check", "Since last check"],
                  ["last-30-days", "Last 30 days"],
                  ["custom", "Custom"]
                ] as const).map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-9 rounded-lg border border-gray-200 px-1 text-xs font-medium text-gray-950 shadow-xs data-[state=active]:border-primary-500 data-[state=active]:text-gray-950 sm:text-sm"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={options.period} className="mt-1">
                <p className="px-1 text-xs leading-4 text-primary-500">{PERIOD_HELP[options.period]}</p>
                {options.period === "custom" && (
                  <div className="mt-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div role="group" aria-labelledby="evaluation-start-label">
                        <p id="evaluation-start-label" className="mb-1 text-sm font-medium">Start Date</p>
                        <DatePicker
                          value={options.startDate}
                          onChange={(value) => setOption("startDate", value)}
                          max={options.endDate || undefined}
                          placeholder="Pick a date"
                          className="h-9 flex-row-reverse justify-end gap-2 text-sm"
                        />
                      </div>
                      <div role="group" aria-labelledby="evaluation-end-label">
                        <p id="evaluation-end-label" className="mb-1 text-sm font-medium">End Date</p>
                        <DatePicker
                          value={options.endDate}
                          onChange={(value) => setOption("endDate", value)}
                          min={options.startDate || undefined}
                          placeholder="Pick a date"
                          className="h-9 flex-row-reverse justify-end gap-2 text-sm"
                        />
                      </div>
                    </div>
                    {!valid && (
                      <p className="mt-2 text-xs text-gray-500">Select a start date and an end date to continue.</p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <div>
            <label htmlFor="evaluation-tenant" className="mb-1 block text-sm font-medium text-gray-950">Tenant</label>
            <Select value={options.tenant} onValueChange={(value) => setOption("tenant", value)}>
              <SelectTrigger id="evaluation-tenant" className="h-9 px-3 text-gray-950"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tenants</SelectItem>
                {TENANTS.map((tenant) => <SelectItem key={tenant} value={tenant}>{tenant}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <button
              type="button"
              aria-expanded={advanced}
              aria-controls="evaluation-advanced"
              onClick={() => setAdvanced(!advanced)}
              className="flex cursor-pointer items-center text-xs font-medium text-info focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Advanced Settings
              {advanced ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            {advanced && (
              <div id="evaluation-advanced" className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="evaluation-threshold" className="mb-1 block text-sm font-medium">Flag answers below</label>
                  <Select value={options.threshold} onValueChange={(value) => setOption("threshold", value)}>
                    <SelectTrigger id="evaluation-threshold" className="h-9 px-3 text-gray-950"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["25", "50", "75", "90"].map((value) => (
                        <SelectItem key={value} value={value}>{value}% supported</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="evaluation-model" className="mb-1 block text-sm font-medium">Checking model</label>
                  <Select value={options.model} onValueChange={(value) => setOption("model", value)}>
                    <SelectTrigger id="evaluation-model" className="h-9 px-3 text-gray-950"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-flash-lite">Gemini 3.1 Flash lite</SelectItem>
                      <SelectItem value="gemini-flash">Gemini 3.1 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2" aria-label="Sample evaluation estimates">
            {[
              ["Answers to check", valid ? `~ ${estimate.answers}` : "~ 0", valid ? `from ${estimate.messages} chat messages` : "-"],
              ["Cost", valid ? `~ ${estimate.cost}` : "~ $0.00", "estimate"],
              ["Time", valid ? "~ 1 min" : "~ 0", "estimate"]
            ].map(([label, value, hint]) => (
              <div key={label} className="grid grid-cols-[1fr_1.1fr] items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <span className="text-xs font-semibold text-gray-950">{label}</span>
                <div className="flex flex-wrap items-center gap-2 text-gray-950">
                  <span className="text-lg font-semibold">{value}</span>
                  <span className="text-xs">{hint}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">UI preview only. Estimates are sample values; no costs are incurred.</p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-10 rounded-lg sm:w-[100px]">
              Cancel
            </Button>
            <Button type="submit" disabled={!valid} className="h-10 rounded-lg bg-primary-500 hover:bg-primary-600 sm:w-[100px]">
              Start
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

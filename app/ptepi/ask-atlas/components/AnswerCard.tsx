"use client";

import { Tr } from "../../components/Tr";
import { Check, FileText, Plus, RefreshCw, Scale, ShieldAlert, Table2 } from "lucide-react";
import { WeeklyReportDraftView } from "./WeeklyReportDraftView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "../../format";
import Link from "next/link";
import { selectOpenMatch, useActionsStore, type NewEpiAction } from "../../store/actions-store";
import type { Answer, AnswerSource } from "../types";

const SOURCE_ICON: Record<AnswerSource["kind"], typeof Table2> = {
  table: Table2,
  document: FileText,
  rule: Scale
};

const SOURCE_KIND_LABEL: Record<AnswerSource["kind"], string> = {
  table: "Table",
  document: "Document",
  rule: "Rule"
};

type AnswerCardProps = {
  answer: Answer;
  /** Suggested next questions, shown as chips under the answer */
  followUps?: string[];
  onFollowUp?: (question: string) => void;
};

export function AnswerCard({ answer, followUps = [], onFollowUp }: AnswerCardProps) {
  return (
    <div className="space-y-3">
      {answer.refused ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-amber-300 bg-amber-50 p-3" role="status">
          <ShieldAlert size={16} aria-hidden className="mt-0.5 shrink-0 text-amber-800" />
          <div>
            <p className="text-sm font-semibold text-amber-950"><Tr>Not answered: evidence missing</Tr></p>
            <p className="mt-0.5 text-sm leading-6 text-amber-950"><Tr>{answer.conclusion}</Tr></p>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-gray-800"><Tr>{answer.conclusion}</Tr></p>
      )}

      {answer.figures.length > 0 && (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {answer.figures.map((figure) => (
            <div key={figure.label} className="rounded-lg border border-gray-200 bg-white p-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-gray-600"><Tr>{figure.label}</Tr></dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-gray-950">{figure.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {answer.points.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="mb-2 text-xs font-semibold text-gray-900"><Tr>Why</Tr></p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-gray-800">
            {answer.points.map((point, index) => (
              <li key={point}>
                <Tr>{point}</Tr>
                {answer.citations?.[index]?.map((source) => (
                  <sup key={source} className="ml-0.5 font-semibold text-primary-700" title={answer.sources[source - 1]?.label}>
                    [{source}]
                  </sup>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}

      {answer.report && <WeeklyReportDraftView report={answer.report} />}

      {answer.actions.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <p className="text-xs font-semibold text-gray-900"><Tr>Recommendations</Tr></p>
            <span className="rounded border border-primary-200 bg-primary-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-800">
              <Tr>AI recommends, people decide</Tr>
            </span>
          </div>
          <ol className="divide-y divide-gray-100">
            {answer.actions.map((action, index) => (
              <ActionRow key={action.source} action={action} index={index + 1} />
            ))}
          </ol>
        </div>
      )}

      <ul className="flex flex-wrap gap-1.5" aria-label={`Sources, data as at ${formatDate(answer.refreshedAt)}`}>
        {answer.sources.map((source, index) => {
          const Icon = SOURCE_ICON[source.kind];
          return (
            <li key={`${source.kind}-${source.label}`}>
              <Badge variant="outline" className="gap-1 bg-white font-medium">
                <span className="text-primary-700">[{index + 1}]</span>
                <Icon size={12} aria-hidden />
                <span className="sr-only">{SOURCE_KIND_LABEL[source.kind]}: </span>
                {source.label}
              </Badge>
            </li>
          );
        })}
      </ul>
      <p className="inline-flex items-center gap-1.5 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700">
        <RefreshCw size={12} aria-hidden />
        <Tr>Data refreshed</Tr>: {formatDate(answer.refreshedAt)} (<Tr>demo snapshot</Tr>)
      </p>

      {followUps.length > 0 && onFollowUp && (
        <div className="flex flex-wrap gap-2">
          {followUps.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onFollowUp(question)}
              className="rounded-full border border-primary-300 bg-white px-3 py-1 text-xs font-medium text-primary-800 transition-colors hover:bg-primary-50"
            >
              <Tr>{question}</Tr>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionRow({ action, index }: { action: NewEpiAction; index: number }) {
  const addAction = useActionsStore((state) => state.addAction);
  const match = useActionsStore(selectOpenMatch(action));
  const created = match !== undefined;

  return (
    <li className="flex flex-wrap items-center gap-3 p-3">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary-50 text-[11px] font-semibold text-primary-800">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium"><Tr>{action.title}</Tr></p>
        <p className="text-xs text-muted-foreground">
          <Tr>Owner</Tr> <Tr>{action.ownerRole}</Tr>, <Tr>due</Tr> {formatDate(action.dueDate)}, <Tr>autonomy</Tr> {action.autonomy}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        disabled={created}
        className="bg-primary-700 text-white hover:bg-primary-800"
        onClick={() => addAction(action)}
      >
        {created ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
        <Tr>{created ? "Tracked" : "Create action"}</Tr>
      </Button>
      {match && (
        <p className="w-full text-xs">
          <Tr>Already tracked as</Tr> {match.id}.{" "}
          <Link href="/ptepi/actions" className="font-medium text-primary-700 hover:underline">
            <Tr>View in the action tracker</Tr>
          </Link>
        </p>
      )}
    </li>
  );
}

"use client";

import { Check, FileText, Plus, Scale, Table2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { selectHasOpenAction, useActionsStore, type NewEpiAction } from "../../store/actions-store";
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
};

export function AnswerCard({ answer }: AnswerCardProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold">{answer.conclusion}</p>

      {answer.figures.length > 0 && (
        <dl className="flex flex-wrap gap-3">
          {answer.figures.map((figure) => (
            <div
              key={figure.label}
              className="rounded-lg border border-border bg-primary-50 px-3 py-2"
            >
              <dt className="text-xs text-muted-foreground">{figure.label}</dt>
              <dd className="text-sm font-bold text-primary-700">{figure.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <ul className="list-disc space-y-1.5 pl-5 text-sm">
        {answer.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Sources, data as at {answer.refreshedAt}
        </p>
        <ul className="flex flex-wrap gap-2">
          {answer.sources.map((source) => {
            const Icon = SOURCE_ICON[source.kind];
            return (
              <li key={`${source.kind}-${source.label}`}>
                <Badge variant="outline" className="gap-1.5 font-medium">
                  <Icon size={16} aria-hidden />
                  <span className="sr-only">{SOURCE_KIND_LABEL[source.kind]}: </span>
                  {source.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      </div>

      {answer.actions.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Recommended actions: AI recommends, people decide
          </p>
          <ul className="space-y-2">
            {answer.actions.map((action) => (
              <ActionRow key={action.source} action={action} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActionRow({ action }: { action: NewEpiAction }) {
  const addAction = useActionsStore((state) => state.addAction);
  const created = useActionsStore(selectHasOpenAction(action.source));

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{action.title}</p>
        <p className="text-xs text-muted-foreground">
          Owner {action.ownerRole}, due {action.dueDate}, autonomy {action.autonomy}
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
        {created ? "Action created" : "Create action"}
      </Button>
    </li>
  );
}

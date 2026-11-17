"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { EvaluationAnswer, ReviewDecision } from "../mock-data";

export function AnswerReviews({
  answers,
  reviews,
  onReview
}: {
  answers: EvaluationAnswer[];
  reviews: Record<string, ReviewDecision>;
  onReview: (id: string, decision: ReviewDecision) => void;
}) {
  const [chat, setChat] = useState<EvaluationAnswer | null>(null);

  return (
    <>
      <section className="@container overflow-hidden rounded-xl border border-gray-200" aria-labelledby="answer-reviews-heading">
        <div className="border-b border-gray-200 px-4 py-3">
          <h3 id="answer-reviews-heading" className="text-base font-semibold leading-5 text-gray-950">
            Check These Answers
          </h3>
          <p className="mt-0.5 text-sm leading-5 text-gray-500">
            Check whether NEXA&apos;s answers match the data it used, then confirm which problems are real.
          </p>
        </div>
        {answers.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">All answers reviewed</p>
            <p className="mt-1 text-xs text-gray-500">There are no answers waiting for review in this check.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {answers.map((answer) => (
              <li key={answer.id} className="flex flex-col gap-3 px-4 py-3 @min-[680px]:flex-row @min-[680px]:items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-5 text-gray-950">{answer.question}</p>
                  <p className="text-xs leading-4 text-gray-500">{answer.summary}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs leading-4">
                    <span className="text-primary-500">{answer.tenant} &middot; {answer.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => setChat(answer)}
                      aria-label={`Open chat: ${answer.question}`}
                      className="inline-flex cursor-pointer items-center text-xs font-semibold leading-4 text-info hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      Open Chat
                      <Image src="/images/nexa-evaluation/chevron-right.svg" width={14} height={14} alt="" />
                    </button>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2" role="group" aria-label={`Review: ${answer.question}`}>
                  {(["right", "wrong"] as const).map((decision) => (
                    <Button
                      key={decision}
                      variant="outline"
                      size="sm"
                      aria-pressed={reviews[answer.id] === decision}
                      onClick={() => onReview(answer.id, decision)}
                      className={cn(
                        "h-[28px] rounded-lg border-gray-200 px-2 text-xs font-normal shadow-xs",
                        reviews[answer.id] === decision && "border-primary-300 bg-primary-50 text-primary-700"
                      )}
                    >
                      NEXA is {decision === "right" ? "Right" : "Wrong"}
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Dialog open={chat !== null} onOpenChange={(open) => { if (!open) setChat(null); }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Chat Preview</DialogTitle>
            <DialogDescription>
              Sample conversation only. No live chat history is connected.
            </DialogDescription>
          </DialogHeader>
          {chat && (
            <div className="space-y-4 text-sm">
              <p className="text-xs text-primary-500">{chat.tenant} &middot; {chat.timestamp}</p>
              <div className="ml-8 rounded-xl bg-primary-50 p-4">
                <p className="mb-1 text-xs font-semibold text-primary-700">User</p>
                <p>{chat.question}</p>
              </div>
              <div className="mr-8 rounded-xl border p-4">
                <p className="mb-1 text-xs font-semibold text-primary-700">NEXA</p>
                <p>{chat.response}</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="mb-1 text-xs font-semibold text-gray-600">Tool result</p>
                <p>{chat.toolResult}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

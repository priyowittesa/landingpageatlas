"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { FileText, RotateCcw, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { computePriority, effectivePriority } from "../lib/scoring";
import { useTriageStore } from "../lib/use-triage-store";
import { ASK_SUGGESTIONS, askAnswer, type AskAnswer, type TodaySummary } from "./insight-data";

type Message = { id: number; fromUser: true; text: string } | { id: number; fromUser: false; answer: AskAnswer };

/** Renders `**bold**` spans from canned answers. */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
        part.startsWith("**") ? <b key={index} className="font-semibold">{part.slice(2, -2)}</b> : <Fragment key={index}>{part}</Fragment>
      )}
    </>
  );
}

function AnswerBubble({ answer }: { answer: AskAnswer }) {
  const List = answer.ordered ? "ol" : "ul";
  return (
    <div className="space-y-2 text-sm leading-6 text-gray-800">
      <p><RichText text={answer.intro} /></p>
      {answer.items?.length ? (
        <List className={cn("space-y-1 pl-5", answer.ordered ? "list-decimal" : "list-disc")}>
          {answer.items.map((item) => <li key={item}><RichText text={item} /></li>)}
        </List>
      ) : null}
      {answer.outro && <p><RichText text={answer.outro} /></p>}
      {answer.sources?.length ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {answer.sources.map((source) => (
            <span key={source} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] text-gray-600">
              <FileText className="h-3 w-3" />
              {source}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AiAvatar({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-linear-to-br from-violet-500 to-primary-700 text-white",
        size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : "h-7 w-7"
      )}
    >
      <Sparkles className={size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5"} />
    </span>
  );
}

export function AskAiDialog({ open, onOpenChange, onAsk }: { open: boolean; onOpenChange: (open: boolean) => void; onAsk: (question: string) => void }) {
  const reports = useTriageStore((state) => state.reports);
  const config = useTriageStore((state) => state.config);
  const assets = useTriageStore((state) => state.assets);
  const insights = useTriageStore((state) => state.insights);
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | null>(null);

  const today = useMemo<TodaySummary>(() => {
    const todays = reports.filter((report) => !report.hidden && report.state !== "cancelled" && report.id.includes("-1102-"));
    const count = (priority: "P1" | "P2" | "P3") => todays.filter((report) => effectivePriority(report, config, assets) === priority).length;
    return {
      total: todays.length,
      byPriority: { P1: count("P1"), P2: count("P2"), P3: count("P3") },
      safetyAssets: todays.filter((report) => computePriority(report, config, assets).safety).map((report) => assets[report.assetId].name),
      p1: todays
        .filter((report) => effectivePriority(report, config, assets) === "P1")
        .map((report) => ({ asset: assets[report.assetId].name, description: report.description })),
      sources: todays.slice(0, 4).map((report) => report.id),
    };
  }, [reports, config, assets]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [messages, busy]);
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const send = (raw: string) => {
    const question = raw.trim();
    if (!question || busy) return;
    onAsk(question);
    setMessages((current) => [...current, { id: Date.now(), fromUser: true, text: question }]);
    setBusy(true);
    timer.current = window.setTimeout(() => {
      const openInsights = insights.filter((insight) => insight.status === "open");
      setMessages((current) => [...current, { id: Date.now(), fromUser: false, answer: askAnswer(question, openInsights, today) }]);
      setBusy(false);
    }, 900);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
    setDraft("");
  };

  const suggestions = (
    <div className="flex flex-wrap gap-2">
      {ASK_SUGGESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => send(question)}
          className="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-left text-[13px] text-primary-700 transition-colors hover:bg-primary-50"
        >
          {question}
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-0 right-0 left-auto flex h-full max-h-screen w-full max-w-lg translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-lg data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100">
        <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 pr-12">
          <AiAvatar size="md" />
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base">Ask Atlas AI</DialogTitle>
            <DialogDescription className="text-xs">Answers from Fabrix maintenance data · read-only</DialogDescription>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setMessages([])} disabled={busy}>
              <RotateCcw className="h-3.5 w-3.5" />
              New chat
            </Button>
          )}
        </div>

        <div ref={bodyRef} className="flex-1 space-y-4 overflow-y-auto bg-gray-50/60 px-6 py-5">
          {messages.length === 0 ? (
            <>
              <div className="flex flex-col items-center px-4 py-6 text-center">
                <AiAvatar size="lg" />
                <h4 className="mt-3 text-base font-semibold text-gray-900">What would you like to know?</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Atlas AI looks across 12 months of breakdown WOs, today’s reports, and spare-part stock. Each answer lists its sources.
                </p>
              </div>
              {suggestions}
            </>
          ) : (
            <>
              {messages.map((message) =>
                message.fromUser ? (
                  <div key={message.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 px-3.5 py-2 text-sm text-white">
                    {message.text}
                  </div>
                ) : (
                  <div key={message.id} className="flex gap-2.5">
                    <AiAvatar />
                    <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-3.5 py-2.5">
                      <AnswerBubble answer={message.answer} />
                    </div>
                  </div>
                )
              )}
              {busy ? (
                <div className="flex gap-2.5">
                  <AiAvatar />
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-3.5 py-3" aria-label="Atlas AI is typing">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              ) : (
                suggestions
              )}
            </>
          )}
        </div>

        <form onSubmit={submit} className="flex gap-2 border-t border-gray-200 px-6 py-4">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about an asset, failure, or spare part"
            autoComplete="off"
            aria-label="Question"
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={busy || !draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowUp,
  FileText,
  FlaskConical,
  MessageSquare,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Table2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BAHASA_CHIP, QUESTIONS, matchQuestion } from "../questions";
import type { NexaContextKpi } from "../../types";
import type { Answer, AnswerSource, ChatMessage, QuestionId } from "../types";
import { AnswerCard } from "./AnswerCard";

const NAME = "Nexa";

/** Prompt categories; each asks its first question. Counts are the scripted questions in it. */
const CATEGORIES: { label: string; ids: QuestionId[] }[] = [
  { label: "Progress and schedule", ids: ["behind", "next"] },
  { label: "Billing readiness", ids: ["billing"] },
  { label: "Evidence and BAST", ids: ["bast"] },
  { label: "Portfolio health", ids: ["attention"] },
  { label: "Cost and RAP", ids: ["rap"] },
  { label: "Service contracts", ids: ["inspections"] }
];

const PROMPTS = [...QUESTIONS.map((question) => question.label), BAHASA_CHIP.label];

const FALLBACK_TEXT = "I cannot answer that yet. In this prototype I can answer these questions:";

const SOURCE_ICON: Record<AnswerSource["kind"], typeof Table2> = {
  table: Table2,
  document: FileText,
  rule: Scale
};

type Group = "Today" | "Yesterday" | "This week";

type Conversation = {
  id: string;
  title: string;
  group: Group;
  saved: boolean;
  messages: ChatMessage[];
};

type AskAtlasChatProps = {
  answers: Record<QuestionId, Answer>;
  context: NexaContextKpi[];
  asAtLabel: string;
};

const labelOf = (id: QuestionId) => QUESTIONS.find((question) => question.id === id)?.label ?? id;

/** A finished exchange, so the history shows real scripted answers from earlier days. */
function pastConversation(id: string, group: Group, questionId: QuestionId, saved: boolean): Conversation {
  const question = labelOf(questionId);
  return {
    id,
    title: question,
    group,
    saved,
    messages: [
      { id: `${id}-u`, role: "user", text: question },
      { id: `${id}-a`, role: "atlas", questionId, text: "" }
    ]
  };
}

const INITIAL: Conversation[] = [
  { id: "c-new", title: "New conversation", group: "Today", saved: false, messages: [] },
  pastConversation("c-attention", "Yesterday", "attention", false),
  pastConversation("c-billing", "Yesterday", "billing", true),
  pastConversation("c-rap", "This week", "rap", false)
];

const GROUPS: Group[] = ["Today", "Yesterday", "This week"];

const TONE_TEXT: Record<NexaContextKpi["tone"], string> = {
  good: "text-green-700",
  watch: "text-amber-800",
  bad: "text-red-700",
  neutral: "text-muted-foreground"
};

export function AskAtlasChat({ answers, context, asAtLabel }: AskAtlasChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL);
  const [activeId, setActiveId] = useState("c-new");
  const [tab, setTab] = useState<"history" | "saved">("history");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [count, setCount] = useState(1);
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const messages = active?.messages ?? [];
  const lastAtlas = [...messages]
    .reverse()
    .find((message) => message.role === "atlas" && message.questionId !== null);
  const lastAnswer =
    lastAtlas?.role === "atlas" && lastAtlas.questionId !== null ? answers[lastAtlas.questionId] : null;

  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeId]);

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "" || !active) return;
    const questionId = matchQuestion(trimmed);
    setConversations((current) =>
      current.map((item) =>
        item.id !== active.id
          ? item
          : {
              ...item,
              title: item.messages.length === 0 ? trimmed : item.title,
              messages: [
                ...item.messages,
                { id: `${item.id}-u${item.messages.length}`, role: "user", text: trimmed },
                {
                  id: `${item.id}-a${item.messages.length}`,
                  role: "atlas",
                  questionId,
                  text: questionId === null ? FALLBACK_TEXT : ""
                }
              ]
            }
      )
    );
    setDraft("");
  };

  const newConversation = () => {
    const empty = conversations.find((item) => item.messages.length === 0);
    if (empty) {
      setActiveId(empty.id);
      return;
    }
    const next: Conversation = {
      id: `c-${count}`,
      title: "New conversation",
      group: "Today",
      saved: false,
      messages: []
    };
    setCount((value) => value + 1);
    setConversations((current) => [next, ...current]);
    setActiveId(next.id);
  };

  const toggleSaved = (id: string) =>
    setConversations((current) =>
      current.map((item) => (item.id === id ? { ...item, saved: !item.saved } : item))
    );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(draft);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      ask(draft);
    }
  };

  const query = search.trim().toLowerCase();
  const listed = conversations.filter(
    (item) => (tab === "history" || item.saved) && item.title.toLowerCase().includes(query)
  );
  const savedCount = conversations.filter((item) => item.saved).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Capabilities</span>
        {CATEGORIES.map((category) => (
          <button
            key={category.label}
            type="button"
            onClick={() => ask(labelOf(category.ids[0] ?? "behind"))}
            className="rounded-full border border-primary-100 bg-background px-3 py-1 text-xs font-medium text-gray-800 transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="ptepi-card grid h-[calc(100vh-15rem)] min-h-[600px] grid-cols-1 overflow-hidden lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_300px]">
        {/* Conversations */}
        <aside aria-label="Conversations" className="hidden min-h-0 flex-col border-r border-primary-100/70 lg:flex">
          <div className="space-y-3 p-3">
            <button
              type="button"
              onClick={newConversation}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-700 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800"
            >
              <Plus size={16} aria-hidden />
              New conversation
            </button>
            <label className="relative block">
              <span className="sr-only">Search conversations</span>
              <Search size={14} aria-hidden className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 pr-2 text-xs outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              />
            </label>
            <div role="tablist" aria-label="Conversation list" className="grid grid-cols-2 rounded-lg bg-primary-50 p-1 text-xs font-medium">
              {(["history", "saved"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "rounded-md py-1.5 text-xs font-medium transition-colors",
                    tab === key ? "bg-white text-primary-800 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {key === "history" ? "History" : `Saved (${savedCount})`}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 pb-3">
            {GROUPS.map((group) => {
              const items = listed.filter((item) => item.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group}>
                  <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">{group}</p>
                  <ul className="space-y-1">
                    {items.map((item) => {
                      const selected = item.id === active?.id;
                      return (
                        <li key={item.id} className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveId(item.id)}
                            aria-current={selected ? "true" : undefined}
                            className={cn(
                              "flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 pr-8 text-left transition-colors",
                              selected
                                ? "border-primary-300 bg-primary-50"
                                : "border-transparent hover:bg-gray-50"
                            )}
                          >
                            <MessageSquare size={14} aria-hidden className="mt-0.5 shrink-0 text-primary-600" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-gray-900">{item.title}</span>
                              <span className="block text-[10px] text-gray-600">
                                {item.messages.length} {item.messages.length === 1 ? "message" : "messages"}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSaved(item.id)}
                            aria-label={item.saved ? `Unsave ${item.title}` : `Save ${item.title}`}
                            aria-pressed={item.saved}
                            className="absolute right-2 top-2 rounded p-0.5 text-gray-400 hover:text-amber-600"
                          >
                            <Star size={14} aria-hidden className={item.saved ? "fill-amber-400 text-amber-500" : ""} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
            {listed.length === 0 && <p className="px-1 text-xs text-gray-500">No conversation matches.</p>}

            <div>
              <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Prompt categories
              </p>
              <ul>
                {CATEGORIES.map((category) => (
                  <li key={category.label}>
                    <button
                      type="button"
                      onClick={() => ask(labelOf(category.ids[0] ?? "behind"))}
                      className="flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left text-xs text-gray-800 hover:bg-primary-50"
                    >
                      {category.label}
                      <span className="rounded-full bg-primary-50 px-1.5 text-[10px] font-semibold tabular-nums text-primary-800">
                        {category.ids.length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Conversation */}
        <section aria-label="Nexa conversation" className="flex min-h-0 min-w-0 flex-col bg-gray-50/40">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" role="log" aria-live="polite">
            {messages.length === 0 ? (
              <div className="mx-auto max-w-3xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-white shadow-md shadow-primary-500/25">
                  <Sparkles size={18} aria-hidden />
                </span>
                <p className="mt-4 text-lg font-semibold text-gray-950">How can I help run the portfolio today?</p>
                <p className="mt-1 text-sm text-gray-600">
                  Ask about progress, billing, evidence, cost or service contracts. Answers cite their sources and
                  the data date, in English or Bahasa Indonesia.
                </p>
                <ul className="mt-5 space-y-2">
                  {PROMPTS.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        onClick={() => ask(prompt)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-left text-sm text-gray-800 transition-colors hover:border-primary-300 hover:bg-primary-50/60"
                      >
                        {prompt}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-5">
                {messages.map((message) =>
                  message.role === "user" ? (
                    <div key={message.id} className="flex justify-end">
                      <p className="max-w-[85%] rounded-lg bg-primary-700 px-3.5 py-2 text-sm font-medium text-white shadow-sm">
                        {message.text}
                      </p>
                    </div>
                  ) : (
                    <div key={message.id} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-800 text-white">
                        <Sparkles size={14} aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-gray-900">{NAME}</span>
                          <span className="text-gray-500">Data as at {asAtLabel}</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15">
                            <FlaskConical size={12} aria-hidden />
                            Mock answer
                          </span>
                        </div>
                        {message.questionId !== null ? (
                          <AnswerCard
                            answer={answers[message.questionId]}
                            followUps={PROMPTS.filter((prompt) => prompt !== labelOf(message.questionId ?? "behind")).slice(0, 2)}
                            onFollowUp={ask}
                          />
                        ) : (
                          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 text-sm">
                            <p>{message.text}</p>
                            <ul className="list-disc space-y-1 pl-5">
                              {PROMPTS.map((prompt) => (
                                <li key={prompt}>
                                  <button
                                    type="button"
                                    onClick={() => ask(prompt)}
                                    className="text-left text-primary-700 hover:underline"
                                  >
                                    {prompt}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-primary-100/70 bg-white px-4 pb-3 pt-3">
            <div className="flex items-end gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask me anything..."
                aria-label="Your question"
                className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-gray-500"
              />
              <button
                type="submit"
                disabled={draft.trim() === ""}
                aria-label="Send question"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp size={16} aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-gray-500">
              Enter to send, Shift + Enter for a new line. Mock answers scripted by keyword; a person approves every action.
            </p>
          </form>
        </section>

        {/* Context */}
        <aside aria-label="Context panel" className="hidden min-h-0 overflow-y-auto border-l border-primary-100/70 p-4 xl:block">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Context panel</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green-600" />
              As at {asAtLabel}
            </span>
          </div>
          <p className="text-[11px] text-gray-500">All projects, governed demo data</p>

          <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Portfolio KPIs</p>
          <ul className="mt-2 space-y-2">
            {context.map((kpi) => (
              <li key={kpi.label} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[11px] text-gray-600">{kpi.label}</p>
                  <p className={cn("text-[10px] font-semibold", TONE_TEXT[kpi.tone])}>{kpi.note}</p>
                </div>
                <p className="mt-0.5 text-base font-bold tabular-nums text-gray-950">{kpi.value}</p>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Answer basis</p>
          {lastAnswer ? (
            <div className="mt-2 space-y-1 rounded-lg border border-gray-200 bg-white p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                <ShieldCheck size={14} aria-hidden className="text-primary-700" />
                {lastAnswer.sources.length} cited sources
              </p>
              <p className="text-xs text-gray-700">
                {(["table", "document", "rule"] as const)
                  .map((kind) => {
                    const n = lastAnswer.sources.filter((source) => source.kind === kind).length;
                    return `${n} ${kind}${n === 1 ? "" : "s"}`;
                  })
                  .join(", ")}
              </p>
              <p className="text-[11px] text-gray-500">No AI model is called; numbers come from the governed data.</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">Ask a question to see what the answer is based on.</p>
          )}

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Source references ({lastAnswer?.sources.length ?? 0})
          </p>
          {lastAnswer && (
            <ol className="mt-2 space-y-1.5">
              {lastAnswer.sources.map((source, index) => {
                const Icon = SOURCE_ICON[source.kind];
                return (
                  <li
                    key={`${source.kind}-${source.label}`}
                    className="flex items-start gap-2 rounded-lg border border-gray-200 bg-white p-2.5 text-xs"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary-50 text-[10px] font-semibold text-primary-800">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-gray-900">{source.label}</span>
                      <span className="flex items-center gap-1 text-[10px] capitalize text-gray-500">
                        <Icon size={11} aria-hidden />
                        {source.kind}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </aside>
      </div>
    </div>
  );
}

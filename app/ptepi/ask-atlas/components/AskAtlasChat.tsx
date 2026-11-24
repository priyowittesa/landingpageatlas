"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  FlaskConical,
  MessageSquare,
  Plus,
  SendHorizontal,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BAHASA_CHIP, QUESTIONS, matchQuestion } from "../questions";
import type { Answer, ChatMessage, QuestionId } from "../types";
import { AnswerCard } from "./AnswerCard";

const NAME = "Nexa Intelligence";
const CHIPS = [...QUESTIONS.map((question) => question.label), BAHASA_CHIP.label];

const FALLBACK_TEXT = "I cannot answer that yet. In this prototype I can answer these questions:";

type Conversation = { id: string; title: string; messages: ChatMessage[] };

type AskAtlasChatProps = {
  answers: Record<QuestionId, Answer>;
};

const newConversation = (index: number): Conversation => ({
  id: `c-${index}`,
  title: "New chat",
  messages: []
});

export function AskAtlasChat({ answers }: AskAtlasChatProps) {
  const [conversations, setConversations] = useState<Conversation[]>([newConversation(0)]);
  const [activeId, setActiveId] = useState("c-0");
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((item) => item.id === activeId) ?? conversations[0];
  const messages = active.messages;

  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, activeId]);

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "") return;
    const questionId = matchQuestion(trimmed);
    setConversations((current) =>
      current.map((item) =>
        item.id !== active.id
          ? item
          : {
              ...item,
              title: item.messages.length === 0 ? trimmed.slice(0, 40) : item.title,
              messages: [
                ...item.messages,
                { id: `u-${item.messages.length}`, role: "user", text: trimmed },
                {
                  id: `a-${item.messages.length}`,
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

  const startChat = () => {
    if (active.messages.length === 0) return;
    const next = newConversation(conversations.length);
    setConversations((current) => [next, ...current]);
    setActiveId(next.id);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(draft);
  };

  const recent = conversations.filter((item) => item.messages.length > 0);

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-white">
      <aside
        aria-label="Chat history"
        className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white md:flex"
      >
        <div className="space-y-2 p-3">
          <button
            type="button"
            onClick={startChat}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-700 text-xs font-medium text-white transition-colors hover:bg-primary-800"
          >
            <Plus size={14} aria-hidden />
            New chat
          </button>
        </div>

        <p className="px-5 pb-1 pt-2 text-[10px] uppercase tracking-wide text-gray-500">Recent</p>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {recent.length === 0 ? (
            <li className="px-3 py-2 text-[10px] text-gray-500">No chats yet</li>
          ) : (
            recent.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  aria-current={item.id === active.id ? "true" : undefined}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-gray-50",
                    item.id === active.id && "bg-primary-50/70"
                  )}
                >
                  <span className="block truncate text-xs font-medium text-gray-800">
                    {item.title}
                  </span>
                  <span className="block text-[10px] text-gray-500">
                    {item.messages.length / 2} question{item.messages.length > 2 ? "s" : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="space-y-1.5 border-t border-gray-200 p-3">
          <p className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <FlaskConical size={12} aria-hidden /> Mock answers, no AI model is called
          </p>
          <p className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <ShieldCheck size={12} aria-hidden /> AI recommends, people decide
          </p>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col" aria-label={NAME}>
        <h1 className="sr-only">{NAME}</h1>
        <div
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
          role="log"
          aria-live="polite"
          aria-label={`Conversation with ${NAME}`}
        >
          {messages.length === 0 ? (
            <EmptyState onPick={ask} />
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-5">
              {messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-xl bg-primary-700 px-3.5 py-2.5 text-sm text-white shadow-sm">
                      {message.text}
                    </p>
                  </div>
                ) : (
                  <div key={message.id} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-700 text-white">
                        <Sparkles size={12} aria-hidden />
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                        {NAME}
                      </span>
                    </div>
                    <div className="ml-8 rounded-xl bg-gray-50 px-3.5 py-3">
                      {message.questionId !== null ? (
                        <AnswerCard answer={answers[message.questionId]} />
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-700">{message.text}</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm">
                            {CHIPS.map((chip) => (
                              <li key={chip}>
                                <button
                                  type="button"
                                  onClick={() => ask(chip)}
                                  className="text-left text-primary-700 hover:underline"
                                >
                                  {chip}
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

        <div className="px-4 pb-3 pt-1">
          <form
            onSubmit={onSubmit}
            className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100"
          >
            <MessageSquare size={16} aria-hidden className="mb-2.5 ml-2 shrink-0 text-gray-400" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask about progress, billing, evidence, cost or inspections"
              aria-label="Your question"
              className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500"
            />
            <button
              type="submit"
              disabled={draft.trim() === ""}
              aria-label="Send question"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendHorizontal size={16} aria-hidden />
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-gray-500">
            Mock answers scripted by keyword. Every number is read from the demo data (synthetic,
            except the Kapasitor Bank schedule). A named EPI owner approves every action.
          </p>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 text-white shadow-md shadow-primary-500/25">
        <Sparkles size={22} aria-hidden />
      </span>
      <p className="mt-4 text-sm font-semibold text-gray-900">What should we work on?</p>
      <p className="mt-1 text-xs text-gray-600">
        Ask about progress, billing, evidence, cost or inspections. Answers are cited from the
        governed data, in English or Bahasa Indonesia.
      </p>
      <ul className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {CHIPS.map((chip) => (
          <li key={chip}>
            <button
              type="button"
              onClick={() => onPick(chip)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-left text-xs text-gray-700 transition-colors hover:border-primary-300 hover:bg-primary-50/60"
            >
              {chip}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

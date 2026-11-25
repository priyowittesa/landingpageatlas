"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, ExternalLink, MessageSquarePlus, Sparkles, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AnswerCard } from "../ask-atlas/components/AnswerCard";
import { getPagePrompts } from "../ask-atlas/page-prompts";
import { matchQuestion } from "../ask-atlas/questions";
import type { Answer, QuestionId } from "../ask-atlas/types";
import { getScreenTitle } from "../navigation";
import { useNexaChatStore } from "../store/nexa-chat-store";
import { Tr, useT } from "./Tr";

const FALLBACK_TEXT = "I cannot answer that yet. In this prototype I can answer these questions:";

type NexaChatDrawerProps = { answers: Record<QuestionId, Answer> };

/**
 * Nexa as a side drawer on every screen: ask about the screen you are on without leaving it.
 * The suggestions follow the screen; answers are the same cited, scripted answers as the Nexa page.
 */
export function NexaChatDrawer({ answers }: NexaChatDrawerProps) {
  const t = useT();
  const pathname = usePathname();
  const open = useNexaChatStore((state) => state.open);
  const setOpen = useNexaChatStore((state) => state.setOpen);
  const messages = useNexaChatStore((state) => state.messages);
  const ask = useNexaChatStore((state) => state.ask);
  const reset = useNexaChatStore((state) => state.reset);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const prompts = getPagePrompts(pathname);
  const screen = getScreenTitle(pathname);

  useEffect(() => {
    if (open && messages.length > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages.length]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === "") return;
    ask(trimmed, matchQuestion(trimmed), FALLBACK_TEXT);
    setDraft("");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(draft);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-gray-950/30 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(34rem,100vw)] flex-col border-l border-primary-100 bg-background shadow-2xl outline-none duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:animate-in data-[state=open]:slide-in-from-right">
          <header className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary-50 to-background px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 text-white">
              <Sparkles size={20} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="text-base font-semibold text-gray-950">Nexa</DialogPrimitive.Title>
              <DialogPrimitive.Description className="truncate text-xs text-gray-700">
                <Tr>Asking from</Tr>: {t(screen)}
              </DialogPrimitive.Description>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-gray-800 hover:bg-primary-50"
              >
                <MessageSquarePlus size={14} aria-hidden />
                <Tr>New chat</Tr>
              </button>
            )}
            <DialogPrimitive.Close
              aria-label={t("Close")}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <X size={20} aria-hidden />
            </DialogPrimitive.Close>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
            {messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-base font-semibold text-gray-950">
                  <Tr>What would you like to know about this screen?</Tr>
                </p>
                <p className="text-sm leading-relaxed text-gray-700">
                  <Tr>Answers cite their sources and the data date. Nothing runs on its own; a person approves every action.</Tr>
                </p>
                <ul className="space-y-2">
                  {prompts.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        onClick={() => send(prompt)}
                        className="w-full cursor-pointer rounded-xl border border-primary-100 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 transition-colors hover:border-primary-300 hover:bg-primary-50"
                      >
                        <Tr>{prompt}</Tr>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary-700 px-4 py-2.5 text-sm text-white">{message.text}</p>
                  </div>
                ) : (
                  <div key={message.id} className="flex gap-2.5">
                    <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                      <Sparkles size={14} aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      {message.questionId === null ? (
                        <div className="space-y-2 text-sm text-gray-800">
                          <p><Tr>{FALLBACK_TEXT}</Tr></p>
                          <ul className="space-y-1.5">
                            {prompts.map((prompt) => (
                              <li key={prompt}>
                                <button type="button" onClick={() => send(prompt)} className="cursor-pointer text-left font-medium text-primary-800 hover:underline">
                                  <Tr>{prompt}</Tr>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <AnswerCard answer={answers[message.questionId]} />
                      )}
                    </div>
                  </div>
                )
              )
            )}
            <div ref={endRef} />
          </div>

          <footer className="space-y-2 border-t border-border bg-background px-5 py-4">
            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                aria-label={t("Your question")}
                placeholder={t("Ask me anything...")}
                className="min-h-14 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              />
              <button
                type="submit"
                aria-label={t("Send question")}
                disabled={draft.trim() === ""}
                className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-primary-700 text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-primary-200"
              >
                <ArrowUp size={20} aria-hidden />
              </button>
            </form>
            <Link
              href="/ptepi/ask-atlas"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-800 hover:underline"
            >
              <ExternalLink size={14} aria-hidden />
              <Tr>Open the full Nexa page</Tr>
            </Link>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

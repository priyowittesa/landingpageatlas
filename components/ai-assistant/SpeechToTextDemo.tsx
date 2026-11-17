"use client";

import { AlertCircle, Loader2, Mic, RotateCcw, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeechToText, type WhisperModel } from "./useSpeechToText";

type SpeechToTextDemoProps = {
  className?: string;
  model?: WhisperModel;
  onTranscript?: (text: string) => void;
};

export function SpeechToTextDemo({
  className,
  model = "Xenova/whisper-base",
  onTranscript
}: SpeechToTextDemoProps) {
  const {
    transcript,
    partialTranscript,
    error,
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    clearTranscript
  } = useSpeechToText({ model, onTranscript });

  const visibleTranscript = partialTranscript || transcript;

  return (
    <section
      className={cn(
        "space-y-4 rounded-xl border border-gray-200 bg-white p-4",
        className
      )}
    >
      <div>
        <h2 className="text-sm font-semibold text-gray-900">Speech to text</h2>
        <p className="mt-1 text-xs text-gray-500">
          Hosted Whisper automatically detects English, Indonesian, and
          code-switching between them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isRecording ? (
          <Button variant="destructive" onClick={stopRecording}>
            <Square className="h-4 w-4" />
            Stop recording
          </Button>
        ) : (
          <Button
            onClick={() => void startRecording()}
            disabled={isTranscribing}
          >
            {isTranscribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {isTranscribing ? "Transcribing…" : "Start recording"}
          </Button>
        )}
        {visibleTranscript && !isRecording && (
          <Button variant="outline" onClick={clearTranscript}>
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {(isRecording || visibleTranscript || isTranscribing) && (
        <div
          className="min-h-24 rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-700"
          aria-live="polite"
        >
          {isTranscribing && !visibleTranscript ? (
            <span className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Transcribing audio…
            </span>
          ) : visibleTranscript ? (
            <p className={cn(partialTranscript && "text-gray-500")}>
              {visibleTranscript}
              {partialTranscript && (
                <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary-500 align-middle" />
              )}
            </p>
          ) : (
            <p className="text-gray-400">Listening…</p>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}

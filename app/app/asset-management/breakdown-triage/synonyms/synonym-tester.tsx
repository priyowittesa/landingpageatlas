"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";
import { useSynonymPreview } from "./use-synonyms";

const SAMPLE = "Compressor ngorok, tekanan turun, laher running hot";

/** Runs the saved dictionary over typed text through the API, as triage would normalize it. */
export function SynonymTester() {
  const [text, setText] = useState(SAMPLE);
  const debounced = useDebouncedValue(text, 400);
  const preview = useSynonymPreview(debounced);
  const result = debounced.trim() ? preview.data : undefined;
  const stale = text !== debounced || preview.isFetching;

  return (
    <div className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Match tester</h3>
        <p className="text-xs text-gray-500">
          Type a description the way an operator would and see which terms are recognized
        </p>
      </div>
      <div className="space-y-3 p-4">
        <Textarea
          aria-label="Description to test"
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="min-h-[70px]"
        />
        <div>
          <div className="mb-1.5 text-xs text-gray-500">Normalized result</div>
          <div
            className={cn(
              "min-h-12 whitespace-pre-wrap rounded-md border border-dashed bg-gray-50 p-3 text-sm leading-7 transition-opacity",
              stale && "opacity-60"
            )}
          >
            {!text.trim() ? (
              <span className="text-gray-500">Type a description to test.</span>
            ) : preview.isError && !result ? (
              <span className="text-red-600">The text could not be tested. Try again.</span>
            ) : result ? (
              result.segments.map((segment, index) =>
                segment.term ? (
                  <mark key={index} className="rounded bg-primary-100 px-1 text-primary-900">
                    {segment.text}
                    {segment.term.toLowerCase() !== segment.text.toLowerCase() && (
                      <small className="ml-1 text-[11px] font-semibold text-primary-700">→ {segment.term}</small>
                    )}
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                )
              )
            ) : (
              <span className="text-gray-500">Checking...</span>
            )}
          </div>
          {result && (
            <p className="mt-2 text-xs text-gray-500">
              {result.recognizedCount
                ? `${result.recognizedCount} terms recognized${result.normalizedCount ? `, ${result.normalizedCount} normalized` : ""}.`
                : "No terms recognized yet. Add a synonym if this is common shop-floor wording."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { env } from "@/lib/env";

const GROQ_TRANSCRIPTIONS_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export const runtime = "nodejs";

function upstreamError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  if (typeof record.error === "string") return record.error;
  if (record.error && typeof record.error === "object") {
    const message = (record.error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const audio = formData.get("file");

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "Missing audio file in form data." },
        { status: 400 }
      );
    }
    if (audio.size === 0) {
      return NextResponse.json(
        { error: "The recorded audio is empty." },
        { status: 400 }
      );
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "The audio file exceeds the 25 MB limit." },
        { status: 413 }
      );
    }

    const groqFormData = new FormData();
    groqFormData.append("file", audio, audio.name || "recording.webm");
    groqFormData.append("model", "whisper-large-v3");
    groqFormData.append("response_format", "json");

    const response = await fetch(GROQ_TRANSCRIPTIONS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.groqApiKey}` },
      body: groqFormData,
      signal: AbortSignal.timeout(60_000)
    });
    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const status = response.status >= 500 ? 502 : response.status;
      return NextResponse.json(
        {
          error: upstreamError(
            payload,
            `Groq transcription failed with status ${response.status}.`
          )
        },
        { status }
      );
    }

    const text =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>).text
        : null;
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Groq returned an empty transcript." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error) {
    if (error instanceof Error && error.message.includes("GROQ_API_KEY")) {
      return NextResponse.json(
        { error: "Speech transcription is not configured." },
        { status: 503 }
      );
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "Groq transcription timed out." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: "Unable to process the audio transcription request." },
      { status: 500 }
    );
  }
}

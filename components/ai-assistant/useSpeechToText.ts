"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WhisperModel =
  | "Xenova/whisper-base"
  | "Xenova/whisper-small"
  | (string & {});

export type UseSpeechToTextOptions = {
  model?: WhisperModel;
  partialIntervalMs?: number;
  onTranscript?: (text: string) => void;
};

export type UseSpeechToTextResult = {
  transcript: string;
  partialTranscript: string;
  error: string | null;
  isModelLoading: boolean;
  modelProgress: number;
  isModelReady: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  loadModel: () => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscript: () => void;
};

type TranscriptionResponse = {
  text?: string;
  error?: string;
};

function chooseRecorderMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus"
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function audioExtension(mimeType: string) {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

function microphoneError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Microphone permission was denied. Allow microphone access in your browser settings and try again.";
    }
    if (error.name === "NotFoundError") {
      return "No microphone was found on this device.";
    }
    if (error.name === "NotReadableError") {
      return "The microphone is already in use or unavailable.";
    }
    return error.message || "Unable to start recording.";
  }
  return error instanceof Error
    ? `Unable to start recording: ${error.message}`
    : "Unable to start recording.";
}

async function requestTranscript(blob: Blob, signal: AbortSignal) {
  if (blob.size === 0) throw new Error("The recorded audio is empty.");

  const mimeType = blob.type || "audio/webm";
  const formData = new FormData();
  formData.append(
    "file",
    new File([blob], `recording.${audioExtension(mimeType)}`, {
      type: mimeType
    })
  );

  let response: Response;
  try {
    response = await fetch("/api/transcribe", {
      method: "POST",
      body: formData,
      signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new Error("Network error while sending audio for transcription.");
  }

  const payload = (await response.json().catch(() => ({}))) as TranscriptionResponse;
  if (!response.ok) {
    throw new Error(payload.error || `Transcription failed (${response.status}).`);
  }
  const text = payload.text?.trim();
  if (!text) throw new Error("The transcription service returned no text.");
  return text;
}

export function useSpeechToText({
  onTranscript
}: UseSpeechToTextOptions = {}): UseSpeechToTextResult {
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const transcribe = useCallback(async (blob: Blob) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    if (mountedRef.current) setIsTranscribing(true);
    try {
      const text = await requestTranscript(blob, controller.signal);
      if (!mountedRef.current) return;
      setTranscript(text);
      onTranscriptRef.current?.(text);
    } catch (transcriptionError) {
      if (
        !mountedRef.current ||
        (transcriptionError instanceof DOMException &&
          transcriptionError.name === "AbortError")
      ) {
        return;
      }
      setError(
        transcriptionError instanceof Error
          ? transcriptionError.message
          : "Unable to transcribe the recorded audio."
      );
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      if (mountedRef.current) setIsTranscribing(false);
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.requestData();
      recorder.stop();
    }
    if (mountedRef.current) setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript("");

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Audio recording is not supported in this browser.");
      return;
    }
    if (recorderRef.current || isTranscribing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = chooseRecorderMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recorder.onstop = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        chunksRef.current = [];
        if (mountedRef.current) {
          setIsRecording(false);
          setError("The browser could not record audio from the microphone.");
        }
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        recorderRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        chunksRef.current = [];
        void transcribe(blob);
      };
      recorder.start(1_000);
      if (mountedRef.current) setIsRecording(true);
    } catch (recordingError) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      if (mountedRef.current) {
        setIsRecording(false);
        setError(microphoneError(recordingError));
      }
    }
  }, [isTranscribing, transcribe]);

  const clearTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  const loadModel = useCallback(async () => undefined, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder?.state === "recording") {
        recorder.onstop = null;
        recorder.stop();
      }
      recorder?.stream.getTracks().forEach((track) => track.stop());
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    transcript,
    partialTranscript: "",
    error,
    isModelLoading: false,
    modelProgress: 100,
    isModelReady: true,
    isRecording,
    isTranscribing,
    loadModel,
    startRecording,
    stopRecording,
    clearTranscript
  };
}

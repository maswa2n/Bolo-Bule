"use client";

import { useMemo, useRef, useState } from "react";
import { transcribeVoiceInput } from "@/lib/ai/stt";
import { speakWithBrowserTts } from "@/lib/ai/tts";
import type { GeneratedCoachTurn, LearningCaseVersion, ObjectiveCode } from "@/types/learning";

type TurnFeedback = {
  score: number;
  good: string;
  focus: string;
  improved: string;
  objectiveCode: ObjectiveCode | null;
  objectiveMet: boolean;
};

type SpeakingSessionProps = {
  activeCase: LearningCaseVersion;
  onSubmitTurn?: (payload: {
    transcript: string;
    objectiveCode: ObjectiveCode | null;
    turnNumber: number;
  }) => Promise<GeneratedCoachTurn | null>;
};

type BrowserSpeechRecognition = typeof window.SpeechRecognition;

function getSpeechRecognition(): BrowserSpeechRecognition | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function normalizeText(value: string) {
  return value.toLowerCase().trim();
}

function evaluateResponse(transcript: string, objectiveCode: ObjectiveCode | null, keywords: string[]) {
  const text = transcript.trim();
  const words = text.split(/\s+/).filter(Boolean);
  const normalized = normalizeText(text);

  let score = 58;
  let focus = "Tambahkan alasan operasional atau komitmen waktu yang lebih spesifik.";
  let improved = text;

  if (words.length >= 7) score += 10;
  if (words.length >= 11) score += 8;
  if (/\b(will|can|need|must|because|before|after|today|tomorrow)\b/i.test(text)) score += 9;
  if (/[.!?]$/.test(text)) score += 3;

  if (/\bi\s+(still\s+)?(waiting|checking|working|verifying)\b/i.test(text) && !/\bi\s+am\s+/i.test(text)) {
    focus = "Tambahkan auxiliary “am” sebelum kata kerja -ing.";
    improved = text.replace(/\bI\s+(still\s+)?(waiting|checking|working|verifying)\b/i, (_, adverb = "", verb) => {
      return `I am ${adverb}${verb}`;
    });
    score -= 8;
  } else if (words.length < 5) {
    focus = "Jawaban masih terlalu pendek. Tambahkan detail aksi dan hasil yang diharapkan.";
    improved = `${text} I will provide a clear follow-up update before the agreed time.`;
    score -= 8;
  }

  const objectiveMet = objectiveCode ? keywords.some((keyword) => normalized.includes(keyword.toLowerCase())) : false;
  if (objectiveMet) score += 5;

  const good =
    words.length >= 8
      ? "Jawaban Anda sudah cukup jelas dan terstruktur."
      : "Jawaban sudah merespons pertanyaan secara langsung.";

  return {
    score: Math.max(45, Math.min(96, score)),
    good,
    focus,
    improved,
    objectiveCode,
    objectiveMet,
  };
}

export function SpeakingSession({ activeCase, onSubmitTurn }: SpeakingSessionProps) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [log, setLog] = useState<Array<{ role: "coach" | "user"; message: string }>>([]);
  const [feedback, setFeedback] = useState<TurnFeedback | null>(null);
  const [completedObjectives, setCompletedObjectives] = useState<Set<ObjectiveCode>>(new Set());
  const [averageScore, setAverageScore] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [nextCoachTurn, setNextCoachTurn] = useState<GeneratedCoachTurn | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const caseTurn = activeCase.turns[turnIndex] ?? null;
  const fallbackPrompt =
    "Please summarize your commitment and the exact follow-up time for this case before we finish.";
  const prompt = nextCoachTurn?.coachMessageEn ?? caseTurn?.coachMessageEn ?? fallbackPrompt;
  const promptId =
    nextCoachTurn?.coachMessageId ??
    caseTurn?.coachMessageId ??
    "Tolong rangkum komitmen dan waktu follow-up final Anda sebelum sesi ditutup.";
  const supportOptions = nextCoachTurn?.responseSupport ?? caseTurn?.responseSupport ?? [];
  const objectiveCode = nextCoachTurn?.targetObjective ?? caseTurn?.objectiveCode ?? null;

  const objectiveKeywords = useMemo(() => {
    if (!objectiveCode) return [];
    const matched = activeCase.objectives.find((objective) => objective.objectiveCode === objectiveCode);
    if (!matched) return [];
    return [matched.objectiveCode, ...matched.description.toLowerCase().split(/\s+/)];
  }, [activeCase.objectives, objectiveCode]);

  function clearRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);
    setTimer(0);
  }

  function speak(text: string) {
    speakWithBrowserTts({ text, lang: "en-US", rate: 0.92 });
  }

  function startRecording() {
    const SpeechRecognitionCtor = getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      setErrorMessage("Browser ini belum mendukung voice recognition. Silakan gunakan mode tulis.");
      return;
    }

    setErrorMessage(null);
    setTranscript("");
    setIsRecording(true);
    setTimer(0);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let buffer = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        buffer += event.results[i][0].transcript;
      }
      setTranscript(buffer.trim());
    };

    recognition.onerror = () => {
      clearRecording();
      setErrorMessage("Terjadi gangguan saat merekam suara. Coba ulangi sekali lagi.");
    };

    recognition.onend = () => {
      clearRecording();
    };

    recognitionRef.current = recognition;
    recognition.start();

    timerRef.current = setInterval(() => {
      setTimer((value) => {
        if (value >= 29) {
          recognition.stop();
          return 30;
        }
        return value + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    clearRecording();
  }

  async function submitTurn() {
    const input = (transcript || draft).trim();
    if (!input) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const sttResult = await transcribeVoiceInput(input);
      const currentFeedback = evaluateResponse(sttResult.normalizedTranscript, objectiveCode, objectiveKeywords);
      setFeedback(currentFeedback);
      setLog((prev) => [
        ...prev,
        { role: "coach", message: prompt },
        { role: "user", message: sttResult.normalizedTranscript },
      ]);

      if (currentFeedback.objectiveCode && currentFeedback.objectiveMet) {
        setCompletedObjectives((prev) => new Set([...prev, currentFeedback.objectiveCode as ObjectiveCode]));
      }

      const newScores = [...scores, currentFeedback.score];
      setScores(newScores);
      setAverageScore(Math.round(newScores.reduce((sum, value) => sum + value, 0) / newScores.length));

      if (onSubmitTurn) {
        const generated = await onSubmitTurn({
          transcript: sttResult.normalizedTranscript,
          objectiveCode: currentFeedback.objectiveCode,
          turnNumber: turnIndex + 1,
        });
        setNextCoachTurn(generated);
      } else {
        setNextCoachTurn(null);
      }

      setDraft("");
      setTranscript("");
      setTurnIndex((value) => value + 1);
    } catch {
      setErrorMessage("Sesi gagal diproses. Silakan coba submit ulang.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const doneObjectives = completedObjectives.size;
  const totalObjectives = activeCase.objectives.length;
  const completionEligible =
    doneObjectives === totalObjectives &&
    turnIndex >= activeCase.conversationPolicy.targetUserTurns &&
    averageScore >= activeCase.conversationPolicy.minimumPassScore;

  return (
    <section className="space-y-4 rounded-3xl border border-white/50 bg-white/90 p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Speaking Session</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{activeCase.title.en}</h2>
          <p className="mt-1 text-sm text-slate-600">{activeCase.scenario.id}</p>
        </div>
        <button
          type="button"
          onClick={() => speak(prompt)}
          className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800"
        >
          Play coach audio
        </button>
      </header>

      <div className="rounded-2xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">{prompt}</p>
        <p className="mt-1 text-sm text-slate-600">{promptId}</p>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {supportOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDraft(option)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:border-cyan-300"
          >
            {option}
          </button>
        ))}
      </div>

      <textarea
        value={transcript || draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setTranscript("");
        }}
        placeholder="Speak now atau tulis jawaban Anda..."
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={[
            "rounded-xl px-3 py-2 text-sm font-semibold text-white",
            isRecording ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700",
          ].join(" ")}
          disabled={isSubmitting}
        >
          {isRecording ? `Stop recording (${timer}s)` : "Start voice input"}
        </button>
        <button
          type="button"
          onClick={submitTurn}
          disabled={isSubmitting || !(transcript || draft).trim()}
          className="rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Submit turn"}
        </button>
      </div>

      {errorMessage ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p> : null}

      <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 md:grid-cols-3">
        <p className="text-sm text-slate-700">
          Objectives: <strong>{doneObjectives}</strong>/{totalObjectives}
        </p>
        <p className="text-sm text-slate-700">
          Average score: <strong>{averageScore || 0}</strong>
        </p>
        <p className="text-sm text-slate-700">
          Completion:{" "}
          <strong className={completionEligible ? "text-emerald-700" : "text-amber-700"}>
            {completionEligible ? "Eligible" : "Not yet"}
          </strong>
        </p>
      </div>

      {log.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Conversation log</p>
          {log.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={[
                "rounded-xl px-3 py-2 text-sm",
                item.role === "coach" ? "bg-white text-slate-700" : "bg-blue-50 text-blue-900",
              ].join(" ")}
            >
              <strong className="mr-1">{item.role === "coach" ? "Coach" : "You"}:</strong>
              {item.message}
            </div>
          ))}
        </div>
      ) : null}

      {feedback ? (
        <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-sm text-emerald-700">
            <strong>Good:</strong> {feedback.good}
          </p>
          <p className="text-sm text-amber-700">
            <strong>Focus:</strong> {feedback.focus}
          </p>
          <p className="text-sm text-slate-700">
            <strong>Natural version:</strong> {feedback.improved}
          </p>
        </div>
      ) : null}
    </section>
  );
}

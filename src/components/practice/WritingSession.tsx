"use client";

import { useState } from "react";
import type { LearningCaseVersion } from "@/types/learning";

type WritingFeedback = {
  improvedText: string;
  lesson: string;
  scores: {
    taskCompletion: number;
    grammar: number;
    clarity: number;
    professionalTone: number;
  };
};

type WritingSessionProps = {
  activeCase: LearningCaseVersion;
  onEvaluate?: (text: string) => Promise<WritingFeedback | null>;
};

function fallbackEvaluate(text: string): WritingFeedback {
  const normalized = text.trim();
  const improved = normalized.endsWith(".") ? normalized : `${normalized}.`;
  return {
    improvedText: improved,
    lesson: "Gunakan struktur: status -> alasan -> tindakan -> komitmen waktu.",
    scores: {
      taskCompletion: 80,
      grammar: 74,
      clarity: 82,
      professionalTone: 84,
    },
  };
}

export function WritingSession({ activeCase, onEvaluate }: WritingSessionProps) {
  const [text, setText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runEvaluation() {
    if (!text.trim()) return;

    setErrorMessage(null);
    setIsChecking(true);
    try {
      if (onEvaluate) {
        const external = await onEvaluate(text);
        setFeedback(external ?? fallbackEvaluate(text));
      } else {
        setFeedback(fallbackEvaluate(text));
      }
    } catch {
      setErrorMessage("Gagal mengevaluasi tulisan. Silakan coba lagi.");
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <section className="bb-glass-panel bb-motion-rise bb-motion-delay-2 space-y-4 rounded-3xl p-4 sm:p-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Writing Transfer</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">{activeCase.title.en}</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tulis follow-up message berbasis objective yang sama dengan mode speaking.
        </p>
      </header>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write your professional message here..."
        className="min-h-36 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">{text.length} characters</p>
        <button
          type="button"
          onClick={runEvaluation}
          disabled={isChecking || !text.trim()}
          className={[
            "bb-btn-primary bb-press-depth bb-tap-target w-full px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
            isChecking ? "bb-motion-pulse" : "",
          ].join(" ")}
        >
          {isChecking ? "Checking..." : "Evaluate writing"}
        </button>
      </div>

      {errorMessage ? <p className="bb-state-enter bb-state-error rounded-xl px-3 py-2 text-sm">{errorMessage}</p> : null}

      {feedback ? (
        <div className="bb-celebrate-subtle bb-state-enter space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-white p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Original</p>
              <p className="text-sm text-slate-700">{text}</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">Improved</p>
              <p className="text-sm text-emerald-900">{feedback.improvedText}</p>
            </div>
          </div>

          <p className="bb-state-info rounded-xl px-3 py-2 text-sm">
            <strong>Lesson:</strong> {feedback.lesson}
          </p>

          <div className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <p className="rounded-lg bg-white px-2 py-1">Task: {feedback.scores.taskCompletion}</p>
            <p className="rounded-lg bg-white px-2 py-1">Grammar: {feedback.scores.grammar}</p>
            <p className="rounded-lg bg-white px-2 py-1">Clarity: {feedback.scores.clarity}</p>
            <p className="rounded-lg bg-white px-2 py-1">Tone: {feedback.scores.professionalTone}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
import { translateSupportOptionAction } from "@/app/(app)/practice/phrase-actions";
import { transcribeVoiceInput } from "@/lib/ai/stt";
import { speakCoachWithBrowserTts } from "@/lib/ai/tts";
import {
  getResponseSupportGuide,
  type ResponseSupportGuide,
} from "@/lib/learning/response-support-guide";
import {
  formatAverageScore,
  getSessionCompletionSummary,
} from "@/lib/learning/session-completion";
import type {
  ConversationLogMessage,
  EvaluatorResult,
  GeneratedCoachTurn,
  LearningCaseVersion,
  LearningCompletionStatus,
  ObjectiveCode,
} from "@/types/learning";

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
  targetTurns: number;
  onSubmitTurn: (payload: {
    transcript: string;
    objectiveCode: ObjectiveCode | null;
    turnNumber: number;
    learnerContext: string;
    conversationHistory: ConversationLogMessage[];
  }) => Promise<{
    generatedTurn: GeneratedCoachTurn | null;
    evaluation: EvaluatorResult;
    session: {
      completionEligible: boolean;
      completionStatus: LearningCompletionStatus;
      averageScore: number;
      coveredObjectives: string[];
    };
  } | null>;
  onReviseContext: (payload: {
    learnerContext: string;
    conversationHistory: ConversationLogMessage[];
    objectiveCode: ObjectiveCode | null;
  }) => Promise<{ generatedTurn: GeneratedCoachTurn | null; contextApplied?: string } | null>;
};

function summarizeContext(context: string, maxLength = 96): string {
  const trimmed = context.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

type BrowserSpeechRecognition = typeof window.SpeechRecognition;

function getSpeechRecognition(): BrowserSpeechRecognition | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function buildTurnFeedback(
  transcript: string,
  objectiveCode: ObjectiveCode | null,
  evaluation: EvaluatorResult,
): TurnFeedback {
  const primaryFinding = evaluation.grammarFindings[0];
  const objectiveMet = objectiveCode
    ? evaluation.objectivesCompleted.includes(objectiveCode)
    : evaluation.objectivesCompleted.length > 0;

  return {
    score: evaluation.overallScore,
    good:
      evaluation.responseRelevance === "relevant"
        ? "Jawaban Anda sudah relevan dengan objective saat ini."
        : "Jawaban sudah bergerak ke arah yang tepat, lanjutkan dengan detail lebih spesifik.",
    focus:
      primaryFinding?.explanationId ??
      (evaluation.needsClarification
        ? "Perjelas jawaban dengan format: status, dampak, lalu komitmen waktu."
        : "Pertahankan struktur jawaban dan tambah komitmen yang lebih tegas."),
    improved: primaryFinding?.corrected ?? transcript,
    objectiveCode,
    objectiveMet,
  };
}

export function SpeakingSession({ activeCase, targetTurns, onSubmitTurn, onReviseContext }: SpeakingSessionProps) {
  const [turnIndex, setTurnIndex] = useState(0);
  const [sessionTurnCount, setSessionTurnCount] = useState(0);
  const [learnerContext, setLearnerContext] = useState("");
  const [appliedLearnerContext, setAppliedLearnerContext] = useState("");
  const [contextRevisionMessage, setContextRevisionMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [selectedSupportOption, setSelectedSupportOption] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<ResponseSupportGuide | null>(null);
  const [isTranslatingMeaning, setIsTranslatingMeaning] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [log, setLog] = useState<ConversationLogMessage[]>([]);
  const [feedback, setFeedback] = useState<TurnFeedback | null>(null);
  const [coveredObjectiveCodes, setCoveredObjectiveCodes] = useState<string[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [completionStatus, setCompletionStatus] = useState<LearningCompletionStatus>("in_progress");
  const [isCompletionEligible, setIsCompletionEligible] = useState(false);
  const [nextCoachTurn, setNextCoachTurn] = useState<GeneratedCoachTurn | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRevisingContext, setIsRevisingContext] = useState(false);
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
  const minimumPassScore = activeCase.conversationPolicy.minimumPassScore ?? 70;
  const requiredObjectives = activeCase.objectives.filter((objective) => objective.required);
  const requiredRatio = activeCase.conversationPolicy.requiredObjectiveCompletion ?? 1;
  const minimumRequiredCompleted =
    requiredRatio <= 1
      ? Math.ceil(requiredObjectives.length * requiredRatio)
      : Math.min(requiredObjectives.length, Math.floor(requiredRatio));
  const doneObjectives = coveredObjectiveCodes.filter((code) =>
    requiredObjectives.some((objective) => objective.objectiveCode === code),
  ).length;
  const totalObjectives = Math.max(1, minimumRequiredCompleted);
  const completionSummary = getSessionCompletionSummary({
    completionStatus,
    completionEligible: isCompletionEligible,
    averageScore,
    minimumPassScore,
    coveredObjectives: doneObjectives,
    totalObjectives,
    turnCount: sessionTurnCount,
    targetTurns,
  });
  const trimmedLearnerContext = learnerContext.trim();
  const averageScorePercent = Math.max(0, Math.min(100, Math.round(averageScore)));
  const objectivePercent = Math.max(0, Math.min(100, Math.round((doneObjectives / totalObjectives) * 100)));
  const hasContextRevision =
    appliedLearnerContext.length > 0 && trimmedLearnerContext !== appliedLearnerContext;
  const canReviseContext =
    sessionTurnCount > 0 && trimmedLearnerContext.length > 0 && hasContextRevision;

  function clearSelectedSupportGuide() {
    setSelectedSupportOption(null);
    setSelectedGuide(null);
    setIsTranslatingMeaning(false);
  }

  async function selectSupportOption(option: string) {
    setSelectedSupportOption(option);
    setDraft(option);
    setSelectedGuide(getResponseSupportGuide(option));
    setIsTranslatingMeaning(true);

    try {
      const result = await translateSupportOptionAction({ english: option });
      if ("error" in result && result.error) {
        return;
      }
      if ("meaningId" in result && result.meaningId) {
        setSelectedGuide((current) =>
          current && current.english === option.trim()
            ? { ...current, meaningId: result.meaningId as string }
            : current,
        );
      }
    } catch {
      // Keep local fallback translation when server translation fails.
    } finally {
      setIsTranslatingMeaning(false);
    }
  }

  function clearRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRecording(false);
    setTimer(0);
  }

  function speak(text: string) {
    void speakCoachWithBrowserTts(text);
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
      const historyForServer: ConversationLogMessage[] = [...log, { role: "coach", message: prompt }];
      const submissionResult = await onSubmitTurn({
        transcript: sttResult.normalizedTranscript,
        objectiveCode,
        turnNumber: turnIndex + 1,
        learnerContext,
        conversationHistory: historyForServer,
      });
      if (!submissionResult) {
        setErrorMessage("Sesi gagal diproses. Silakan coba submit ulang.");
        return;
      }

      const currentFeedback = buildTurnFeedback(sttResult.normalizedTranscript, objectiveCode, submissionResult.evaluation);
      setFeedback(currentFeedback);
      setLog((prev) => [
        ...prev,
        { role: "coach", message: prompt },
        { role: "user", message: sttResult.normalizedTranscript },
      ]);

      setCoveredObjectiveCodes(submissionResult.session.coveredObjectives);

      setAverageScore(submissionResult.session.averageScore);
      setCompletionStatus(submissionResult.session.completionStatus);
      setIsCompletionEligible(submissionResult.session.completionEligible);
      setSessionTurnCount(turnIndex + 1);
      setNextCoachTurn(submissionResult.generatedTurn);
      if (learnerContext.trim()) {
        setAppliedLearnerContext(learnerContext.trim());
        setContextRevisionMessage("Context diterapkan. Pertanyaan coach berikutnya menyesuaikan situasi Anda.");
      }
      clearSelectedSupportGuide();

      setDraft("");
      setTranscript("");
      setTurnIndex((value) => value + 1);
    } catch {
      setErrorMessage("Sesi gagal diproses. Silakan coba submit ulang.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function reviseContext() {
    const contextToApply = learnerContext.trim();
    if (!contextToApply || sessionTurnCount === 0) return;

    setErrorMessage(null);
    setContextRevisionMessage(null);
    setIsRevisingContext(true);
    try {
      const historyForServer: ConversationLogMessage[] =
        log.length > 0 ? log : [{ role: "coach", message: prompt }];
      const revisionResult = await onReviseContext({
        learnerContext: contextToApply,
        conversationHistory: historyForServer,
        objectiveCode,
      });

      if (!revisionResult?.generatedTurn) {
        setErrorMessage("Revisi context gagal. Silakan coba lagi.");
        return;
      }

      setNextCoachTurn(revisionResult.generatedTurn);
      setAppliedLearnerContext(revisionResult.contextApplied ?? contextToApply);
      setContextRevisionMessage("Context direvisi. Pertanyaan coach dan contoh jawaban sudah disesuaikan.");
      clearSelectedSupportGuide();
    } catch {
      setErrorMessage("Revisi context gagal. Silakan coba lagi.");
    } finally {
      setIsRevisingContext(false);
    }
  }

  return (
    <section className="bb-glass-panel bb-motion-rise bb-motion-delay-2 space-y-4 rounded-3xl p-4 sm:p-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Speaking Session</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">{activeCase.title.en}</h2>
        <p className="mt-1 text-sm text-slate-600">{activeCase.scenario.id}</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600" htmlFor="learner-context">
            Your practice context
          </label>
          <button
            type="button"
            onClick={() => {
              void reviseContext();
            }}
            disabled={isRevisingContext || isSubmitting || !canReviseContext}
            title={
              sessionTurnCount === 0
                ? "Context pertama kali diterapkan saat Submit turn."
                : hasContextRevision
                  ? "Terapkan perubahan context ke arah percakapan coach."
                  : "Ubah context terlebih dahulu untuk revisi."
            }
            className={[
              "bb-btn-secondary bb-press-depth bb-tap-target px-3 py-1.5 text-xs font-semibold text-cyan-800 disabled:cursor-not-allowed disabled:opacity-50",
              isRevisingContext ? "bb-motion-pulse" : "",
            ].join(" ")}
          >
            {isRevisingContext ? "Memproses..." : "Revisi context"}
          </button>
        </div>
        <textarea
          id="learner-context"
          value={learnerContext}
          onChange={(event) => {
            setLearnerContext(event.target.value);
            setContextRevisionMessage(null);
          }}
          placeholder="Contoh: Saya lagi roleplay follow-up vendor yang telat kirim material critical."
          className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-800 outline-none ring-cyan-500 focus:ring-2"
        />
        {sessionTurnCount === 0 && trimmedLearnerContext ? (
          <p className="mt-2 text-xs text-slate-500">
            Context akan diterapkan otomatis setelah Anda menekan Submit turn pertama.
          </p>
        ) : null}
        {appliedLearnerContext ? (
          <p className="bb-celebrate-subtle bb-state-enter bb-state-success mt-2 rounded-lg px-2 py-1.5 text-xs">
            Context aktif: {summarizeContext(appliedLearnerContext)}
          </p>
        ) : null}
        {hasContextRevision ? (
          <p className="bb-state-enter bb-state-warning mt-2 rounded-lg px-2 py-1.5 text-xs">
            Context diubah. Tekan Revisi context untuk menyesuaikan arah percakapan coach.
          </p>
        ) : null}
        {contextRevisionMessage ? (
          <p className="bb-state-enter bb-state-info mt-2 rounded-lg px-2 py-1.5 text-xs">
            {contextRevisionMessage}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pertanyaan coach</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{prompt}</p>
          <p className="mt-1 text-sm text-slate-600">{promptId}</p>
        </div>
        <button
          type="button"
          onClick={() => speak(prompt)}
          className="bb-btn-secondary bb-press-depth bb-tap-target w-full shrink-0 px-3 py-2 text-sm font-semibold text-cyan-800 sm:w-auto"
        >
          Play coach audio
        </button>
      </div>

      {supportOptions.length > 0 ? (
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Pilihan jawaban dari sistem</p>
            <p className="mt-1 text-xs text-slate-500">
              Pilih salah satu contoh di bawah, atau tulis/rekam jawaban Anda sendiri.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {supportOptions.map((option) => {
              const isSelected = selectedSupportOption === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    void selectSupportOption(option);
                  }}
                  className={[
                    "bb-interactive-lift bb-press-depth bb-tap-target rounded-xl border px-3 py-2 text-left text-sm transition",
                    isSelected
                      ? "border-cyan-500 bg-cyan-50 text-slate-900 ring-2 ring-cyan-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300",
                  ].join(" ")}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {selectedGuide ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-800">Panduan pelafalan (ejaan Indonesia)</p>
            <p className="mt-2 text-lg font-medium leading-relaxed text-slate-900">{selectedGuide.ejaan}</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-cyan-800">Arti dalam Bahasa Indonesia</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              {isTranslatingMeaning ? "Memuat terjemahan..." : selectedGuide.meaningId}
            </p>
            <button
              type="button"
              onClick={() => speak(selectedGuide.english)}
              className="bb-btn-secondary bb-press-depth bb-tap-target mt-3 px-3 py-1.5 text-xs font-semibold text-cyan-800"
            >
              Dengarkan pelafalan
            </button>
          </div>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={[
              "bb-press-depth bb-tap-target w-full shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-white sm:w-auto sm:self-center",
              isRecording ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700",
              isSubmitting ? "bb-motion-pulse" : "",
            ].join(" ")}
            disabled={isSubmitting}
          >
            {isRecording ? `Stop recording (${timer}s)` : "Start voice input"}
          </button>
        </div>
      ) : null}

      <textarea
        value={transcript || draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setTranscript("");
        }}
        placeholder="Speak now atau tulis jawaban Anda..."
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2"
      />

      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        {!selectedGuide ? (
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={[
              "bb-press-depth w-full rounded-xl px-3 py-2 text-sm font-semibold text-white sm:w-auto",
              isRecording ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700",
              "bb-tap-target",
            ].join(" ")}
            disabled={isSubmitting}
          >
            {isRecording ? `Stop recording (${timer}s)` : "Start voice input"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={submitTurn}
          disabled={isSubmitting || !(transcript || draft).trim()}
          className={[
            "bb-btn-primary bb-press-depth bb-tap-target w-full px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto",
            isSubmitting ? "bb-motion-pulse" : "",
          ].join(" ")}
        >
          {isSubmitting ? "Processing..." : "Submit turn"}
        </button>
      </div>

      {errorMessage ? <p className="bb-state-enter bb-state-error rounded-xl px-3 py-2 text-sm">{errorMessage}</p> : null}

      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skor rata-rata</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatAverageScore(averageScore)}</p>
          <p className="mt-1 text-xs text-slate-500">Minimum lulus: {formatAverageScore(minimumPassScore)}</p>
          <div className="bb-progress-track mt-2 h-2">
            <div className="bb-progress-fill h-2 transition-[width] duration-700 ease-out" style={{ width: `${averageScorePercent}%` }} />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Objective wajib</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {doneObjectives}/{totalObjectives}
          </p>
          <p className="mt-1 text-xs text-slate-500">Turn: {sessionTurnCount}/{targetTurns}</p>
          <div className="bb-progress-track mt-2 h-2">
            <div className="bb-progress-fill h-2 transition-[width] duration-700 ease-out" style={{ width: `${objectivePercent}%` }} />
          </div>
        </div>
      </div>

      <div
        className={[
          "bb-state-enter rounded-2xl border px-4 py-3",
          completionSummary.tone === "success"
            ? "bb-celebrate-subtle bb-state-success"
            : completionSummary.tone === "warning"
              ? "bb-state-warning"
              : "bb-state-info",
        ].join(" ")}
      >
        <p
          className={[
            "text-sm font-semibold",
            completionSummary.tone === "success"
              ? "text-emerald-900"
              : completionSummary.tone === "warning"
                ? "text-amber-900"
                : "text-slate-800",
          ].join(" ")}
        >
          {completionSummary.headline}
        </p>
        <p className="mt-1 text-sm text-slate-700">{completionSummary.detail}</p>
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
        <div className="bb-celebrate-subtle bb-state-enter space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
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

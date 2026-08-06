"use client";

import { useMemo, useState, useTransition } from "react";
import { CaseExplorer } from "@/components/case/CaseExplorer";
import { SpeakingSession } from "@/components/practice/SpeakingSession";
import { WritingSession } from "@/components/practice/WritingSession";
import type { GeneratedCoachTurn, LearningCaseVersion, ObjectiveCode } from "@/types/learning";
import {
  completePracticeSessionAction,
  evaluateWritingAction,
  startPracticeSessionAction,
  submitPracticeTurnAction,
} from "./actions";

type PracticeWorkspaceProps = {
  cases: LearningCaseVersion[];
};

export function PracticeWorkspace({ cases }: PracticeWorkspaceProps) {
  const [activeCaseId, setActiveCaseId] = useState<number | null>(cases[0]?.id ?? null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [targetTurns, setTargetTurns] = useState(6);
  const [mode, setMode] = useState<"speaking" | "writing">("speaking");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeCase = useMemo(
    () => cases.find((item) => item.id === activeCaseId) ?? null,
    [activeCaseId, cases],
  );

  function ensureSession() {
    if (!activeCaseId) return;
    if (sessionId) return;

    startTransition(async () => {
      const result = await startPracticeSessionAction({
        caseVersionId: activeCaseId,
        mode: "speaking",
        targetTurns,
      });
      if (result.error) {
        setSessionError(result.error);
        return;
      }
      if (!result.sessionId) {
        setSessionError("Session ID tidak tersedia.");
        return;
      }
      setSessionId(result.sessionId);
      setSessionError(null);
    });
  }

  async function handleSubmitTurn(payload: {
    transcript: string;
    objectiveCode: ObjectiveCode | null;
    turnNumber: number;
  }): Promise<GeneratedCoachTurn | null> {
    if (!activeCaseId) return null;
    let workingSessionId = sessionId;

    if (!workingSessionId) {
      const startResult = await startPracticeSessionAction({
        caseVersionId: activeCaseId,
        mode: "speaking",
        targetTurns,
      });
      if (startResult.error) {
        setSessionError(startResult.error);
        return null;
      }
      if (!startResult.sessionId) {
        setSessionError("Session ID tidak tersedia.");
        return null;
      }
      workingSessionId = startResult.sessionId;
      setSessionId(startResult.sessionId);
    }
    if (!workingSessionId) return null;

    const submissionResult = await submitPracticeTurnAction({
      sessionId: workingSessionId,
      transcript: payload.transcript,
      objectiveCode: payload.objectiveCode,
      turnNumber: payload.turnNumber,
      inputType: "voice",
    });

    if (submissionResult.error) {
      setSessionError(submissionResult.error);
      return null;
    }

    return submissionResult.generatedTurn;
  }

  async function handleEvaluateWriting(text: string) {
    if (!activeCaseId) return null;
    const result = await evaluateWritingAction({ caseVersionId: activeCaseId, text });
    if (result.error) {
      setSessionError(result.error);
      return null;
    }
    return result.feedback ?? null;
  }

  async function finishSession() {
    if (!sessionId) return;
    const result = await completePracticeSessionAction({ sessionId, reason: "manual" });
    if ("error" in result && result.error) {
      setSessionError(result.error);
      return;
    }
    setSessionId(null);
  }

  return (
    <div className="space-y-4">
      <CaseExplorer
        cases={cases}
        activeCaseId={activeCaseId}
        onSelectCase={(caseVersionId) => {
          setActiveCaseId(caseVersionId);
          setSessionId(null);
          setSessionError(null);
        }}
      />

      <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setMode("speaking")}
          className={[
            "rounded-xl px-3 py-2 text-sm font-semibold",
            mode === "speaking" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          Speaking
        </button>
        <button
          type="button"
          onClick={() => setMode("writing")}
          className={[
            "rounded-xl px-3 py-2 text-sm font-semibold",
            mode === "writing" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
          ].join(" ")}
        >
          Writing
        </button>

        <div className="ml-auto flex items-center gap-2">
          {[4, 6, 8].map((turnLimit) => (
            <button
              key={turnLimit}
              type="button"
              onClick={() => setTargetTurns(turnLimit)}
              className={[
                "rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                targetTurns === turnLimit ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700",
              ].join(" ")}
            >
              {turnLimit} turns
            </button>
          ))}
        </div>
      </section>

      {sessionError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{sessionError}</p> : null}

      {activeCase ? (
        <>
          {mode === "speaking" ? (
            <SpeakingSession activeCase={activeCase} onSubmitTurn={handleSubmitTurn} />
          ) : (
            <WritingSession activeCase={activeCase} onEvaluate={handleEvaluateWriting} />
          )}
        </>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={ensureSession}
          disabled={isPending || !activeCaseId}
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Preparing..." : "Start session"}
        </button>
        <button
          type="button"
          onClick={finishSession}
          disabled={!sessionId}
          className="rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          End session
        </button>
      </div>
    </div>
  );
}

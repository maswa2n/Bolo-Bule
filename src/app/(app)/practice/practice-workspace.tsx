"use client";

import { useMemo, useState } from "react";
import { CaseExplorer } from "@/components/case/CaseExplorer";
import { SpeakingSession } from "@/components/practice/SpeakingSession";
import { WritingSession } from "@/components/practice/WritingSession";
import type {
  ConversationLogMessage,
  EvaluatorResult,
  GeneratedCoachTurn,
  LearningCaseVersion,
  LearningCompletionStatus,
  ObjectiveCode,
} from "@/types/learning";
import {
  completePracticeSessionAction,
  evaluateWritingAction,
  revisePracticeContextAction,
  startPracticeSessionAction,
  submitPracticeTurnAction,
} from "./actions";

type PracticeWorkspaceProps = {
  cases: LearningCaseVersion[];
};

type PracticeTurnSubmissionResult = {
  generatedTurn: GeneratedCoachTurn | null;
  evaluation: EvaluatorResult;
  session: {
    completionEligible: boolean;
    completionStatus: LearningCompletionStatus;
    averageScore: number;
    coveredObjectives: string[];
  };
};

export function PracticeWorkspace({ cases }: PracticeWorkspaceProps) {
  const [activeCaseId, setActiveCaseId] = useState<number | null>(cases[0]?.id ?? null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [targetTurns, setTargetTurns] = useState(6);
  const [mode, setMode] = useState<"speaking" | "writing">("speaking");
  const [sessionError, setSessionError] = useState<string | null>(null);

  const activeCase = useMemo(
    () => cases.find((item) => item.id === activeCaseId) ?? null,
    [activeCaseId, cases],
  );

  async function handleSubmitTurn(payload: {
    transcript: string;
    objectiveCode: ObjectiveCode | null;
    turnNumber: number;
    learnerContext: string;
    conversationHistory: ConversationLogMessage[];
  }): Promise<PracticeTurnSubmissionResult | null> {
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
      learnerContext: payload.learnerContext,
      conversationHistory: payload.conversationHistory,
    });

    if (submissionResult.error) {
      setSessionError(submissionResult.error);
      return null;
    }

    if (!submissionResult.evaluation || !submissionResult.session) {
      setSessionError("Respons evaluasi sesi tidak lengkap.");
      return null;
    }

    return {
      generatedTurn: submissionResult.generatedTurn,
      evaluation: submissionResult.evaluation,
      session: submissionResult.session,
    };
  }

  async function handleReviseContext(payload: {
    learnerContext: string;
    conversationHistory: ConversationLogMessage[];
    objectiveCode: ObjectiveCode | null;
  }): Promise<{ generatedTurn: GeneratedCoachTurn | null; contextApplied?: string } | null> {
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

    const revisionResult = await revisePracticeContextAction({
      sessionId: workingSessionId,
      learnerContext: payload.learnerContext,
      conversationHistory: payload.conversationHistory,
      objectiveCode: payload.objectiveCode,
    });

    if (revisionResult.error) {
      setSessionError(revisionResult.error);
      return null;
    }

    if (!revisionResult.generatedTurn) {
      setSessionError("Revisi context gagal menghasilkan respons coach.");
      return null;
    }

    setSessionError(null);
    return {
      generatedTurn: revisionResult.generatedTurn,
      contextApplied: revisionResult.contextApplied,
    };
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

      <section className="bb-glass-panel bb-motion-rise bb-motion-delay-1 rounded-2xl p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setMode("speaking")}
              className={[
                "bb-interactive-lift bb-press-depth bb-tap-target rounded-xl px-3 py-2 text-sm font-semibold",
                mode === "speaking" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              Speaking
            </button>
            <button
              type="button"
              onClick={() => setMode("writing")}
              className={[
                "bb-interactive-lift bb-press-depth bb-tap-target rounded-xl px-3 py-2 text-sm font-semibold",
                mode === "writing" ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              ].join(" ")}
            >
              Writing
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-1">
            {[4, 6, 8].map((turnLimit) => (
              <button
                key={turnLimit}
                type="button"
                onClick={() => setTargetTurns(turnLimit)}
                className={[
                  "bb-interactive-lift bb-press-depth bb-tap-target rounded-lg px-2.5 py-1.5 text-xs font-semibold",
                  targetTurns === turnLimit ? "bg-slate-800 text-white" : "bg-white text-slate-700",
                ].join(" ")}
              >
                {turnLimit} turns
              </button>
            ))}
          </div>
        </div>
      </section>

      {sessionError ? <p className="bb-state-enter bb-state-error rounded-xl px-3 py-2 text-sm">{sessionError}</p> : null}

      {activeCase ? (
        <>
          {mode === "speaking" ? (
            <SpeakingSession
              activeCase={activeCase}
              targetTurns={targetTurns}
              onSubmitTurn={handleSubmitTurn}
              onReviseContext={handleReviseContext}
            />
          ) : (
            <WritingSession activeCase={activeCase} onEvaluate={handleEvaluateWriting} />
          )}
        </>
      ) : null}

      <div className="sm:flex sm:items-center">
        <button
          type="button"
          onClick={finishSession}
          disabled={!sessionId}
          className="bb-btn-secondary bb-press-depth bb-tap-target w-full px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          End session
        </button>
      </div>
    </div>
  );
}

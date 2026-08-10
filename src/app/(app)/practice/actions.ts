"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateNextCoachTurn } from "@/lib/ai/conversation-generator";
import { buildCaseSummary, requestPracticeCoachTurn } from "@/lib/ai/ollama-practice-coach";
import { evaluateWritingResponse } from "@/lib/ai/response-evaluator";
import {
  completeLearningSession,
  getPublishedCaseByVersionId,
  getSessionSnapshot,
  listPublishedCases,
  startLearningSession,
  submitLearningTurn,
  updateLearningTurnCoachOutput,
} from "@/lib/learning/case-repository";
import { getNextConversationAction } from "@/lib/learning/conversation-state-machine";
import { updateUserMasteryAfterTurn } from "@/lib/learning/mastery-updater";
import { evaluateSessionTurn } from "@/lib/learning/response-evaluator";
import type { ConversationLogMessage, GeneratedCoachTurn, ObjectiveCode } from "@/types/learning";

type StartPayload = {
  caseVersionId: number;
  mode: "speaking" | "writing";
  targetTurns: number;
};

type SubmitTurnPayload = {
  sessionId: number;
  transcript: string;
  objectiveCode: ObjectiveCode | null;
  turnNumber: number;
  inputType: "voice" | "text";
  learnerContext: string;
  conversationHistory: ConversationLogMessage[];
};

type ReviseContextPayload = {
  sessionId: number;
  learnerContext: string;
  conversationHistory: ConversationLogMessage[];
  objectiveCode: ObjectiveCode | null;
};

export async function getPublishedCasesAction() {
  return listPublishedCases();
}

export async function startPracticeSessionAction(payload: StartPayload) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const learnerId = user?.id ?? "00000000-0000-0000-0000-000000000000";
    const sessionId = await startLearningSession({
      learnerId,
      caseVersionId: payload.caseVersionId,
      mode: payload.mode,
      targetTurns: payload.targetTurns,
    });

    return { sessionId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal memulai sesi." };
  }
}

export async function submitPracticeTurnAction(payload: SubmitTurnPayload) {
  try {
    const evaluation = evaluateSessionTurn(payload.transcript, payload.objectiveCode);
    const snapshot = await getSessionSnapshot(payload.sessionId);
    const saveResult = await submitLearningTurn({
      sessionId: payload.sessionId,
      turnNumber: payload.turnNumber,
      transcript: payload.transcript,
      normalizedTranscript: payload.transcript.trim(),
      inputType: payload.inputType,
      objectiveCode: payload.objectiveCode,
      evaluation,
    });

    if (snapshot?.learnerId) {
      await updateUserMasteryAfterTurn({
        userId: snapshot.learnerId,
        objectiveCode: payload.objectiveCode,
        evaluator: evaluation,
      });
    }

    const activeCase = snapshot ? await getPublishedCaseByVersionId(snapshot.caseVersionId) : null;
    const machineTurn =
      snapshot && activeCase
        ? getNextConversationAction({
            session: {
              ...snapshot,
              completionStatus: saveResult.completionStatus,
              averageScore: saveResult.averageScore,
              coveredObjectives: saveResult.coveredObjectives,
              turnCount: payload.turnNumber,
              completionEligible: saveResult.completionEligible,
            },
            activeCase,
            lastUserTranscript: payload.transcript,
            lastObjectiveCode: payload.objectiveCode,
            objectiveDetected: evaluation.objectivesDetected.length > 0,
            objectiveCompleted: evaluation.objectivesCompleted.length > 0,
          })
        : null;

    const llmResult =
      snapshot && activeCase
        ? await requestPracticeCoachTurn({
            transcript: payload.transcript,
            objectiveCode: payload.objectiveCode,
            recommendedAction: machineTurn?.action ?? evaluation.recommendedNextAction,
            completionEligible: saveResult.completionEligible,
            learnerContext: payload.learnerContext,
            conversationHistory: payload.conversationHistory,
            activeCase: buildCaseSummary(activeCase),
          })
        : {
            generatedTurn: null,
            metadata: {
              provider: "fallback",
              model: "state-machine",
              latencyMs: null,
              tokenUsage: null,
              fallbackUsed: true,
            },
          };

    const generatedTurn = await generateNextCoachTurn({
      transcript: payload.transcript,
      objectiveCode: payload.objectiveCode,
      recommendedAction: machineTurn?.action ?? evaluation.recommendedNextAction,
      completionEligible: saveResult.completionEligible,
      llmGeneratedTurn: llmResult.generatedTurn,
    });

    try {
      await updateLearningTurnCoachOutput({
        sessionId: payload.sessionId,
        turnNumber: payload.turnNumber,
        coachResponse: generatedTurn.coachMessageEn,
        modelName: llmResult.metadata.fallbackUsed
          ? "state-machine-fallback"
          : `${llmResult.metadata.provider}:${llmResult.metadata.model}`,
        latencyMs: llmResult.metadata.latencyMs,
        tokenUsage: llmResult.metadata.tokenUsage ?? {},
      });
    } catch {
      // Coach metadata persistence must not block the learner's speaking flow.
    }

    return {
      generatedTurn,
      evaluation,
      llm: llmResult.metadata,
      session: {
        completionEligible: saveResult.completionEligible,
        completionStatus: saveResult.completionStatus,
        averageScore: saveResult.averageScore,
        coveredObjectives: saveResult.coveredObjectives,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal memproses jawaban sesi.",
      generatedTurn: null as GeneratedCoachTurn | null,
    };
  }
}

export async function revisePracticeContextAction(payload: ReviseContextPayload) {
  try {
    const trimmedContext = payload.learnerContext.trim();
    if (!trimmedContext) {
      return { error: "Context practice kosong." };
    }

    const snapshot = await getSessionSnapshot(payload.sessionId);
    if (!snapshot) {
      return { error: "Sesi tidak ditemukan." };
    }

    const activeCase = await getPublishedCaseByVersionId(snapshot.caseVersionId);
    if (!activeCase) {
      return { error: "Case tidak ditemukan." };
    }

    const lastUserMessage =
      [...payload.conversationHistory].reverse().find((item) => item.role === "user")?.message.trim() ?? "";

    const machineTurn = getNextConversationAction({
      session: snapshot,
      activeCase,
      lastUserTranscript: lastUserMessage,
      lastObjectiveCode: payload.objectiveCode,
      objectiveDetected: false,
      objectiveCompleted: false,
    });

    const llmResult = await requestPracticeCoachTurn({
      transcript: lastUserMessage || "[Learner revised practice context]",
      objectiveCode: payload.objectiveCode,
      recommendedAction: machineTurn.action,
      completionEligible: snapshot.completionEligible,
      learnerContext: trimmedContext,
      conversationHistory: payload.conversationHistory,
      activeCase: buildCaseSummary(activeCase),
    });

    const generatedTurn = await generateNextCoachTurn({
      transcript: lastUserMessage,
      objectiveCode: payload.objectiveCode,
      recommendedAction: machineTurn.action,
      completionEligible: snapshot.completionEligible,
      llmGeneratedTurn: llmResult.generatedTurn,
    });

    return {
      generatedTurn,
      contextApplied: trimmedContext,
      llm: llmResult.metadata,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal menerapkan revisi context.",
      generatedTurn: null as GeneratedCoachTurn | null,
    };
  }
}

export async function evaluateWritingAction(payload: { caseVersionId: number; text: string }) {
  try {
    const feedback = await evaluateWritingResponse({
      caseVersionId: payload.caseVersionId,
      text: payload.text,
    });
    return { feedback };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal mengevaluasi writing." };
  }
}

export async function completePracticeSessionAction(payload: { sessionId: number; reason: string }) {
  try {
    const result = await completeLearningSession(payload);
    revalidatePath("/today");
    revalidatePath("/learn");
    revalidatePath("/practice");
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Gagal menutup sesi." };
  }
}

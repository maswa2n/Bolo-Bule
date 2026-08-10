import { DEFAULT_PASS_SCORE } from "@/lib/learning/contracts";
import type {
  ConversationNextAction,
  GeneratedCoachTurn,
  LearningCaseVersion,
  LearningSessionState,
  ObjectiveCode,
} from "@/types/learning";

type StateMachineInput = {
  session: LearningSessionState;
  activeCase: LearningCaseVersion;
  lastUserTranscript: string;
  lastObjectiveCode: ObjectiveCode | null;
  objectiveDetected: boolean;
  objectiveCompleted: boolean;
};

function nextUncoveredObjective(
  objectives: LearningCaseVersion["objectives"],
  covered: string[],
): ObjectiveCode | null {
  for (const objective of objectives) {
    if (!covered.includes(objective.objectiveCode)) return objective.objectiveCode;
  }
  return null;
}

export function getNextConversationAction(input: StateMachineInput): GeneratedCoachTurn {
  const missingObjective = nextUncoveredObjective(input.activeCase.objectives, input.session.coveredObjectives);

  let action: ConversationNextAction = "PROBE_OBJECTIVE";
  let targetObjective: ObjectiveCode | null = missingObjective ?? input.lastObjectiveCode;
  let reasonCode = "DEFAULT_PROBE";
  let completionEligible = false;
  let difficultyAdjustment: GeneratedCoachTurn["difficultyAdjustment"] = "maintain";

  const userText = input.lastUserTranscript.toLowerCase();
  const passScore = input.activeCase.conversationPolicy.minimumPassScore ?? DEFAULT_PASS_SCORE;
  const requiredObjectives = input.activeCase.objectives.filter((objective) => objective.required);
  const requiredCount = Math.max(1, requiredObjectives.length);
  const requiredRatio = input.activeCase.conversationPolicy.requiredObjectiveCompletion ?? 1;
  const minimumRequiredCompleted =
    requiredRatio <= 1
      ? Math.ceil(requiredCount * requiredRatio)
      : Math.min(requiredCount, Math.floor(requiredRatio));
  const coveredRequiredCount = input.session.coveredObjectives.filter((code) =>
    requiredObjectives.some((objective) => objective.objectiveCode === code),
  ).length;
  const objectiveDone = coveredRequiredCount >= minimumRequiredCompleted;
  const targetReached = input.session.turnCount >= input.session.targetTurns;
  const qualityReached = input.session.averageScore >= passScore;
  const persistedPassed = input.session.completionStatus === "passed" || input.session.completionEligible;
  const persistedTerminalWithoutPass = [
    "completed_with_remedial",
    "manually_ended",
    "abandoned",
    "system_terminated",
  ].includes(input.session.completionStatus);

  if (persistedPassed || (objectiveDone && targetReached && qualityReached)) {
    action = "COMPLETE_SESSION";
    reasonCode = persistedPassed ? "PERSISTED_COMPLETION_STATUS" : "COMPLETION_CRITERIA_MET";
    targetObjective = null;
    completionEligible = true;
  } else if (persistedTerminalWithoutPass) {
    action = "SUMMARIZE";
    reasonCode = "PERSISTED_TERMINAL_STATUS";
    completionEligible = false;
  } else if (input.session.turnCount >= input.session.maximumTurns) {
    action = "SUMMARIZE";
    reasonCode = "MAX_TURN_REACHED";
    completionEligible = false;
  } else if (!input.objectiveDetected) {
    action = "CLARIFY_USER_RESPONSE";
    reasonCode = "OBJECTIVE_NOT_DETECTED";
    difficultyAdjustment = "decrease";
  } else if (!input.objectiveCompleted) {
    action = "PROBE_OBJECTIVE";
    reasonCode = "OBJECTIVE_PARTIAL";
  } else if (/\b(unclear|not sure|confuse|don't understand)\b/i.test(userText)) {
    action = "REMEDIATE_LANGUAGE";
    reasonCode = "LEARNER_SIGNAL_CONFUSION";
    difficultyAdjustment = "decrease";
  } else if (input.session.averageScore >= 82 && input.session.turnCount >= 3) {
    action = "CHALLENGE_USER";
    reasonCode = "PROGRESSIVE_DIFFICULTY";
    difficultyAdjustment = "increase";
  } else {
    action = "INTRODUCE_NEW_INFORMATION";
    reasonCode = "KEEP_PROGRESSING";
  }

  const objectiveLabel = targetObjective ?? "GENERAL";
  const coachMessageEn =
    action === "COMPLETE_SESSION"
      ? "You have covered all required objectives. Please summarize your final commitment."
      : action === "REMEDIATE_LANGUAGE"
        ? "Let's simplify this. Please answer with one clear sentence: status, action, and timeline."
        : action === "CHALLENGE_USER"
          ? `Good progress. Now respond to an objection while still covering ${objectiveLabel}.`
          : action === "CLARIFY_USER_RESPONSE"
            ? `Could you restate your point more clearly and directly address ${objectiveLabel}?`
            : `Please continue and focus on ${objectiveLabel}.`;

  const coachMessageId =
    action === "COMPLETE_SESSION"
      ? "Semua objective wajib telah tercapai. Silakan rangkum komitmen final Anda."
      : action === "REMEDIATE_LANGUAGE"
        ? "Mari kita sederhanakan. Jawab dengan satu kalimat jelas: status, tindakan, dan timeline."
        : action === "CHALLENGE_USER"
          ? `Bagus. Sekarang tanggapi keberatan sambil tetap menutup objective ${objectiveLabel}.`
          : action === "CLARIFY_USER_RESPONSE"
            ? `Bisa ulang dengan lebih jelas dan langsung ke objective ${objectiveLabel}?`
            : `Silakan lanjutkan dan fokus ke objective ${objectiveLabel}.`;

  return {
    action,
    targetObjective,
    coachMessageEn,
    coachMessageId,
    responseSupport: [
      "Could you confirm the latest status first?",
      "This is affecting our operations, so we need a clear commitment.",
      "Please provide the follow-up time and communication channel.",
    ],
    difficultyAdjustment,
    reasonCode,
    completionEligible,
  };
}

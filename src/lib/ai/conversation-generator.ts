import { generatedCoachTurnSchema } from "@/lib/ai/schema-validators";
import type { ConversationNextAction, GeneratedCoachTurn, ObjectiveCode } from "@/types/learning";

type GeneratorInput = {
  transcript: string;
  objectiveCode: ObjectiveCode | null;
  recommendedAction: ConversationNextAction;
  completionEligible: boolean;
  llmGeneratedTurn?: GeneratedCoachTurn | null;
};

function fallbackGenerate(input: GeneratorInput): GeneratedCoachTurn {
  const objective = input.objectiveCode ?? "PRIMARY_OBJECTIVE";
  const action = input.completionEligible ? "COMPLETE_SESSION" : input.recommendedAction;

  return {
    action,
    targetObjective: input.completionEligible ? null : objective,
    coachMessageEn: input.completionEligible
      ? "Great work. Please summarize your final commitment before we close this session."
      : `Please continue and focus on ${objective}.`,
    coachMessageId: input.completionEligible
      ? "Bagus. Silakan rangkum komitmen akhir Anda sebelum sesi ditutup."
      : `Silakan lanjutkan dan fokus pada objective ${objective}.`,
    responseSupport: input.completionEligible
      ? [
          "I confirm the final commitment and timeline.",
          "I will follow up at the agreed time.",
          "I understand the next action and ownership.",
        ]
      : [
          "Could you confirm the latest status first?",
          "This delay is affecting operations and needs a clear commitment.",
          "Please provide the next update time and channel.",
        ],
    difficultyAdjustment: "maintain",
    reasonCode: input.completionEligible ? "COMPLETION_ELIGIBLE" : "OBJECTIVE_CONTINUATION",
    completionEligible: input.completionEligible,
  };
}

export async function generateNextCoachTurn(input: GeneratorInput): Promise<GeneratedCoachTurn> {
  if (input.llmGeneratedTurn) {
    const llmValidated = generatedCoachTurnSchema.safeParse(input.llmGeneratedTurn);
    if (llmValidated.success) {
      if (input.completionEligible) {
        return {
          ...llmValidated.data,
          action: "COMPLETE_SESSION",
          targetObjective: null,
          completionEligible: true,
          reasonCode: "COMPLETION_ELIGIBLE",
        };
      }
      return llmValidated.data;
    }
  }

  const fallback = fallbackGenerate(input);
  const validated = generatedCoachTurnSchema.safeParse(fallback);
  if (!validated.success) {
    return fallbackGenerate({
      ...input,
      recommendedAction: "CLARIFY_USER_RESPONSE",
    });
  }

  return validated.data;
}

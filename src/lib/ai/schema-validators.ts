import { z } from "zod";

export const conversationNextActionSchema = z.enum([
  "PROBE_OBJECTIVE",
  "CLARIFY_USER_RESPONSE",
  "CHALLENGE_USER",
  "INTRODUCE_NEW_INFORMATION",
  "REQUEST_SPECIFIC_COMMITMENT",
  "REMEDIATE_LANGUAGE",
  "CONFIRM_UNDERSTANDING",
  "SUMMARIZE",
  "COMPLETE_SESSION",
]);

export const difficultyAdjustmentSchema = z.enum(["increase", "decrease", "maintain"]);

export const generatedCoachTurnSchema = z.object({
  action: conversationNextActionSchema,
  targetObjective: z.string().nullable(),
  coachMessageEn: z.string().min(1),
  coachMessageId: z.string().min(1),
  responseSupport: z.array(z.string().min(1)).min(1),
  difficultyAdjustment: difficultyAdjustmentSchema,
  reasonCode: z.string().min(1),
  completionEligible: z.boolean(),
});

export const conversationLogMessageSchema = z.object({
  role: z.enum(["coach", "user"]),
  message: z.string().min(1),
});

export const practiceCoachGatewayResponseSchema = z.object({
  generatedTurn: generatedCoachTurnSchema,
  provider: z.string().min(1),
  model: z.string().min(1),
  latencyMs: z.number().int().nonnegative().nullable(),
  tokenUsage: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const caseCandidateDraftSchema = z.object({
  titleEn: z.string().min(1),
  titleId: z.string().min(1),
  scenarioEn: z.string().min(1),
  scenarioId: z.string().min(1),
  communicationGoal: z.string().min(1),
  objectives: z.array(
    z.object({
      objectiveCode: z.string().min(1),
      description: z.string().min(1),
      required: z.boolean(),
      weight: z.number().min(0).max(100),
      sortOrder: z.number().int().min(1),
    }),
  ),
  turnTemplates: z.array(
    z.object({
      turnNumber: z.number().int().min(1),
      objectiveCode: z.string().nullable(),
      coachMessageEn: z.string().min(1),
      coachMessageId: z.string().min(1),
      responseSupport: z.array(z.string().min(1)).min(1),
    }),
  ),
  languageTargets: z.object({
    grammar: z.array(z.string().min(1)),
    vocabulary: z.array(z.string().min(1)),
    functionalLanguage: z.array(z.string().min(1)),
  }),
});

export const writingFeedbackSchema = z.object({
  improvedText: z.string().min(1),
  lesson: z.string().min(1),
  scores: z.object({
    taskCompletion: z.number().min(0).max(100),
    grammar: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    professionalTone: z.number().min(0).max(100),
  }),
});

export type GeneratedCoachTurnParsed = z.infer<typeof generatedCoachTurnSchema>;
export type WritingFeedbackParsed = z.infer<typeof writingFeedbackSchema>;
export type PracticeCoachGatewayResponseParsed = z.infer<typeof practiceCoachGatewayResponseSchema>;
export type CaseCandidateDraftParsed = z.infer<typeof caseCandidateDraftSchema>;

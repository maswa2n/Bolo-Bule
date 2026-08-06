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

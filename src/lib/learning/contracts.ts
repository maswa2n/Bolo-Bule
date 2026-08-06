import type {
  ConversationNextAction,
  DifficultyAdjustment,
  LearningCompletionStatus,
} from "@/types/learning";

export const CONVERSATION_ACTIONS: ConversationNextAction[] = [
  "PROBE_OBJECTIVE",
  "CLARIFY_USER_RESPONSE",
  "CHALLENGE_USER",
  "INTRODUCE_NEW_INFORMATION",
  "REQUEST_SPECIFIC_COMMITMENT",
  "REMEDIATE_LANGUAGE",
  "CONFIRM_UNDERSTANDING",
  "SUMMARIZE",
  "COMPLETE_SESSION",
];

export const SESSION_COMPLETION_STATUSES: LearningCompletionStatus[] = [
  "in_progress",
  "passed",
  "completed_with_remedial",
  "manually_ended",
  "abandoned",
  "system_terminated",
];

export const DIFFICULTY_ADJUSTMENTS: DifficultyAdjustment[] = [
  "increase",
  "decrease",
  "maintain",
];

export const DEFAULT_PASS_SCORE = 70;

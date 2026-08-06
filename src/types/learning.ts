export type BilingualText = {
  en: string;
  id: string;
};

export type LearningMode = "speaking" | "writing";

export type CaseLifecycleStatus =
  | "draft"
  | "review"
  | "approved"
  | "published"
  | "retired"
  | "generated_candidate";

export type CandidateLifecycleStatus =
  | "generated_candidate"
  | "pass_auto_validation"
  | "needs_revision"
  | "rejected"
  | "ready_for_human_review"
  | "approved";

export type LearningCompletionStatus =
  | "in_progress"
  | "passed"
  | "completed_with_remedial"
  | "manually_ended"
  | "abandoned"
  | "system_terminated";

export type DifficultyAdjustment = "increase" | "decrease" | "maintain";

export type ConversationNextAction =
  | "PROBE_OBJECTIVE"
  | "CLARIFY_USER_RESPONSE"
  | "CHALLENGE_USER"
  | "INTRODUCE_NEW_INFORMATION"
  | "REQUEST_SPECIFIC_COMMITMENT"
  | "REMEDIATE_LANGUAGE"
  | "CONFIRM_UNDERSTANDING"
  | "SUMMARIZE"
  | "COMPLETE_SESSION";

export type ObjectiveCode = string;

export type CaseObjective = {
  objectiveCode: ObjectiveCode;
  description: string;
  required: boolean;
  weight: number;
};

export type CaseTurnTemplate = {
  turnNumber: number;
  objectiveCode: ObjectiveCode | null;
  coachMessageEn: string;
  coachMessageId: string;
  responseSupport: string[];
};

export type CaseLanguageTargets = {
  grammar: string[];
  vocabulary: string[];
  functionalLanguage: string[];
};

export type CaseConversationPolicy = {
  minimumUserTurns: number;
  targetUserTurns: number;
  maximumUserTurns: number;
  minimumPassScore: number;
  requiredObjectiveCompletion: number;
  allowRemedialTurns: boolean;
};

export type LearningCaseVersion = {
  id: number;
  caseId: string;
  versionNumber: number;
  status: CaseLifecycleStatus;
  title: BilingualText;
  domain: string;
  subdomain: string;
  workFunction: string;
  internalLevel: string;
  cefrLevel: string;
  userRole: string;
  counterpartRole: string;
  scenario: BilingualText;
  communicationGoal: string;
  conversationPolicy: CaseConversationPolicy;
  contentSource: string;
  objectives: CaseObjective[];
  languageTargets: CaseLanguageTargets;
  turns: CaseTurnTemplate[];
};

export type LearningSessionState = {
  sessionId: number;
  caseVersionId: number;
  learnerId: string;
  mode: LearningMode;
  completionStatus: LearningCompletionStatus;
  turnCount: number;
  targetTurns: number;
  maximumTurns: number;
  coveredObjectives: ObjectiveCode[];
  uncoveredObjectives: ObjectiveCode[];
  averageScore: number;
  difficultyAdjustment: DifficultyAdjustment;
  completionEligible: boolean;
};

export type SessionPlanInput = {
  learnerId: string;
  preferredDomain?: string;
  preferredDifficulty?: string;
  durationMinutes?: number;
};

export type SessionPlanOutput = {
  selectedCaseVersionId: number;
  recommendationScore: number;
  reason: string;
};

export type TurnSubmissionInput = {
  sessionId: number;
  turnNumber: number;
  transcript: string;
  normalizedTranscript: string;
  objectiveCode: ObjectiveCode | null;
  inputType: "voice" | "text";
};

export type EvaluatorScores = {
  taskCompletion: number;
  grammar: number;
  clarity: number;
  professionalTone: number;
  vocabulary: number;
  fluency: number;
};

export type EvaluatorFinding = {
  errorCode: string;
  original: string;
  corrected: string;
  explanationId: string;
};

export type EvaluatorResult = {
  scores: EvaluatorScores;
  overallScore: number;
  objectivesDetected: ObjectiveCode[];
  objectivesCompleted: ObjectiveCode[];
  grammarFindings: EvaluatorFinding[];
  responseRelevance: "relevant" | "partially_relevant" | "irrelevant";
  needsClarification: boolean;
  recommendedNextAction: ConversationNextAction;
};

export type GeneratedCoachTurn = {
  action: ConversationNextAction;
  targetObjective: ObjectiveCode | null;
  coachMessageEn: string;
  coachMessageId: string;
  responseSupport: string[];
  difficultyAdjustment: DifficultyAdjustment;
  reasonCode: string;
  completionEligible: boolean;
};

export type CaseCandidateValidationSummary = {
  schemaValid: boolean;
  duplicateCheckPassed: boolean;
  semanticSimilarityPassed: boolean;
  levelConsistencyPassed: boolean;
  bilingualConsistencyPassed: boolean;
  grammarPassed: boolean;
  objectiveCompletenessPassed: boolean;
  professionalRealismPassed: boolean;
  prohibitedContentPassed: boolean;
  privacyCheckPassed: boolean;
};

import { createClient } from "@/lib/supabase/server";
import { seedCaseBank } from "@/lib/learning/seed-case-bank";
import type {
  CandidateLifecycleStatus,
  EvaluatorResult,
  LearningCaseVersion,
  LearningCompletionStatus,
  LearningMode,
  ObjectiveCode,
  TurnSubmissionInput,
} from "@/types/learning";

type PublishedCaseRow = {
  id: number;
  case_id: number;
  version_number: number;
  status: string;
  title_en: string;
  title_id: string;
  scenario_en: string;
  scenario_id: string;
  internal_level: string;
  cefr_level: string;
  user_role: string;
  counterpart_role: string;
  communication_goal: string;
  content_source: string;
  conversation_policy: {
    minimum_user_turns?: number;
    target_user_turns?: number;
    maximum_user_turns?: number;
    minimum_pass_score?: number;
    required_objective_completion?: number;
    allow_remedial_turns?: boolean;
  } | null;
  learning_cases: {
    case_code: string;
    domain: string;
    subdomain: string | null;
    work_function: string | null;
  } | null;
  learning_case_objectives: Array<{
    objective_code: string;
    description: string;
    required: boolean;
    weight: number;
    sort_order: number;
  }> | null;
  learning_case_turn_templates: Array<{
    turn_number: number;
    objective_code: string | null;
    coach_message_en: string;
    coach_message_id: string;
    response_support: string[] | null;
  }> | null;
  learning_case_language_targets: Array<{
    grammar_targets: string[] | null;
    vocabulary_targets: string[] | null;
    functional_language: string[] | null;
  }> | null;
};

type SessionStartPayload = {
  learnerId: string;
  caseVersionId: number;
  mode: LearningMode;
  targetTurns: number;
};

type SessionSubmitPayload = {
  sessionId: number;
  turnNumber: number;
  transcript: string;
  normalizedTranscript: string;
  inputType: "voice" | "text";
  objectiveCode: ObjectiveCode | null;
  evaluation: EvaluatorResult;
};

type SessionSubmitResult = {
  completionEligible: boolean;
  completionStatus: LearningCompletionStatus;
  averageScore: number;
  coveredObjectives: string[];
};

type LooseRpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

type CaseCandidateSummary = {
  id: number;
  domain: string;
  workFunction: string;
  difficulty: string;
  communicationObjective: string;
  status: CandidateLifecycleStatus;
  titleEn: string;
  scenarioId: string;
};

function toLearningCase(row: PublishedCaseRow): LearningCaseVersion {
  const policy = row.conversation_policy ?? {};
  const targets = row.learning_case_language_targets?.[0];
  const baseCase = row.learning_cases;

  return {
    id: row.id,
    caseId: baseCase?.case_code ?? `CASE-${row.id}`,
    versionNumber: row.version_number,
    status: row.status as LearningCaseVersion["status"],
    title: { en: row.title_en, id: row.title_id },
    domain: baseCase?.domain ?? "general",
    subdomain: baseCase?.subdomain ?? "general",
    workFunction: baseCase?.work_function ?? "general",
    internalLevel: row.internal_level,
    cefrLevel: row.cefr_level,
    userRole: row.user_role,
    counterpartRole: row.counterpart_role,
    scenario: { en: row.scenario_en, id: row.scenario_id },
    communicationGoal: row.communication_goal,
    conversationPolicy: {
      minimumUserTurns: policy.minimum_user_turns ?? 4,
      targetUserTurns: policy.target_user_turns ?? 6,
      maximumUserTurns: policy.maximum_user_turns ?? 8,
      minimumPassScore: policy.minimum_pass_score ?? 70,
      requiredObjectiveCompletion: policy.required_objective_completion ?? 1,
      allowRemedialTurns: policy.allow_remedial_turns ?? true,
    },
    contentSource: row.content_source,
    objectives: (row.learning_case_objectives ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((objective) => ({
        objectiveCode: objective.objective_code,
        description: objective.description,
        required: objective.required,
        weight: Number(objective.weight),
      })),
    languageTargets: {
      grammar: targets?.grammar_targets ?? [],
      vocabulary: targets?.vocabulary_targets ?? [],
      functionalLanguage: targets?.functional_language ?? [],
    },
    turns: (row.learning_case_turn_templates ?? [])
      .sort((a, b) => a.turn_number - b.turn_number)
      .map((turn) => ({
        turnNumber: turn.turn_number,
        objectiveCode: turn.objective_code,
        coachMessageEn: turn.coach_message_en,
        coachMessageId: turn.coach_message_id,
        responseSupport: turn.response_support ?? [],
      })),
  };
}

export async function listPublishedCases(): Promise<LearningCaseVersion[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("learning_case_versions")
      .select(
        "id,case_id,version_number,status,title_en,title_id,scenario_en,scenario_id,internal_level,cefr_level,user_role,counterpart_role,communication_goal,content_source,conversation_policy,learning_cases(case_code,domain,subdomain,work_function),learning_case_objectives(objective_code,description,required,weight,sort_order),learning_case_turn_templates(turn_number,objective_code,coach_message_en,coach_message_id,response_support),learning_case_language_targets(grammar_targets,vocabulary_targets,functional_language)",
      )
      .eq("status", "published")
      .order("id", { ascending: true });

    if (error) {
      return seedCaseBank;
    }

    const rows = (data ?? []) as PublishedCaseRow[];
    if (rows.length === 0) return seedCaseBank;
    return rows.map(toLearningCase);
  } catch {
    return seedCaseBank;
  }
}

export async function getPublishedCaseByVersionId(caseVersionId: number): Promise<LearningCaseVersion | null> {
  const cases = await listPublishedCases();
  return cases.find((item) => item.id === caseVersionId) ?? null;
}

export async function getSessionSnapshot(sessionId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_sessions")
    .select(
      "id,user_id,case_version_id,mode,completion_status,turn_count,target_turns,max_turns,covered_objectives,uncovered_objectives,average_score,difficulty_state,completion_eligibility",
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as {
    id: number;
    user_id: string;
    case_version_id: number;
    mode: string;
    completion_status: string;
    turn_count: number;
    target_turns: number;
    max_turns: number;
    covered_objectives: string[] | null;
    uncovered_objectives: string[] | null;
    average_score: number | string | null;
    difficulty_state: "increase" | "decrease" | "maintain";
    completion_eligibility: boolean;
  };

  return {
    sessionId: row.id,
    learnerId: row.user_id,
    caseVersionId: row.case_version_id,
    mode: row.mode as LearningMode,
    completionStatus: row.completion_status as LearningCompletionStatus,
    turnCount: row.turn_count,
    targetTurns: row.target_turns,
    maximumTurns: row.max_turns,
    coveredObjectives: row.covered_objectives ?? [],
    uncoveredObjectives: row.uncovered_objectives ?? [],
    averageScore: Number(row.average_score ?? 0),
    difficultyAdjustment: row.difficulty_state,
    completionEligible: Boolean(row.completion_eligibility),
  };
}

export async function startLearningSession(payload: SessionStartPayload): Promise<number> {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("start_learning_session", {
    p_case_version_id: payload.caseVersionId,
    p_mode: payload.mode,
    p_target_turns: payload.targetTurns,
    p_difficulty: "maintain",
  });

  if (error) {
    throw new Error(error.message);
  }

  return Number(data);
}

export async function submitLearningTurn(payload: SessionSubmitPayload): Promise<SessionSubmitResult> {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("submit_learning_turn", {
    p_session_id: payload.sessionId,
    p_turn_number: payload.turnNumber,
    p_input_type: payload.inputType,
    p_raw_transcript: payload.transcript,
    p_normalized_transcript: payload.normalizedTranscript,
    p_target_objective: payload.objectiveCode,
    p_selected_action: payload.evaluation.recommendedNextAction,
    p_score_result: {
      task_completion: payload.evaluation.scores.taskCompletion,
      grammar: payload.evaluation.scores.grammar,
      clarity: payload.evaluation.scores.clarity,
      professional_tone: payload.evaluation.scores.professionalTone,
      vocabulary: payload.evaluation.scores.vocabulary,
      fluency: payload.evaluation.scores.fluency,
      overall_score: payload.evaluation.overallScore,
    },
    p_objective_result: {
      completed: payload.evaluation.objectivesCompleted.includes(payload.objectiveCode ?? ""),
      detected: payload.evaluation.objectivesDetected.includes(payload.objectiveCode ?? ""),
    },
    p_grammar_result: {
      findings: payload.evaluation.grammarFindings,
    },
    p_model_name: "structured-fallback",
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    completionEligible: Boolean(row?.completion_eligible),
    completionStatus: (row?.completion_status ?? "in_progress") as LearningCompletionStatus,
    averageScore: Number(row?.average_score ?? 0),
    coveredObjectives: Array.isArray(row?.covered_objectives) ? row.covered_objectives : [],
  };
}

export async function completeLearningSession(payload: { sessionId: number; reason: string }) {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("complete_learning_session", {
    p_session_id: payload.sessionId,
    p_reason: payload.reason,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    completionStatus: row?.completion_status ?? "manually_ended",
    averageScore: Number(row?.average_score ?? 0),
    coveredObjectives: row?.covered_objectives ?? [],
  };
}

export async function enqueueCaseCandidate(payload: {
  domain: string;
  workFunction: string;
  difficulty: string;
  communicationObjective: string;
}) {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("enqueue_case_candidate", {
    p_domain: payload.domain,
    p_work_function: payload.workFunction,
    p_difficulty: payload.difficulty,
    p_communication_objective: payload.communicationObjective,
    p_payload: {
      generated_at: new Date().toISOString(),
      source: "admin_console",
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { candidateId: Number(data) };
}

export async function publishCaseCandidate(candidateId: number) {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("publish_case_candidate", {
    p_candidate_id: candidateId,
  });

  if (error) {
    return { error: error.message };
  }

  return { caseVersionId: Number(data) };
}

export async function listCaseCandidates(): Promise<CaseCandidateSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("case_candidates")
      .select("id,domain,work_function,difficulty,communication_objective,status,title_en,scenario_id")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return [];
    const rows = (data ?? []) as Array<{
      id: number;
      domain: string;
      work_function: string;
      difficulty: string;
      communication_objective: string;
      status: string;
      title_en: string | null;
      scenario_id: string | null;
    }>;
    return rows.map((row) => ({
      id: row.id,
      domain: row.domain,
      workFunction: row.work_function,
      difficulty: row.difficulty,
      communicationObjective: row.communication_objective,
      status: row.status as CandidateLifecycleStatus,
      titleEn: row.title_en ?? "Generated Candidate",
      scenarioId: row.scenario_id ?? row.communication_objective,
    }));
  } catch {
    return [];
  }
}

export async function listLearningSessionsForUser() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_sessions")
    .select("id,completion_status,average_score,started_at,completed_at,case_version_id")
    .order("started_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function getSessionTurns(sessionId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_session_turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("turn_number", { ascending: true });

  if (error) return [];
  return (data ?? []) as Array<Record<string, unknown>>;
}

export function mapTurnSubmissionInput(input: TurnSubmissionInput): SessionSubmitPayload {
  return {
    sessionId: input.sessionId,
    turnNumber: input.turnNumber,
    transcript: input.transcript,
    normalizedTranscript: input.normalizedTranscript,
    inputType: input.inputType,
    objectiveCode: input.objectiveCode,
    evaluation: {
      scores: {
        taskCompletion: 0,
        grammar: 0,
        clarity: 0,
        professionalTone: 0,
        vocabulary: 0,
        fluency: 0,
      },
      overallScore: 0,
      objectivesDetected: [],
      objectivesCompleted: [],
      grammarFindings: [],
      responseRelevance: "relevant",
      needsClarification: false,
      recommendedNextAction: "PROBE_OBJECTIVE",
    },
  };
}

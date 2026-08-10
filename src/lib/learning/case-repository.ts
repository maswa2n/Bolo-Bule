import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
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
  publishedCaseVersionId: number | null;
};

type EnrichedCaseCandidatePayload = {
  titleEn: string;
  titleId: string;
  scenarioEn: string;
  scenarioId: string;
  communicationGoal: string;
  objectives: Array<{
    objectiveCode: string;
    description: string;
    required: boolean;
    weight: number;
    sortOrder: number;
  }>;
  turnTemplates: Array<{
    turnNumber: number;
    objectiveCode: string | null;
    coachMessageEn: string;
    coachMessageId: string;
    responseSupport: string[];
  }>;
  languageTargets: {
    grammar: string[];
    vocabulary: string[];
    functionalLanguage: string[];
  };
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function parseDraftPayload(value: unknown): EnrichedCaseCandidatePayload | null {
  const payload = asObject(value);
  if (!payload) return null;

  const objectivesRaw = Array.isArray(payload.objectives) ? payload.objectives : [];
  const objectives = objectivesRaw
    .map((row, index) => {
      const item = asObject(row);
      if (!item) return null;
      return {
        objectiveCode: asString(item.objectiveCode, `OBJECTIVE_${index + 1}`),
        description: asString(item.description, "Describe objective clearly."),
        required: asBoolean(item.required, true),
        weight: asNumber(item.weight, 100),
        sortOrder: Number.isInteger(item.sortOrder) ? Number(item.sortOrder) : index + 1,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const turnTemplatesRaw = Array.isArray(payload.turnTemplates) ? payload.turnTemplates : [];
  const turnTemplates = turnTemplatesRaw
    .map((row, index) => {
      const item = asObject(row);
      if (!item) return null;
      const supportRaw = Array.isArray(item.responseSupport) ? item.responseSupport : [];
      return {
        turnNumber: Number.isInteger(item.turnNumber) ? Number(item.turnNumber) : index + 1,
        objectiveCode: asString(item.objectiveCode) || null,
        coachMessageEn: asString(item.coachMessageEn, "Please explain your latest status and commitment."),
        coachMessageId: asString(item.coachMessageId, "Tolong jelaskan status terbaru dan komitmen Anda."),
        responseSupport: supportRaw
          .map((support) => asString(support).trim())
          .filter((support) => support.length > 0),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const languageTargetsRaw = asObject(payload.languageTargets);
  return {
    titleEn: asString(payload.titleEn, "Generated Case"),
    titleId: asString(payload.titleId, "Kasus Buatan"),
    scenarioEn: asString(payload.scenarioEn, "Generated scenario for practice."),
    scenarioId: asString(payload.scenarioId, "Skenario latihan yang dihasilkan."),
    communicationGoal: asString(payload.communicationGoal, "Reach a clear commitment."),
    objectives:
      objectives.length > 0
        ? objectives
        : [
            {
              objectiveCode: "PRIMARY_OBJECTIVE",
              description: "Deliver a clear commitment.",
              required: true,
              weight: 100,
              sortOrder: 1,
            },
          ],
    turnTemplates:
      turnTemplates.length > 0
        ? turnTemplates
        : [
            {
              turnNumber: 1,
              objectiveCode: "PRIMARY_OBJECTIVE",
              coachMessageEn: "Please explain your action plan and timeline clearly.",
              coachMessageId: "Tolong jelaskan rencana tindakan dan timeline Anda dengan jelas.",
              responseSupport: [
                "I will explain the current status first.",
                "I will describe the impact and corrective action.",
                "I will commit the exact follow-up time.",
              ],
            },
          ],
    languageTargets: {
      grammar: Array.isArray(languageTargetsRaw?.grammar)
        ? languageTargetsRaw.grammar.map((item) => asString(item)).filter(Boolean)
        : [],
      vocabulary: Array.isArray(languageTargetsRaw?.vocabulary)
        ? languageTargetsRaw.vocabulary.map((item) => asString(item)).filter(Boolean)
        : [],
      functionalLanguage: Array.isArray(languageTargetsRaw?.functionalLanguage)
        ? languageTargetsRaw.functionalLanguage.map((item) => asString(item)).filter(Boolean)
        : [],
    },
  };
}

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

const publishedCaseSelect =
  "id,case_id,version_number,status,title_en,title_id,scenario_en,scenario_id,internal_level,cefr_level,user_role,counterpart_role,communication_goal,content_source,conversation_policy,learning_cases!learning_case_versions_case_id_fkey(case_code,domain,subdomain,work_function),learning_case_objectives(objective_code,description,required,weight,sort_order),learning_case_turn_templates(turn_number,objective_code,coach_message_en,coach_message_id,response_support),learning_case_language_targets(grammar_targets,vocabulary_targets,functional_language)";

export async function listPublishedCases(): Promise<LearningCaseVersion[]> {
  try {
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("learning_case_versions")
      .select(publishedCaseSelect)
      .eq("status", "published")
      .order("id", { ascending: true });

    if (error) {
      console.error("[listPublishedCases] Supabase query failed:", error.message);
      return [];
    }

    const rows = (data ?? []) as PublishedCaseRow[];
    if (rows.length === 0) return seedCaseBank;
    return rows.map(toLearningCase);
  } catch (error) {
    console.error("[listPublishedCases] Unexpected error:", error);
    return [];
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

export async function applyCandidateDraftToCaseVersion(payload: { candidateId: number; caseVersionId: number }) {
  const supabase = await createClient();
  const { data: candidateRow, error: candidateError } = await supabase
    .from("case_candidates")
    .select("payload")
    .eq("id", payload.candidateId)
    .maybeSingle();

  if (candidateError || !candidateRow) {
    return { error: candidateError?.message ?? "Candidate payload tidak ditemukan." };
  }

  const draft = parseDraftPayload((candidateRow as { payload: unknown }).payload);
  if (!draft) {
    return { skipped: true };
  }

  const { error: deleteObjectiveError } = await supabase
    .from("learning_case_objectives")
    .delete()
    .eq("case_version_id", payload.caseVersionId);
  if (deleteObjectiveError) return { error: deleteObjectiveError.message };

  const { error: objectiveInsertError } = await supabase.from("learning_case_objectives").insert(
    draft.objectives.map((objective) => ({
      case_version_id: payload.caseVersionId,
      objective_code: objective.objectiveCode,
      description: objective.description,
      required: objective.required,
      weight: objective.weight,
      sort_order: objective.sortOrder,
    })) as never,
  );
  if (objectiveInsertError) return { error: objectiveInsertError.message };

  const { error: deleteTurnError } = await supabase
    .from("learning_case_turn_templates")
    .delete()
    .eq("case_version_id", payload.caseVersionId);
  if (deleteTurnError) return { error: deleteTurnError.message };

  const { error: turnInsertError } = await supabase.from("learning_case_turn_templates").insert(
    draft.turnTemplates.map((turn) => ({
      case_version_id: payload.caseVersionId,
      turn_number: turn.turnNumber,
      objective_code: turn.objectiveCode,
      coach_message_en: turn.coachMessageEn,
      coach_message_id: turn.coachMessageId,
      response_support: turn.responseSupport,
    })) as never,
  );
  if (turnInsertError) return { error: turnInsertError.message };

  const { error: languageTargetError } = await supabase.from("learning_case_language_targets").upsert(
    {
      case_version_id: payload.caseVersionId,
      grammar_targets: draft.languageTargets.grammar,
      vocabulary_targets: draft.languageTargets.vocabulary,
      functional_language: draft.languageTargets.functionalLanguage,
    } as never,
    {
      onConflict: "case_version_id",
    },
  );
  if (languageTargetError) return { error: languageTargetError.message };

  const { error: caseVersionError } = await supabase
    .from("learning_case_versions")
    .update({
      title_en: draft.titleEn,
      title_id: draft.titleId,
      scenario_en: draft.scenarioEn,
      scenario_id: draft.scenarioId,
      communication_goal: draft.communicationGoal,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", payload.caseVersionId);
  if (caseVersionError) return { error: caseVersionError.message };

  return { caseVersionId: payload.caseVersionId };
}

export async function enrichCaseCandidate(payload: {
  candidateId: number;
  draft: EnrichedCaseCandidatePayload;
  metadata: {
    provider: string;
    model: string;
    latencyMs: number | null;
    tokenUsage: Record<string, unknown> | null;
  };
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("case_candidates")
    .update({
      title_en: payload.draft.titleEn,
      title_id: payload.draft.titleId,
      scenario_en: payload.draft.scenarioEn,
      scenario_id: payload.draft.scenarioId,
      status: "pass_auto_validation",
      payload: {
        ...payload.draft,
        llm_metadata: payload.metadata,
        enriched_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", payload.candidateId);

  if (error) {
    return { error: error.message };
  }

  return { candidateId: payload.candidateId };
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

    const caseCodes = rows.map((row) => `GEN-${row.id}`);
    const { data: publishedRows } = await supabase
      .from("learning_cases")
      .select("case_code,current_version_id")
      .in("case_code", caseCodes);

    const versionByCandidateId = new Map<number, number>();
    for (const published of (publishedRows ?? []) as Array<{
      case_code: string;
      current_version_id: number | null;
    }>) {
      const match = published.case_code.match(/^GEN-(\d+)$/);
      if (match && published.current_version_id) {
        versionByCandidateId.set(Number(match[1]), published.current_version_id);
      }
    }

    return rows.map((row) => ({
      id: row.id,
      domain: row.domain,
      workFunction: row.work_function,
      difficulty: row.difficulty,
      communicationObjective: row.communication_objective,
      status: row.status as CandidateLifecycleStatus,
      titleEn: row.title_en ?? "Generated Candidate",
      scenarioId: row.scenario_id ?? row.communication_objective,
      publishedCaseVersionId: versionByCandidateId.get(row.id) ?? null,
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

export async function updateLearningTurnCoachOutput(payload: {
  sessionId: number;
  turnNumber: number;
  coachResponse: string;
  modelName: string;
  latencyMs: number | null;
  tokenUsage: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("learning_session_turns")
    .update({
      coach_response: payload.coachResponse,
      model_name: payload.modelName,
      latency_ms: payload.latencyMs,
      token_usage: payload.tokenUsage,
    } as never)
    .eq("session_id", payload.sessionId)
    .eq("turn_number", payload.turnNumber)
    .eq("speaker", "user");

  if (error) {
    throw new Error(error.message);
  }
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

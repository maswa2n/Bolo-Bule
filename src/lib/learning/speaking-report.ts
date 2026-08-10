import { createClient } from "@/lib/supabase/server";

export type SkillDimension = {
  key: string;
  label: string;
  labelId: string;
  score: number;
  trend: number;
  priority: "high" | "medium" | "low";
};

export type ObjectiveProgress = {
  code: string;
  description: string;
  required: boolean;
  completed: boolean;
  detectedCount: number;
  lastTurnNumber: number | null;
  masteryScore: number | null;
  status: "done" | "in_progress" | "not_started";
};

export type TurnSnapshot = {
  sessionId: number;
  turnNumber: number;
  transcript: string;
  targetObjective: string | null;
  objectiveDetected: boolean;
  objectiveCompleted: boolean;
  overallScore: number;
  scores: Record<string, number>;
  practicedAt: string;
};

export type SessionHistoryItem = {
  id: number;
  caseTitleId: string;
  caseTitleEn: string;
  cefrLevel: string;
  status: string;
  turnCount: number;
  targetTurns: number;
  averageScore: number;
  startedAt: string;
  completedAt: string | null;
};

export type MasteryRow = {
  objectiveCode: string;
  description: string;
  masteryScore: number;
  attemptsCount: number;
  successCount: number;
  lastPracticedAt: string | null;
  insight: string;
};

export type RemedialAction = {
  priority: number;
  title: string;
  reason: string;
  action: string;
};

export type SpeakingInsight = {
  type: "strength" | "gap" | "pattern" | "next_step";
  title: string;
  body: string;
};

export type SpeakingSkillReport = {
  generatedAt: string;
  learnerName: string;
  totalSessions: number;
  totalTurns: number;
  activeSession: SpeakingSessionSummary | null;
  session: SpeakingSessionSummary | null;
  sessionHistory: SessionHistoryItem[];
  dimensions: SkillDimension[];
  objectives: ObjectiveProgress[];
  masteryRows: MasteryRow[];
  turns: TurnSnapshot[];
  remedialQueue: RemedialAction[];
  insights: SpeakingInsight[];
  languageTargets: {
    grammar: string[];
    vocabulary: string[];
    functional: string[];
  };
  kpis: {
    sessionCompletionRate: number;
    averageSessionScore: number;
    activeLearners7d: number;
    inProgressScore: number;
    weeklyMomentum: number;
  };
};

export type SpeakingSessionSummary = {
  id: number;
  status: string;
  caseTitleEn: string;
  caseTitleId: string;
  cefrLevel: string;
  communicationGoal: string;
  turnCount: number;
  targetTurns: number;
  averageScore: number;
  startedAt: string;
};

type SessionRow = {
  id: number;
  completion_status: string;
  turn_count: number;
  target_turns: number;
  average_score: number | string | null;
  started_at: string;
  completed_at: string | null;
  case_version_id: number;
};

const DIMENSION_META: Array<{ key: string; label: string; labelId: string }> = [
  { key: "task_completion", label: "Task completion", labelId: "Pencapaian tugas" },
  { key: "grammar", label: "Grammar", labelId: "Tata bahasa" },
  { key: "vocabulary", label: "Vocabulary", labelId: "Kosakata" },
  { key: "fluency", label: "Fluency", labelId: "Kelancaran" },
  { key: "clarity", label: "Clarity", labelId: "Kejelasan" },
  { key: "professional_tone", label: "Professional tone", labelId: "Nada profesional" },
];

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function computeTrend(scores: number[]): number {
  if (scores.length < 2) return 0;
  const mid = Math.floor(scores.length / 2);
  const early = scores.slice(0, mid);
  const late = scores.slice(mid);
  const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
  const lateAvg = late.reduce((a, b) => a + b, 0) / late.length;
  return Number((lateAvg - earlyAvg).toFixed(1));
}

function priorityFromScore(score: number): "high" | "medium" | "low" {
  if (score < 65) return "high";
  if (score < 75) return "medium";
  return "low";
}

function masteryInsight(row: { masteryScore: number; attemptsCount: number; successCount: number }): string {
  if (row.attemptsCount > 0 && row.successCount === 0) {
    return "Terdeteksi di latihan tapi belum pernah completed — fokus di sini.";
  }
  if (row.masteryScore < 65) return "Prioritas remedial — ulangi scenario dengan objective ini.";
  if (row.masteryScore >= 75) return "Stabil — lanjutkan latihan transfer ke kasus baru.";
  return "Perlu penguatan sebelum melanjut ke objective berikutnya.";
}

function computeWeeklyMomentum(sessions: SessionRow[]): number {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = now - weekMs;
  const lastWeekStart = now - 2 * weekMs;

  const progressRate = (list: SessionRow[]) => {
    if (list.length === 0) return 0;
    return (
      list.reduce((sum, session) => sum + Math.min(session.turn_count / Math.max(session.target_turns, 1), 1), 0) /
      list.length
    );
  };

  const thisWeek = sessions.filter((session) => new Date(session.started_at).getTime() >= thisWeekStart);
  const lastWeek = sessions.filter((session) => {
    const timestamp = new Date(session.started_at).getTime();
    return timestamp >= lastWeekStart && timestamp < thisWeekStart;
  });

  const thisRate = progressRate(thisWeek);
  const lastRate = progressRate(lastWeek);
  if (lastRate === 0) return thisRate > 0 ? Math.round(thisRate * 100) : 0;
  return Math.round(((thisRate - lastRate) / lastRate) * 100);
}

function buildInsights(input: {
  dimensions: SkillDimension[];
  objectives: ObjectiveProgress[];
  session: SpeakingSessionSummary | null;
  totalSessions: number;
  totalTurns: number;
}): SpeakingInsight[] {
  const insights: SpeakingInsight[] = [];
  const fluency = input.dimensions.find((d) => d.key === "fluency");
  const task = input.dimensions.find((d) => d.key === "task_completion");
  const vocab = input.dimensions.find((d) => d.key === "vocabulary");

  if (input.totalSessions === 0) {
    return [{ type: "next_step", title: "Belum ada sesi", body: "Mulai latihan speaking pertama Anda di /practice." }];
  }

  if (fluency && task && fluency.score - task.score >= 12) {
    insights.push({
      type: "pattern",
      title: "Pola fluency vs task gap",
      body: `Kelancaran (${fluency.score}) lebih tinggi dari pencapaian tugas (${task.score}). Pola umum learner Indonesia: terdengar lancar, tapi belum memenuhi tujuan komunikasi scenario.`,
    });
  }

  if (vocab && vocab.score < 70) {
    insights.push({
      type: "gap",
      title: "Kosakata workplace perlu diperkuat",
      body: `Rata-rata vocabulary ${vocab.score}/100 dari ${input.totalTurns} turn di ${input.totalSessions} sesi. Latih frasa fungsional sebelum sesi berikutnya.`,
    });
  }

  const notStarted = input.objectives.filter((o) => o.status === "not_started" && o.required);
  if (notStarted.length > 0) {
    insights.push({
      type: "next_step",
      title: "Objective belum dimulai",
      body: `${notStarted.map((o) => o.code).join(", ")} belum terdeteksi. Fokus: ${notStarted[0].description}`,
    });
  }

  const inProgress = input.objectives.filter((o) => o.status === "in_progress");
  if (inProgress.length > 0) {
    insights.push({
      type: "next_step",
      title: "Lanjutkan objective aktif",
      body: `${inProgress[0].code} terdeteksi ${inProgress[0].detectedCount}x tapi belum selesai.`,
    });
  }

  const strongest = [...input.dimensions].sort((a, b) => b.score - a.score)[0];
  if (strongest) {
    insights.push({
      type: "strength",
      title: `Kekuatan: ${strongest.labelId}`,
      body: `${strongest.label} (${strongest.score})${strongest.trend > 0 ? ` — naik +${strongest.trend} dari latihan awal ke terbaru` : ""}.`,
    });
  }

  if (input.session && input.session.turnCount < input.session.targetTurns) {
    insights.push({
      type: "next_step",
      title: "Satu aksi terbaik hari ini",
      body: `Lanjutkan "${input.session.caseTitleId}" — ${input.session.turnCount}/${input.session.targetTurns} turn selesai.`,
    });
  }

  return insights.slice(0, 5);
}

function buildRemedialQueue(input: {
  dimensions: SkillDimension[];
  objectives: ObjectiveProgress[];
  masteryRows: MasteryRow[];
}): RemedialAction[] {
  const actions: RemedialAction[] = [];
  let priority = 1;

  for (const objective of input.objectives.filter((o) => !o.completed && o.required)) {
    actions.push({
      priority: priority++,
      title: objective.code,
      reason: objective.status === "not_started" ? "Belum pernah muncul di sesi" : "Terdeteksi tapi belum completed",
      action: objective.description,
    });
  }

  for (const row of input.masteryRows.filter((m) => m.masteryScore < 70).slice(0, 2)) {
    actions.push({
      priority: priority++,
      title: row.objectiveCode,
      reason: `Mastery ${row.masteryScore}% — ${row.attemptsCount} attempt(s)`,
      action: row.description,
    });
  }

  for (const dimension of [...input.dimensions].sort((a, b) => a.score - b.score).slice(0, 2)) {
    if (dimension.priority === "high" || dimension.priority === "medium") {
      actions.push({
        priority: priority++,
        title: dimension.labelId,
        reason: `Skor rata-rata ${dimension.score}/100 — prioritas remedial`,
        action: `Latihan terfokus: ${dimension.label}`,
      });
    }
  }

  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = action.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 5);
}

function mapSessionDetail(
  sessionRow: SessionRow,
  caseVersion: { title_en?: string; title_id?: string; cefr_level?: string; communication_goal?: string } | null,
): SpeakingSessionSummary {
  return {
    id: sessionRow.id,
    status: sessionRow.completion_status,
    caseTitleEn: caseVersion?.title_en ?? "",
    caseTitleId: caseVersion?.title_id ?? "",
    cefrLevel: caseVersion?.cefr_level ?? "",
    communicationGoal: caseVersion?.communication_goal ?? "",
    turnCount: sessionRow.turn_count,
    targetTurns: sessionRow.target_turns,
    averageScore: num(sessionRow.average_score),
    startedAt: sessionRow.started_at,
  };
}

export async function getSpeakingSkillReport(): Promise<SpeakingSkillReport> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const emptyReport: SpeakingSkillReport = {
    generatedAt: new Date().toISOString(),
    learnerName: "Learner",
    totalSessions: 0,
    totalTurns: 0,
    activeSession: null,
    session: null,
    sessionHistory: [],
    dimensions: DIMENSION_META.map((d) => ({ ...d, score: 0, trend: 0, priority: "low" as const })),
    objectives: [],
    masteryRows: [],
    turns: [],
    remedialQueue: [],
    insights: [{ type: "next_step", title: "Belum ada sesi", body: "Mulai latihan speaking pertama Anda di /practice." }],
    languageTargets: { grammar: [], vocabulary: [], functional: [] },
    kpis: {
      sessionCompletionRate: 0,
      averageSessionScore: 0,
      activeLearners7d: 0,
      inProgressScore: 0,
      weeklyMomentum: 0,
    },
  };

  if (!user) return emptyReport;

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();

  const { data: sessionsRaw } = await supabase
    .from("learning_sessions")
    .select(
      "id, completion_status, turn_count, target_turns, average_score, started_at, completed_at, case_version_id",
    )
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  const sessions = (sessionsRaw ?? []) as SessionRow[];
  if (sessions.length === 0) {
    return { ...emptyReport, learnerName: (profile as { full_name?: string } | null)?.full_name ?? "Learner" };
  }

  const sessionIds = sessions.map((session) => session.id);
  const caseVersionIds = [...new Set(sessions.map((session) => session.case_version_id))];

  const { data: caseVersionsRaw } = await supabase
    .from("learning_case_versions")
    .select("id, title_en, title_id, cefr_level, communication_goal")
    .in("id", caseVersionIds);

  const caseVersionMap = new Map(
    ((caseVersionsRaw ?? []) as Array<{
      id: number;
      title_en: string;
      title_id: string;
      cefr_level: string;
      communication_goal: string;
    }>).map((row) => [row.id, row]),
  );

  const latestSessionRow = sessions[0];
  const activeSessionRow = sessions.find((session) => session.completion_status === "in_progress") ?? null;

  const { data: scoresRaw } = await supabase
    .from("learning_session_scores")
    .select("session_id, turn_number, task_completion, grammar, clarity, professional_tone, vocabulary, fluency, overall_score, created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: true });

  const { data: objectivesRaw } = await supabase
    .from("learning_session_objectives")
    .select("session_id, objective_code, completed, detected_count, last_turn_number")
    .in("session_id", sessionIds);

  const { data: caseObjectivesRaw } = await supabase
    .from("learning_case_objectives")
    .select("case_version_id, objective_code, description, required")
    .in("case_version_id", caseVersionIds);

  const { data: turnsRaw } = await supabase
    .from("learning_session_turns")
    .select("session_id, turn_number, raw_transcript, target_objective, objective_result, score_result, created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: masteryRaw } = await supabase
    .from("user_skill_mastery")
    .select("objective_code, mastery_score, attempts_count, success_count, last_practiced_at")
    .eq("user_id", user.id)
    .order("mastery_score", { ascending: true });

  const { data: langTargetsRaw } = await supabase
    .from("learning_case_language_targets")
    .select("grammar_targets, vocabulary_targets, functional_language")
    .eq("case_version_id", latestSessionRow.case_version_id)
    .maybeSingle();

  const scores = (scoresRaw ?? []) as Array<Record<string, unknown>>;
  const totalTurns = scores.length;

  const dimensions: SkillDimension[] = DIMENSION_META.map((meta) => {
    const perTurn = scores.map((row) => num(row[meta.key]));
    const avg = perTurn.length > 0 ? perTurn.reduce((a, b) => a + b, 0) / perTurn.length : 0;
    return {
      ...meta,
      score: Number(avg.toFixed(1)),
      trend: computeTrend(perTurn),
      priority: priorityFromScore(avg),
    };
  });

  const objectiveDescriptionMap = new Map<string, string>();
  for (const row of (caseObjectivesRaw ?? []) as Array<{ objective_code: string; description: string }>) {
    objectiveDescriptionMap.set(row.objective_code, row.description);
  }

  const masteryRows: MasteryRow[] = ((masteryRaw ?? []) as Array<{
    objective_code: string;
    mastery_score: number | string;
    attempts_count: number;
    success_count: number;
    last_practiced_at: string | null;
  }>).map((row) => ({
    objectiveCode: row.objective_code,
    description: objectiveDescriptionMap.get(row.objective_code) ?? row.objective_code,
    masteryScore: num(row.mastery_score),
    attemptsCount: row.attempts_count,
    successCount: row.success_count,
    lastPracticedAt: row.last_practiced_at,
    insight: masteryInsight({
      masteryScore: num(row.mastery_score),
      attemptsCount: row.attempts_count,
      successCount: row.success_count,
    }),
  }));

  const latestObjectivesRaw = ((objectivesRaw ?? []) as Array<{
    session_id: number;
    objective_code: string;
    completed: boolean;
    detected_count: number;
    last_turn_number: number | null;
  }>).filter((row) => row.session_id === latestSessionRow.id);

  const masteryMap = new Map(masteryRows.map((row) => [row.objectiveCode, row.masteryScore]));

  const objectives: ObjectiveProgress[] = latestObjectivesRaw.map((row) => {
    const status: ObjectiveProgress["status"] = row.completed
      ? "done"
      : row.detected_count > 0
        ? "in_progress"
        : "not_started";

    return {
      code: row.objective_code,
      description: objectiveDescriptionMap.get(row.objective_code) ?? row.objective_code,
      required: true,
      completed: row.completed,
      detectedCount: row.detected_count,
      lastTurnNumber: row.last_turn_number,
      masteryScore: masteryMap.get(row.objective_code) ?? null,
      status,
    };
  });

  const turns: TurnSnapshot[] = ((turnsRaw ?? []) as Array<{
    session_id: number;
    turn_number: number;
    raw_transcript: string;
    target_objective: string | null;
    objective_result: { detected?: boolean; completed?: boolean } | null;
    score_result: Record<string, number> | null;
    created_at: string;
  }>)
    .reverse()
    .map((row) => ({
      sessionId: row.session_id,
      turnNumber: row.turn_number,
      transcript: row.raw_transcript,
      targetObjective: row.target_objective,
      objectiveDetected: Boolean(row.objective_result?.detected),
      objectiveCompleted: Boolean(row.objective_result?.completed),
      overallScore: num(row.score_result?.overall_score),
      scores: {
        task_completion: num(row.score_result?.task_completion),
        grammar: num(row.score_result?.grammar),
        vocabulary: num(row.score_result?.vocabulary),
        fluency: num(row.score_result?.fluency),
        clarity: num(row.score_result?.clarity),
        professional_tone: num(row.score_result?.professional_tone),
      },
      practicedAt: row.created_at,
    }));

  const sessionHistory: SessionHistoryItem[] = sessions.map((session) => {
    const caseVersion = caseVersionMap.get(session.case_version_id);
    return {
      id: session.id,
      caseTitleId: caseVersion?.title_id ?? "",
      caseTitleEn: caseVersion?.title_en ?? "",
      cefrLevel: caseVersion?.cefr_level ?? "",
      status: session.completion_status,
      turnCount: session.turn_count,
      targetTurns: session.target_turns,
      averageScore: num(session.average_score),
      startedAt: session.started_at,
      completedAt: session.completed_at,
    };
  });

  const latestCaseVersion = caseVersionMap.get(latestSessionRow.case_version_id) ?? null;
  const session = mapSessionDetail(latestSessionRow, latestCaseVersion);
  const activeSession = activeSessionRow
    ? mapSessionDetail(activeSessionRow, caseVersionMap.get(activeSessionRow.case_version_id) ?? null)
    : null;

  const completedSessions = sessions.filter((s) => s.completion_status !== "in_progress");
  const passSessions = completedSessions.filter((s) => s.completion_status === "passed");
  const scoredSessions = sessions.filter((s) => num(s.average_score) > 0);

  const lt = langTargetsRaw as {
    grammar_targets?: string[];
    vocabulary_targets?: string[];
    functional_language?: string[];
  } | null;

  const remedialQueue = buildRemedialQueue({ dimensions, objectives, masteryRows });
  const insights = buildInsights({
    dimensions,
    objectives,
    session: activeSession ?? session,
    totalSessions: sessions.length,
    totalTurns,
  });

  return {
    generatedAt: new Date().toISOString(),
    learnerName: (profile as { full_name?: string } | null)?.full_name ?? "Learner",
    totalSessions: sessions.length,
    totalTurns,
    activeSession,
    session,
    sessionHistory,
    dimensions,
    objectives,
    masteryRows,
    turns,
    remedialQueue,
    insights,
    languageTargets: {
      grammar: lt?.grammar_targets ?? [],
      vocabulary: lt?.vocabulary_targets ?? [],
      functional: lt?.functional_language ?? [],
    },
    kpis: {
      sessionCompletionRate: completedSessions.length > 0 ? passSessions.length / completedSessions.length : 0,
      averageSessionScore:
        scoredSessions.length > 0
          ? scoredSessions.reduce((sum, s) => sum + num(s.average_score), 0) / scoredSessions.length
          : 0,
      activeLearners7d: sessions.some((s) => Date.now() - new Date(s.started_at).getTime() <= 7 * 86400000) ? 1 : 0,
      inProgressScore: activeSession?.averageScore ?? session.averageScore,
      weeklyMomentum: computeWeeklyMomentum(sessions),
    },
  };
}
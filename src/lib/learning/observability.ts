import { createClient } from "@/lib/supabase/server";

export type LearningKpiSnapshot = {
  sessionCompletionRate: number;
  averageSessionScore: number;
  evaluationPassRate: number;
  activeLearners7d: number;
};

export async function getLearningKpiSnapshot(): Promise<LearningKpiSnapshot> {
  const supabase = await createClient();

  const [sessionResult, evaluationResult] = await Promise.all([
    supabase.from("learning_sessions").select("completion_status,average_score,user_id,started_at"),
    supabase.from("evaluation_runs").select("run_status"),
  ]);

  const sessions = (sessionResult.data ?? []) as Array<{
    completion_status: string;
    average_score: number | string | null;
    user_id: string;
    started_at: string;
  }>;
  const evaluations = (evaluationResult.data ?? []) as Array<{ run_status: string }>;

  const completedSessions = sessions.filter((session) => session.completion_status !== "in_progress");
  const passSessions = completedSessions.filter((session) => session.completion_status === "passed");
  const completionRate = completedSessions.length > 0 ? passSessions.length / completedSessions.length : 0;

  const averageSessionScore =
    completedSessions.length > 0
      ? completedSessions.reduce((sum, session) => sum + Number(session.average_score ?? 0), 0) /
        completedSessions.length
      : 0;

  const passedEvaluations = evaluations.filter((run) => run.run_status === "passed");
  const evaluationPassRate = evaluations.length > 0 ? passedEvaluations.length / evaluations.length : 0;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const activeLearners = new Set(
    sessions
      .filter((session) => new Date(session.started_at).getTime() >= sevenDaysAgo)
      .map((session) => session.user_id),
  );

  return {
    sessionCompletionRate: Number(completionRate.toFixed(4)),
    averageSessionScore: Number(averageSessionScore.toFixed(2)),
    evaluationPassRate: Number(evaluationPassRate.toFixed(4)),
    activeLearners7d: activeLearners.size,
  };
}

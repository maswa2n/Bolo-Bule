import { createClient } from "@/lib/supabase/server";
import type { EvaluatorResult } from "@/types/learning";

type LooseTableClient = {
  from: (table: string) => {
    upsert: (values: unknown, options?: unknown) => Promise<unknown>;
  };
};

export async function updateUserMasteryAfterTurn(payload: {
  userId: string;
  objectiveCode: string | null;
  evaluator: EvaluatorResult;
}) {
  if (!payload.objectiveCode) {
    return { updated: false };
  }

  const supabase = await createClient();
  const tableClient = supabase as unknown as LooseTableClient;
  const currentMastery = payload.evaluator.overallScore;
  const isSuccess = payload.evaluator.objectivesCompleted.includes(payload.objectiveCode);

  await tableClient.from("user_skill_mastery").upsert(
    {
      user_id: payload.userId,
      objective_code: payload.objectiveCode,
      mastery_score: currentMastery,
      attempts_count: 1,
      success_count: isSuccess ? 1 : 0,
      last_practiced_at: new Date().toISOString(),
    },
    { onConflict: "user_id,objective_code", ignoreDuplicates: false },
  );

  for (const finding of payload.evaluator.grammarFindings) {
    await tableClient.from("user_error_patterns").upsert(
      {
        user_id: payload.userId,
        error_code: finding.errorCode,
        sample_original: finding.original,
        sample_corrected: finding.corrected,
        frequency: 1,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id,error_code", ignoreDuplicates: false },
    );
  }

  return { updated: true };
}

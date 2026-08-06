import { createClient } from "@/lib/supabase/server";
import { listPublishedCases } from "@/lib/learning/case-repository";
import type { SessionPlanInput, SessionPlanOutput } from "@/types/learning";

type LooseRpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function recommendNextCase(input: SessionPlanInput): Promise<SessionPlanOutput> {
  try {
    const supabase = await createClient();
    const rpcClient = supabase as unknown as LooseRpcClient;
    const { data, error } = await rpcClient.rpc("recommend_next_case", {
      p_user_id: input.learnerId,
      p_preferred_domain: input.preferredDomain ?? null,
      p_preferred_level: input.preferredDifficulty ?? null,
    });

    if (!error) {
      const row = (Array.isArray(data) ? data[0] : data) as
        | { case_version_id: number; recommendation_score: number; reason: string }
        | undefined;
      if (row?.case_version_id) {
        return {
          selectedCaseVersionId: Number(row.case_version_id),
          recommendationScore: Number(row.recommendation_score ?? 0),
          reason: row.reason ?? "rpc_recommendation",
        };
      }
    }
  } catch {
    // fall back to first published case
  }

  const cases = await listPublishedCases();
  const fallbackCase = cases[0];
  return {
    selectedCaseVersionId: fallbackCase?.id ?? 0,
    recommendationScore: 0,
    reason: "fallback_first_published_case",
  };
}

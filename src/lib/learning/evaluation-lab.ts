import { createClient } from "@/lib/supabase/server";

export type EvaluationRunSummary = {
  id: number;
  run_status: string;
  metrics: Record<string, number>;
  created_at: string;
};

type LooseRpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export async function ensureDefaultEvaluationDataset() {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("ensure_default_evaluation_dataset");

  if (error) throw new Error(error.message);
  return Number(data ?? 1);
}

export async function runRegressionEvaluation(payload: {
  datasetId: number;
  promptVersionId?: number;
  modelConfigurationId?: number;
}): Promise<EvaluationRunSummary> {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("run_regression_evaluation", {
    p_dataset_id: payload.datasetId,
    p_prompt_version_id: payload.promptVersionId ?? null,
    p_model_configuration_id: payload.modelConfigurationId ?? null,
  });
  if (error) throw new Error(error.message);

  const row = (Array.isArray(data) ? data[0] : data) as
    | { id: number; run_status: string; metrics: Record<string, number>; created_at: string }
    | undefined;

  return {
    id: Number(row?.id ?? 0),
    run_status: row?.run_status ?? "failed",
    metrics: row?.metrics ?? {},
    created_at: row?.created_at ?? new Date().toISOString(),
  };
}

export async function listRecentEvaluationRuns(): Promise<EvaluationRunSummary[]> {
  const supabase = await createClient();
  const rpcClient = supabase as unknown as LooseRpcClient;
  const { data, error } = await rpcClient.rpc("list_recent_evaluation_runs");
  if (error) return [];
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => {
    const value = row as { id: number; run_status: string; metrics: Record<string, number>; created_at: string };
    return {
      id: Number(value.id),
      run_status: value.run_status,
      metrics: value.metrics ?? {},
      created_at: value.created_at,
    };
  });
}

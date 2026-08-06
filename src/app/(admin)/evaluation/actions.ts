"use server";

import { revalidatePath } from "next/cache";
import {
  ensureDefaultEvaluationDataset,
  listRecentEvaluationRuns,
  runRegressionEvaluation,
} from "@/lib/learning/evaluation-lab";
import { evaluateQualityGates } from "@/lib/learning/quality-gates";

export async function listEvaluationRunsAction() {
  return listRecentEvaluationRuns();
}

export async function runEvaluationGateAction() {
  const datasetId = await ensureDefaultEvaluationDataset();
  const run = await runRegressionEvaluation({ datasetId });
  const metrics = (run.metrics ?? {}) as Record<string, number>;
  const gates = evaluateQualityGates(metrics);

  revalidatePath("/evaluation");
  return {
    run,
    gates,
  };
}

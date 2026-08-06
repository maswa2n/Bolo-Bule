import { recommendNextCase } from "@/lib/learning/recommendation-engine";
import type { SessionPlanInput, SessionPlanOutput } from "@/types/learning";

export async function buildSessionPlan(input: SessionPlanInput): Promise<SessionPlanOutput> {
  return recommendNextCase(input);
}

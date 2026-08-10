"use server";

import { revalidatePath } from "next/cache";
import { generateCandidateDraftWithLlm } from "@/lib/ai/ollama-practice-coach";
import { requireAdminSession } from "@/lib/auth/require-admin-session";
import {
  applyCandidateDraftToCaseVersion,
  enqueueCaseCandidate,
  enrichCaseCandidate,
  listCaseCandidates,
  publishCaseCandidate,
} from "@/lib/learning/case-repository";

export async function listCaseCandidatesAction() {
  const session = await requireAdminSession();
  if ("error" in session) {
    return [];
  }
  return listCaseCandidates();
}

export async function generateCaseCandidateAction(payload: {
  domain: string;
  workFunction: string;
  difficulty: string;
  communicationObjective: string;
}) {
  const session = await requireAdminSession();
  if ("error" in session) {
    return { error: session.error };
  }

  const result = await enqueueCaseCandidate(payload);
  if ("error" in result && result.error) {
    revalidatePath("/cases");
    return result;
  }

  if (!result.candidateId) {
    revalidatePath("/cases");
    return { error: "Candidate ID tidak ditemukan." };
  }

  const enrichment = await generateCandidateDraftWithLlm(payload);
  if (!enrichment.draft) {
    revalidatePath("/cases");
    return {
      candidateId: result.candidateId,
      warning: "Candidate dibuat, tetapi enrichment LLM gagal. Candidate tetap bisa direview manual.",
    };
  }

  const enrichedResult = await enrichCaseCandidate({
    candidateId: result.candidateId,
    draft: enrichment.draft,
    metadata: {
      provider: enrichment.metadata.provider,
      model: enrichment.metadata.model,
      latencyMs: enrichment.metadata.latencyMs,
      tokenUsage: enrichment.metadata.tokenUsage,
    },
  });

  if ("error" in enrichedResult && enrichedResult.error) {
    revalidatePath("/cases");
    return {
      candidateId: result.candidateId,
      warning: `Candidate dibuat, enrichment gagal disimpan: ${enrichedResult.error}`,
    };
  }

  revalidatePath("/cases");
  return {
    candidateId: result.candidateId,
    enrichment: "completed",
    model: enrichment.metadata.model,
  };
}

export async function publishCaseCandidateAction(formData: FormData): Promise<void> {
  const session = await requireAdminSession();
  if ("error" in session) {
    return;
  }

  const candidateIdRaw = formData.get("candidateId");
  const candidateId = Number(candidateIdRaw);

  if (!Number.isFinite(candidateId)) {
    return;
  }

  const published = await publishCaseCandidate(candidateId);
  if ("caseVersionId" in published && published.caseVersionId) {
    await applyCandidateDraftToCaseVersion({
      candidateId,
      caseVersionId: published.caseVersionId,
    });
  }
  revalidatePath("/cases");
  revalidatePath("/practice");
}

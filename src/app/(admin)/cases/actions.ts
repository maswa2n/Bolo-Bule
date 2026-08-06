"use server";

import { revalidatePath } from "next/cache";
import { enqueueCaseCandidate, listCaseCandidates, publishCaseCandidate } from "@/lib/learning/case-repository";

export async function listCaseCandidatesAction() {
  return listCaseCandidates();
}

export async function generateCaseCandidateAction(payload: {
  domain: string;
  workFunction: string;
  difficulty: string;
  communicationObjective: string;
}) {
  const result = await enqueueCaseCandidate(payload);
  revalidatePath("/cases");
  return result;
}

export async function publishCaseCandidateAction(formData: FormData): Promise<void> {
  const candidateIdRaw = formData.get("candidateId");
  const candidateId = Number(candidateIdRaw);

  if (!Number.isFinite(candidateId)) {
    return;
  }

  await publishCaseCandidate(candidateId);
  revalidatePath("/cases");
}

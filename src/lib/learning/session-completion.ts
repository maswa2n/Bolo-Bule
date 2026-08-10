import type { LearningCompletionStatus } from "@/types/learning";

export function formatAverageScore(value: number): string {
  if (!Number.isFinite(value)) return "0.0";
  return value.toFixed(1);
}

type SessionCompletionSummaryInput = {
  completionStatus: LearningCompletionStatus;
  completionEligible: boolean;
  averageScore: number;
  minimumPassScore: number;
  coveredObjectives: number;
  totalObjectives: number;
  turnCount: number;
  targetTurns: number;
};

export type SessionCompletionSummary = {
  headline: string;
  detail: string;
  tone: "success" | "warning" | "neutral";
};

export function getSessionCompletionSummary(input: SessionCompletionSummaryInput): SessionCompletionSummary {
  const averageLabel = formatAverageScore(input.averageScore);
  const passLabel = formatAverageScore(input.minimumPassScore);

  if (input.completionStatus === "passed" || input.completionEligible) {
    return {
      headline: "Lulus",
      detail: `Skor rata-rata ${averageLabel} (min. ${passLabel}) · objective ${input.coveredObjectives}/${input.totalObjectives} · turn ${input.turnCount}/${input.targetTurns}`,
      tone: "success",
    };
  }

  if (input.completionStatus === "completed_with_remedial") {
    return {
      headline: "Selesai, perlu perbaikan",
      detail: `Skor rata-rata ${averageLabel} (min. ${passLabel}) · objective ${input.coveredObjectives}/${input.totalObjectives}`,
      tone: "warning",
    };
  }

  if (["manually_ended", "abandoned", "system_terminated"].includes(input.completionStatus)) {
    return {
      headline: "Sesi diakhiri",
      detail: `Skor rata-rata ${averageLabel} · objective ${input.coveredObjectives}/${input.totalObjectives}`,
      tone: "neutral",
    };
  }

  const scoreMet = input.averageScore >= input.minimumPassScore;
  const objectivesMet = input.coveredObjectives >= input.totalObjectives;
  const turnsMet = input.turnCount >= input.targetTurns;

  const pendingParts: string[] = [];
  if (!objectivesMet) pendingParts.push(`objective ${input.coveredObjectives}/${input.totalObjectives}`);
  if (!turnsMet) pendingParts.push(`turn ${input.turnCount}/${input.targetTurns}`);
  if (!scoreMet) pendingParts.push(`skor ${averageLabel}/${passLabel}`);

  return {
    headline: "Masih berlangsung",
    detail: pendingParts.length > 0 ? `Lanjutkan: ${pendingParts.join(" · ")}` : "Lanjutkan latihan untuk menutup sesi.",
    tone: "neutral",
  };
}

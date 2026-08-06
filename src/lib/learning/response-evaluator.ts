import type { EvaluatorFinding, EvaluatorResult, ObjectiveCode } from "@/types/learning";

function clampScore(value: number) {
  return Math.max(45, Math.min(96, Math.round(value)));
}

function detectGrammarFindings(text: string): EvaluatorFinding[] {
  const findings: EvaluatorFinding[] = [];

  if (/\bi\s+(still\s+)?(waiting|checking|working|verifying)\b/i.test(text) && !/\bi\s+am\s+/i.test(text)) {
    findings.push({
      errorCode: "MISSING_AUXILIARY",
      original: text,
      corrected: text.replace(/\bI\s+(still\s+)?(waiting|checking|working|verifying)\b/i, (_, p1 = "", p2) => {
        return `I am ${p1}${p2}`;
      }),
      explanationId: "Tambahkan kata kerja bantu 'am' sebelum kata kerja -ing.",
    });
  }

  if (/\bwaiting\s+(data|information|confirmation|approval)\b/i.test(text)) {
    findings.push({
      errorCode: "MISSING_PREPOSITION",
      original: text,
      corrected: text.replace(/\bwaiting\s+(data|information|confirmation|approval)\b/i, "waiting for $1"),
      explanationId: "Gunakan 'waiting for' saat menunggu sesuatu.",
    });
  }

  return findings;
}

export function evaluateSessionTurn(text: string, objectiveCode: ObjectiveCode | null): EvaluatorResult {
  const normalized = text.trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const grammarFindings = detectGrammarFindings(normalized);

  const clarityBase = words.length >= 8 ? 78 : 66;
  const hasCommitment = /\b(before|after|today|tomorrow|hour|pm|am|commit)\b/i.test(normalized);
  const hasAction = /\b(will|need|check|confirm|follow|send|provide|update)\b/i.test(normalized);
  const hasImpact = /\b(impact|affect|delay|risk|operation|team)\b/i.test(normalized);

  const taskCompletion = clampScore(58 + (hasAction ? 16 : 0) + (hasCommitment ? 12 : 0) + (hasImpact ? 9 : 0));
  const grammar = clampScore(78 - grammarFindings.length * 10);
  const clarity = clampScore(clarityBase + (hasAction ? 7 : 0));
  const professionalTone = clampScore(72 + (/\bplease|could you|thank you|appreciate\b/i.test(normalized) ? 10 : 0));
  const vocabulary = clampScore(65 + (hasImpact ? 10 : 0) + (hasCommitment ? 6 : 0));
  const fluency = clampScore(68 + Math.min(words.length, 16) * 1.2);
  const overallScore = clampScore(
    (taskCompletion + grammar + clarity + professionalTone + vocabulary + fluency) / 6,
  );

  const objectiveDetected: ObjectiveCode[] = objectiveCode ? [objectiveCode] : [];
  const objectiveCompleted = objectiveCode && hasAction && (hasCommitment || hasImpact) ? [objectiveCode] : [];

  return {
    scores: {
      taskCompletion,
      grammar,
      clarity,
      professionalTone,
      vocabulary,
      fluency,
    },
    overallScore,
    objectivesDetected: objectiveDetected,
    objectivesCompleted: objectiveCompleted,
    grammarFindings,
    responseRelevance: words.length >= 4 ? "relevant" : "partially_relevant",
    needsClarification: words.length < 5,
    recommendedNextAction:
      objectiveCompleted.length > 0 ? "INTRODUCE_NEW_INFORMATION" : words.length < 5 ? "CLARIFY_USER_RESPONSE" : "PROBE_OBJECTIVE",
  };
}

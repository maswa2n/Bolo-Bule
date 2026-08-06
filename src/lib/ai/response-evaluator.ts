import { writingFeedbackSchema } from "@/lib/ai/schema-validators";

type EvaluateWritingInput = {
  caseVersionId: number;
  text: string;
};

function buildFallbackWritingFeedback(text: string) {
  const normalized = text.trim();
  const improved = normalized.endsWith(".") ? normalized : `${normalized}.`;

  return {
    improvedText: improved,
    lesson: "Gunakan urutan: context -> issue -> action -> commitment time.",
    scores: {
      taskCompletion: 82,
      grammar: 75,
      clarity: 84,
      professionalTone: 85,
    },
  };
}

export async function evaluateWritingResponse(input: EvaluateWritingInput) {
  const fallback = buildFallbackWritingFeedback(input.text);
  const parsed = writingFeedbackSchema.safeParse(fallback);
  if (!parsed.success) {
    throw new Error("Writing evaluator output invalid.");
  }

  return parsed.data;
}

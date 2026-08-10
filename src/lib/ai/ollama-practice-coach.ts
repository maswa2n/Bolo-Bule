import { createClient } from "@/lib/supabase/server";
import {
  caseCandidateDraftSchema,
  practiceCoachGatewayResponseSchema,
  type CaseCandidateDraftParsed,
} from "@/lib/ai/schema-validators";
import type {
  ConversationLogMessage,
  ConversationNextAction,
  GeneratedCoachTurn,
  LearningCaseVersion,
  LlmGenerationMetadata,
  ObjectiveCode,
} from "@/types/learning";

type PracticeCoachRequest = {
  transcript: string;
  objectiveCode: ObjectiveCode | null;
  recommendedAction: ConversationNextAction;
  completionEligible: boolean;
  learnerContext: string;
  conversationHistory: ConversationLogMessage[];
  activeCase: {
    titleEn: string;
    scenarioEn: string;
    scenarioId: string;
    communicationGoal: string;
    objectives: Array<{ objectiveCode: string; description: string }>;
  };
};

type CaseCandidateDraftRequest = {
  domain: string;
  workFunction: string;
  difficulty: string;
  communicationObjective: string;
};

type GatewayResultEnvelope<T> = {
  ok: boolean;
  result?: T;
  error?: string;
};

type GatewayPracticePayload = {
  generatedTurn: GeneratedCoachTurn;
  provider: string;
  model: string;
  latencyMs: number | null;
  tokenUsage?: Record<string, unknown> | null;
};

type GatewayCasePayload = {
  draft: CaseCandidateDraftParsed;
  provider: string;
  model: string;
  latencyMs: number | null;
  tokenUsage?: Record<string, unknown> | null;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readEnvelope<T>(value: unknown): { payload: T | null; error: string | null } {
  const parsed = asObject(value);
  if (!parsed) return { payload: null, error: "Invalid gateway response shape." };

  if (parsed.ok === false) {
    const message = typeof parsed.error === "string" ? parsed.error : "Gateway returned failed response.";
    return { payload: null, error: message };
  }

  if (parsed.ok === true) {
    return { payload: (parsed.result as T | undefined) ?? null, error: null };
  }

  return { payload: parsed as unknown as T, error: null };
}

function buildFallbackMetadata(error: string): LlmGenerationMetadata {
  return {
    provider: "fallback",
    model: "state-machine",
    latencyMs: null,
    tokenUsage: { error },
    fallbackUsed: true,
  };
}

function compactHistory(history: ConversationLogMessage[]): ConversationLogMessage[] {
  return history
    .slice(-8)
    .map((item) => ({
      role: item.role,
      message: item.message.trim(),
    }))
    .filter((item) => item.message.length > 0);
}

export async function requestPracticeCoachTurn(
  request: PracticeCoachRequest,
): Promise<{ generatedTurn: GeneratedCoachTurn | null; metadata: LlmGenerationMetadata }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke("learning-llm-gateway", {
      body: {
        task: "practice_coach",
        payload: {
          ...request,
          learnerContext: request.learnerContext.trim(),
          transcript: request.transcript.trim(),
          conversationHistory: compactHistory(request.conversationHistory),
        },
      },
    });

    if (error) {
      return {
        generatedTurn: null,
        metadata: buildFallbackMetadata(error.message),
      };
    }

    const { payload, error: gatewayError } = readEnvelope<GatewayPracticePayload | GatewayResultEnvelope<GatewayPracticePayload>>(data);
    if (gatewayError || !payload) {
      return {
        generatedTurn: null,
        metadata: buildFallbackMetadata(gatewayError ?? "Empty gateway payload."),
      };
    }

    const resultObject = asObject(payload);
    const candidatePayload = (resultObject?.generatedTurn ? payload : (resultObject?.result as GatewayPracticePayload)) ?? payload;
    const validated = practiceCoachGatewayResponseSchema.safeParse(candidatePayload);
    if (!validated.success) {
      return {
        generatedTurn: null,
        metadata: buildFallbackMetadata("Gateway payload failed schema validation."),
      };
    }

    return {
      generatedTurn: validated.data.generatedTurn,
      metadata: {
        provider: validated.data.provider,
        model: validated.data.model,
        latencyMs: validated.data.latencyMs,
        tokenUsage: validated.data.tokenUsage ?? null,
        fallbackUsed: false,
      },
    };
  } catch (error) {
    return {
      generatedTurn: null,
      metadata: buildFallbackMetadata(error instanceof Error ? error.message : "Unknown LLM gateway error."),
    };
  }
}

export async function generateCandidateDraftWithLlm(
  request: CaseCandidateDraftRequest,
): Promise<{ draft: CaseCandidateDraftParsed | null; metadata: LlmGenerationMetadata }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke("learning-llm-gateway", {
      body: {
        task: "case_enrichment",
        payload: request,
      },
    });

    if (error) {
      return {
        draft: null,
        metadata: buildFallbackMetadata(error.message),
      };
    }

    const { payload, error: gatewayError } = readEnvelope<GatewayCasePayload | GatewayResultEnvelope<GatewayCasePayload>>(data);
    if (gatewayError || !payload) {
      return {
        draft: null,
        metadata: buildFallbackMetadata(gatewayError ?? "Empty enrichment payload."),
      };
    }

    const payloadObject = asObject(payload);
    const candidatePayload = (payloadObject?.draft ? payload : (payloadObject?.result as GatewayCasePayload)) ?? payload;
    const parsedPayload = asObject(candidatePayload);
    const draftParsed = caseCandidateDraftSchema.safeParse(parsedPayload?.draft ?? parsedPayload);

    if (!draftParsed.success) {
      return {
        draft: null,
        metadata: buildFallbackMetadata("Candidate draft failed schema validation."),
      };
    }

    return {
      draft: draftParsed.data,
      metadata: {
        provider: typeof parsedPayload?.provider === "string" ? parsedPayload.provider : "ollama",
        model: typeof parsedPayload?.model === "string" ? parsedPayload.model : "unknown-model",
        latencyMs: typeof parsedPayload?.latencyMs === "number" ? parsedPayload.latencyMs : null,
        tokenUsage: (parsedPayload?.tokenUsage as Record<string, unknown> | null | undefined) ?? null,
        fallbackUsed: false,
      },
    };
  } catch (error) {
    return {
      draft: null,
      metadata: buildFallbackMetadata(error instanceof Error ? error.message : "Unknown enrichment error."),
    };
  }
}

export function buildCaseSummary(activeCase: LearningCaseVersion) {
  return {
    titleEn: activeCase.title.en,
    scenarioEn: activeCase.scenario.en,
    scenarioId: activeCase.scenario.id,
    communicationGoal: activeCase.communicationGoal,
    objectives: activeCase.objectives.map((item) => ({
      objectiveCode: item.objectiveCode,
      description: item.description,
    })),
  };
}

type GatewayTranslatePayload = {
  meaningId: string;
  provider: string;
  model: string;
  latencyMs: number | null;
  tokenUsage?: Record<string, unknown> | null;
};

export async function requestPracticePhraseTranslation(
  english: string,
): Promise<{ meaningId: string | null; metadata: LlmGenerationMetadata }> {
  const trimmed = english.trim();
  if (!trimmed) {
    return { meaningId: null, metadata: buildFallbackMetadata("Empty phrase.") };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke("learning-llm-gateway", {
      body: {
        task: "translate_phrase",
        payload: { english: trimmed },
      },
    });

    if (error) {
      return {
        meaningId: null,
        metadata: buildFallbackMetadata(error.message),
      };
    }

    const { payload, error: gatewayError } = readEnvelope<
      GatewayTranslatePayload | GatewayResultEnvelope<GatewayTranslatePayload>
    >(data);

    if (gatewayError || !payload) {
      return {
        meaningId: null,
        metadata: buildFallbackMetadata(gatewayError ?? "Empty translation payload."),
      };
    }

    const payloadObject = asObject(payload);
    const candidatePayload =
      (payloadObject?.meaningId ? payload : (payloadObject?.result as GatewayTranslatePayload)) ?? payload;
    const meaningId = asObject(candidatePayload)?.meaningId;
    if (typeof meaningId !== "string" || meaningId.trim().length === 0) {
      return {
        meaningId: null,
        metadata: buildFallbackMetadata("Translation payload missing meaningId."),
      };
    }

    const parsedPayload = asObject(candidatePayload);
    return {
      meaningId: meaningId.trim(),
      metadata: {
        provider: typeof parsedPayload?.provider === "string" ? parsedPayload.provider : "ollama",
        model: typeof parsedPayload?.model === "string" ? parsedPayload.model : "unknown-model",
        latencyMs: typeof parsedPayload?.latencyMs === "number" ? parsedPayload.latencyMs : null,
        tokenUsage: (parsedPayload?.tokenUsage as Record<string, unknown> | null | undefined) ?? null,
        fallbackUsed: false,
      },
    };
  } catch (error) {
    return {
      meaningId: null,
      metadata: buildFallbackMetadata(error instanceof Error ? error.message : "Unknown translation error."),
    };
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CONVERSATION_ACTIONS = new Set([
  "PROBE_OBJECTIVE",
  "CLARIFY_USER_RESPONSE",
  "CHALLENGE_USER",
  "INTRODUCE_NEW_INFORMATION",
  "REQUEST_SPECIFIC_COMMITMENT",
  "REMEDIATE_LANGUAGE",
  "CONFIRM_UNDERSTANDING",
  "SUMMARIZE",
  "COMPLETE_SESSION",
]);

const runtimeDeno = (globalThis as unknown as {
  Deno?: {
    env: { get: (key: string) => string | undefined };
    serve: (handler: (request: Request) => Response | Promise<Response>) => void;
  };
}).Deno;

type RequestTask = "practice_coach" | "case_enrichment" | "translate_phrase";

type RequestEnvelope = {
  task: RequestTask;
  payload: Record<string, unknown>;
};

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value !== "boolean") return fallback;
  return value;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return value;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return asObject(parsed);
  } catch {
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    if (!objectMatch) return null;
    try {
      const parsed = JSON.parse(objectMatch[0]);
      return asObject(parsed);
    } catch {
      return null;
    }
  }
}

function normalizeCoachTurn(raw: Record<string, unknown>) {
  const actionRaw = asString(raw.action, "PROBE_OBJECTIVE");
  const action = CONVERSATION_ACTIONS.has(actionRaw) ? actionRaw : "PROBE_OBJECTIVE";

  const responseSupport = toStringArray(raw.responseSupport);
  const completionEligible = asBoolean(raw.completionEligible, false);
  const difficultyRaw = asString(raw.difficultyAdjustment, "maintain");
  const difficultyAdjustment =
    difficultyRaw === "increase" || difficultyRaw === "decrease" || difficultyRaw === "maintain"
      ? difficultyRaw
      : "maintain";

  return {
    action,
    targetObjective: asString(raw.targetObjective) || null,
    coachMessageEn:
      asString(raw.coachMessageEn) ||
      "Please continue with one clear response: current status, action, and commitment time.",
    coachMessageId:
      asString(raw.coachMessageId) ||
      "Silakan lanjutkan dengan satu jawaban jelas: status, tindakan, dan waktu komitmen.",
    responseSupport:
      responseSupport.length > 0
        ? responseSupport
        : [
            "I will explain the current status and impact.",
            "I will confirm the next action owner.",
            "I will commit the exact follow-up timeline.",
          ],
    difficultyAdjustment,
    reasonCode: asString(raw.reasonCode, completionEligible ? "COMPLETION_ELIGIBLE" : "LLM_GUIDANCE"),
    completionEligible,
  };
}

function normalizeCaseDraft(raw: Record<string, unknown>) {
  const objectivesRaw = Array.isArray(raw.objectives) ? raw.objectives : [];
  const objectives = objectivesRaw
    .map((item, index) => {
      const row = asObject(item);
      if (!row) return null;
      return {
        objectiveCode: asString(row.objectiveCode, `OBJECTIVE_${index + 1}`),
        description: asString(row.description, "Describe the objective clearly."),
        required: asBoolean(row.required, true),
        weight: Math.min(100, Math.max(0, asNumber(row.weight, 100))),
        sortOrder: Number.isInteger(row.sortOrder) ? Number(row.sortOrder) : index + 1,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const turnTemplatesRaw = Array.isArray(raw.turnTemplates) ? raw.turnTemplates : [];
  const turnTemplates = turnTemplatesRaw
    .map((item, index) => {
      const row = asObject(item);
      if (!row) return null;
      const support = toStringArray(row.responseSupport);
      return {
        turnNumber: Number.isInteger(row.turnNumber) ? Number(row.turnNumber) : index + 1,
        objectiveCode: asString(row.objectiveCode) || null,
        coachMessageEn:
          asString(row.coachMessageEn) || "Could you explain your latest status and commitment clearly?",
        coachMessageId:
          asString(row.coachMessageId) || "Tolong jelaskan status terbaru dan komitmen Anda dengan jelas.",
        responseSupport:
          support.length > 0
            ? support
            : [
                "I will state the latest status update.",
                "I will describe the impact and corrective action.",
                "I will confirm the timeline and follow-up owner.",
              ],
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const languageTargetsRaw = asObject(raw.languageTargets) ?? {};
  return {
    titleEn: asString(raw.titleEn, "Generated Communication Case"),
    titleId: asString(raw.titleId, "Kasus Komunikasi Buatan"),
    scenarioEn: asString(raw.scenarioEn, "A professional conversation case generated from practice demand."),
    scenarioId: asString(raw.scenarioId, "Kasus percakapan profesional yang dibentuk dari kebutuhan latihan."),
    communicationGoal: asString(raw.communicationGoal, "Reach a clear professional commitment."),
    objectives:
      objectives.length > 0
        ? objectives
        : [
            {
              objectiveCode: "PRIMARY_OBJECTIVE",
              description: "Deliver a clear and professional commitment.",
              required: true,
              weight: 100,
              sortOrder: 1,
            },
          ],
    turnTemplates:
      turnTemplates.length > 0
        ? turnTemplates
        : [
            {
              turnNumber: 1,
              objectiveCode: "PRIMARY_OBJECTIVE",
              coachMessageEn: "Please explain your action plan and the exact follow-up timeline.",
              coachMessageId: "Tolong jelaskan rencana tindakan dan timeline follow-up secara spesifik.",
              responseSupport: [
                "I will explain the current status first.",
                "I will clarify the impact and corrective action.",
                "I will confirm the exact follow-up time.",
              ],
            },
          ],
    languageTargets: {
      grammar: toStringArray(languageTargetsRaw.grammar),
      vocabulary: toStringArray(languageTargetsRaw.vocabulary),
      functionalLanguage: toStringArray(languageTargetsRaw.functionalLanguage),
    },
  };
}

async function fetchWithRetry(
  url: string,
  initFactory: () => RequestInit,
  retryCount: number,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await fetch(url, initFactory());
      if (response.ok || attempt >= retryCount) return response;
      if (response.status >= 400 && response.status < 500) return response;
    } catch (error) {
      lastError = error;
      if (attempt >= retryCount) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Unknown fetch retry failure.");
}

function getOllamaConfig() {
  const provider = asString(runtimeDeno?.env.get("LLM_PROVIDER"), "ollama").toLowerCase();
  const baseUrl = asString(runtimeDeno?.env.get("OLLAMA_BASE_URL"), "http://127.0.0.1:11434");
  const model = asString(runtimeDeno?.env.get("OLLAMA_MODEL"), "qwen2.5:7b-instruct");
  const apiKey = asString(runtimeDeno?.env.get("OLLAMA_API_KEY"), "");
  const timeoutMs = Number(runtimeDeno?.env.get("OLLAMA_TIMEOUT_MS") ?? "90000");

  return {
    provider,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    model,
    apiKey,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 1000 ? timeoutMs : 90000,
  };
}

async function callOllama(payload: {
  systemPrompt: string;
  userPrompt: string;
  timeoutMs: number;
  model: string;
  baseUrl: string;
  apiKey: string;
}) {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort("Ollama request timeout"), payload.timeoutMs);
  const start = Date.now();

  try {
    const response = await fetchWithRetry(
      `${payload.baseUrl}/api/chat`,
      () => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (payload.apiKey.length > 0) {
          headers.Authorization = `Bearer ${payload.apiKey}`;
        }

        return {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model: payload.model,
            stream: false,
            format: "json",
            options: {
              temperature: 0.2,
              top_p: 0.9,
            },
            messages: [
              { role: "system", content: payload.systemPrompt },
              { role: "user", content: payload.userPrompt },
            ],
          }),
        };
      },
      1,
    );

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`Ollama HTTP ${response.status}: ${bodyText.slice(0, 300)}`);
    }

    const responseJson = asObject(await response.json());
    const message = asObject(responseJson?.message);
    const content = asString(message?.content);
    const parsed = parseJsonObject(content);
    if (!parsed) {
      throw new Error("Ollama returned non-JSON response.");
    }

    const latencyMs = Date.now() - start;
    return {
      parsed,
      latencyMs,
      tokenUsage: {
        prompt_eval_count: asNumber(responseJson?.prompt_eval_count, 0),
        eval_count: asNumber(responseJson?.eval_count, 0),
      },
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}

function buildPracticePrompts(payload: Record<string, unknown>) {
  const systemPrompt = [
    "You are a strict but supportive English speaking coach for workplace communication.",
    "Always answer with JSON only.",
    "Never produce unsafe, discriminatory, or insulting content.",
    "Respect learning objective and keep guidance concise and actionable.",
    "Use this JSON schema exactly:",
    '{"action":"PROBE_OBJECTIVE","targetObjective":"string|null","coachMessageEn":"string","coachMessageId":"string","responseSupport":["string"],"difficultyAdjustment":"maintain","reasonCode":"string","completionEligible":false}',
  ].join("\n");

  const userPrompt = JSON.stringify(
    {
      task: "practice_coach",
      transcript: asString(payload.transcript),
      objectiveCode: asString(payload.objectiveCode) || null,
      recommendedAction: asString(payload.recommendedAction, "PROBE_OBJECTIVE"),
      completionEligible: asBoolean(payload.completionEligible, false),
      learnerContext: asString(payload.learnerContext),
      conversationHistory: Array.isArray(payload.conversationHistory) ? payload.conversationHistory.slice(-8) : [],
      activeCase: payload.activeCase ?? {},
      instructions: [
        "If completionEligible is true, set action COMPLETE_SESSION and targetObjective null.",
        "Keep coachMessageEn <= 40 words.",
        "coachMessageId must be Indonesian translation.",
        "responseSupport must contain 2-4 short example responses.",
      ],
    },
    null,
    2,
  );

  return { systemPrompt, userPrompt };
}

function buildTranslatePhrasePrompts(payload: Record<string, unknown>) {
  const systemPrompt = [
    "You are an expert Indonesian-English translator for workplace language learners.",
    "Translate the given English practice sentence into natural, fluent Bahasa Indonesia.",
    "Keep meaning faithful, tone professional, and wording simple for beginners.",
    "Return JSON only with this schema:",
    '{"meaningId":"string"}',
  ].join("\n");

  const userPrompt = JSON.stringify(
    {
      task: "translate_phrase",
      english: asString(payload.english),
      instructions: [
        "Output one complete Indonesian sentence in meaningId.",
        "Do not mix English words unless they are proper nouns.",
        "Do not add explanations outside JSON.",
      ],
    },
    null,
    2,
  );

  return { systemPrompt, userPrompt };
}

function normalizePhraseTranslation(raw: Record<string, unknown>) {
  return {
    meaningId:
      asString(raw.meaningId) ||
      asString(raw.translation) ||
      asString(raw.indonesian) ||
      "",
  };
}

function buildCasePrompts(payload: Record<string, unknown>) {
  const systemPrompt = [
    "You are an expert case designer for business English speaking practice.",
    "Return JSON only with professional, realistic, and safe content.",
    "Use this schema:",
    '{"titleEn":"string","titleId":"string","scenarioEn":"string","scenarioId":"string","communicationGoal":"string","objectives":[{"objectiveCode":"string","description":"string","required":true,"weight":100,"sortOrder":1}],"turnTemplates":[{"turnNumber":1,"objectiveCode":"string|null","coachMessageEn":"string","coachMessageId":"string","responseSupport":["string"]}],"languageTargets":{"grammar":["string"],"vocabulary":["string"],"functionalLanguage":["string"]}}',
  ].join("\n");

  const userPrompt = JSON.stringify(
    {
      task: "case_enrichment",
      domain: asString(payload.domain),
      workFunction: asString(payload.workFunction),
      difficulty: asString(payload.difficulty),
      communicationObjective: asString(payload.communicationObjective),
      instructions: [
        "Generate one realistic workplace case.",
        "Provide at least 2 objectives and 2 turnTemplates.",
        "Bilingual alignment must be consistent between English and Indonesian text.",
      ],
    },
    null,
    2,
  );

  return { systemPrompt, userPrompt };
}

const serve =
  runtimeDeno?.serve ??
  ((_: (request: Request) => Response | Promise<Response>) => {
    throw new Error("Deno runtime is required for learning-llm-gateway.");
  });

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  const config = getOllamaConfig();
  if (config.provider !== "ollama") {
    return jsonResponse(400, { ok: false, error: "Only LLM_PROVIDER=ollama is supported for this gateway." });
  }

  let envelope: RequestEnvelope;
  try {
    envelope = (await request.json()) as RequestEnvelope;
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
  }

  if (!envelope || !envelope.task || !envelope.payload) {
    return jsonResponse(400, { ok: false, error: "Missing task or payload." });
  }

  try {
    if (envelope.task === "practice_coach") {
      const prompts = buildPracticePrompts(envelope.payload);
      const ollamaResult = await callOllama({
        ...prompts,
        timeoutMs: config.timeoutMs,
        model: config.model,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      });

      const normalized = normalizeCoachTurn(ollamaResult.parsed);
      return jsonResponse(200, {
        ok: true,
        task: "practice_coach",
        result: {
          generatedTurn: normalized,
          provider: "ollama",
          model: config.model,
          latencyMs: ollamaResult.latencyMs,
          tokenUsage: ollamaResult.tokenUsage,
        },
      });
    }

    if (envelope.task === "case_enrichment") {
      const prompts = buildCasePrompts(envelope.payload);
      const ollamaResult = await callOllama({
        ...prompts,
        timeoutMs: config.timeoutMs,
        model: config.model,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      });

      const normalizedDraft = normalizeCaseDraft(ollamaResult.parsed);
      return jsonResponse(200, {
        ok: true,
        task: "case_enrichment",
        result: {
          draft: normalizedDraft,
          provider: "ollama",
          model: config.model,
          latencyMs: ollamaResult.latencyMs,
          tokenUsage: ollamaResult.tokenUsage,
        },
      });
    }

    if (envelope.task === "translate_phrase") {
      const english = asString(envelope.payload.english);
      if (!english) {
        return jsonResponse(400, { ok: false, error: "Missing english phrase." });
      }

      const prompts = buildTranslatePhrasePrompts(envelope.payload);
      const ollamaResult = await callOllama({
        ...prompts,
        timeoutMs: Math.min(config.timeoutMs, 30000),
        model: config.model,
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
      });

      const normalized = normalizePhraseTranslation(ollamaResult.parsed);
      if (!normalized.meaningId) {
        return jsonResponse(500, { ok: false, error: "Translation model returned empty meaningId." });
      }

      return jsonResponse(200, {
        ok: true,
        task: "translate_phrase",
        result: {
          meaningId: normalized.meaningId,
          provider: "ollama",
          model: config.model,
          latencyMs: ollamaResult.latencyMs,
          tokenUsage: ollamaResult.tokenUsage,
        },
      });
    }

    return jsonResponse(400, { ok: false, error: "Unsupported task." });
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected gateway failure.",
    });
  }
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_TEXT_LENGTH = 600;

const runtimeDeno = (globalThis as unknown as {
  Deno?: {
    env: { get: (key: string) => string | undefined };
    serve: (handler: (request: Request) => Response | Promise<Response>) => void;
  };
}).Deno;

function asString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

async function synthesizeOpenAi(text: string): Promise<ArrayBuffer | null> {
  const apiKey =
    asString(runtimeDeno?.env.get("TTS_OPENAI_API_KEY")) ||
    asString(runtimeDeno?.env.get("OPENAI_API_KEY"));
  if (!apiKey) return null;

  const model = asString(runtimeDeno?.env.get("TTS_OPENAI_MODEL"), "tts-1");
  const voice = asString(runtimeDeno?.env.get("TTS_OPENAI_VOICE"), "echo");

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: "mp3",
    }),
  });

  if (!response.ok) return null;
  return response.arrayBuffer();
}

const serve =
  runtimeDeno?.serve ??
  ((_: (request: Request) => Response | Promise<Response>) => {
    throw new Error("Deno runtime is required for coach-tts.");
  });

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON body." });
  }

  const text = asString(body.text);
  if (!text) {
    return jsonResponse(400, { ok: false, error: "Missing text." });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonResponse(400, { ok: false, error: "Text too long." });
  }

  const audio = await synthesizeOpenAi(text);
  if (!audio || audio.byteLength === 0) {
    return jsonResponse(503, {
      ok: false,
      fallback: "browser",
      error: "Cloud TTS unavailable. Use browser speech synthesis.",
    });
  }

  return new Response(audio, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
});

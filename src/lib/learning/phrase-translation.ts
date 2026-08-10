import { createClient } from "@/lib/supabase/server";
import { requestPracticePhraseTranslation } from "@/lib/ai/ollama-practice-coach";
import {
  getKnownPhraseMeaning,
  normalizePhraseKey,
  translateEnglishToIndonesian,
} from "@/lib/learning/response-support-guide";

const PHRASE_LLM_TIMEOUT_MS = 8_000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timeoutId = setTimeout(() => resolve(null), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function resolvePracticePhraseMeaning(english: string): Promise<{
  meaningId: string;
  source: "known" | "cache" | "llm" | "local";
}> {
  const trimmed = english.trim();
  const normalized = normalizePhraseKey(trimmed);
  const localFallback = translateEnglishToIndonesian(trimmed);

  if (!normalized) {
    return { meaningId: trimmed, source: "local" };
  }

  const knownMeaning = getKnownPhraseMeaning(trimmed);
  if (knownMeaning) {
    return { meaningId: knownMeaning, source: "known" };
  }

  try {
    const supabase = await createClient();
    const { data: cached, error: cacheError } = await supabase
      .from("practice_phrase_translations")
      .select("meaning_id, provider")
      .eq("source_text_normalized", normalized)
      .maybeSingle();

    const cachedRow = cached as { meaning_id: string; provider: string } | null;

    if (!cacheError && cachedRow?.meaning_id) {
      return {
        meaningId: cachedRow.meaning_id,
        source: cachedRow.provider === "local" ? "local" : "cache",
      };
    }

    const llmResult = await withTimeout(
      requestPracticePhraseTranslation(trimmed),
      PHRASE_LLM_TIMEOUT_MS,
    );

    if (llmResult?.meaningId) {
      const provider = llmResult.metadata.fallbackUsed ? "local" : "ollama";
      const { error: upsertError } = await supabase.from("practice_phrase_translations").upsert(
        {
          source_text: trimmed,
          source_text_normalized: normalized,
          meaning_id: llmResult.meaningId,
          provider,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "source_text_normalized" },
      );

      if (!upsertError) {
        return {
          meaningId: llmResult.meaningId,
          source: llmResult.metadata.fallbackUsed ? "local" : "llm",
        };
      }
    }
  } catch {
    // Fall through to local fallback below.
  }

  return { meaningId: localFallback, source: "local" };
}

"use server";

import { resolvePracticePhraseMeaning } from "@/lib/learning/phrase-translation";

export async function translateSupportOptionAction(payload: { english: string }) {
  try {
    const trimmed = payload.english.trim();
    if (!trimmed) {
      return { error: "Kalimat jawaban kosong." };
    }

    const result = await resolvePracticePhraseMeaning(trimmed);
    return {
      meaningId: result.meaningId,
      source: result.source,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Gagal menerjemahkan kalimat jawaban.",
    };
  }
}

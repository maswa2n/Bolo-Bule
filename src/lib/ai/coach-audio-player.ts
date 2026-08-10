import { canUseBrowserTts, primeCoachBrowserTts, speakCoachSync } from "@/lib/ai/tts";

const MAX_PREFETCH_TEXT_LENGTH = 600;
const audioBlobCache = new Map<string, string>();

let sharedAudio: HTMLAudioElement | null = null;
let mobileAudioPrimed = false;
let prefetchAbort: AbortController | null = null;

function hashCoachText(text: string): string {
  const trimmed = text.trim();
  let hash = 0;
  for (let index = 0; index < trimmed.length; index += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(index)) >>> 0;
  }
  return `${hash}:${trimmed.length}`;
}

function ensureSharedAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = "auto";
    sharedAudio.setAttribute("playsinline", "true");
  }
  return sharedAudio;
}

export function primeMobileCoachAudio(): void {
  primeCoachBrowserTts();
  if (typeof window === "undefined" || mobileAudioPrimed) return;
  mobileAudioPrimed = true;

  const audio = ensureSharedAudio();
  if (!audio) return;

  // Minimal silent MP3 unlocks iOS media playback for later coach audio.
  audio.src =
    "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  void audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => {
    // Browser TTS priming remains the primary unlock path.
  });
}

export function revokeCoachAudioCache(): void {
  for (const url of audioBlobCache.values()) {
    URL.revokeObjectURL(url);
  }
  audioBlobCache.clear();
  prefetchAbort?.abort();
  prefetchAbort = null;
}

export async function prefetchCoachAudio(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_PREFETCH_TEXT_LENGTH) return;

  const cacheKey = hashCoachText(trimmed);
  if (audioBlobCache.has(cacheKey)) return;

  prefetchAbort?.abort();
  const controller = new AbortController();
  prefetchAbort = controller;

  try {
    const response = await fetch("/api/coach-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal,
    });

    if (!response.ok || !response.headers.get("content-type")?.includes("audio")) {
      return;
    }

    const blob = await response.blob();
    if (blob.size === 0 || controller.signal.aborted) return;

    const existing = audioBlobCache.get(cacheKey);
    if (existing) {
      URL.revokeObjectURL(existing);
    }
    audioBlobCache.set(cacheKey, URL.createObjectURL(blob));
  } catch {
    // Cloud prefetch is optional; browser TTS handles playback fallback.
  } finally {
    if (prefetchAbort === controller) {
      prefetchAbort = null;
    }
  }
}

export function playCoachAudio(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  primeMobileCoachAudio();

  const cacheKey = hashCoachText(trimmed);
  const cachedUrl = audioBlobCache.get(cacheKey);
  const audio = ensureSharedAudio();

  if (cachedUrl && audio) {
    audio.pause();
    audio.currentTime = 0;
    audio.src = cachedUrl;
    void audio.play().catch(() => {
      speakCoachSync(trimmed);
    });
    return true;
  }

  return speakCoachSync(trimmed);
}

export function isCoachAudioSupported(): boolean {
  return canUseBrowserTts() || typeof window !== "undefined";
}

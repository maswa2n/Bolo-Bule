export type TtsPayload = {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
};

/**
 * Coach voice target profile:
 * bright, crisp, non-boomy male, mid-to-high pitch, clear articulation, moderate pace.
 *
 * Cloud picks (coach-tts edge function when OPENAI/TTS key configured):
 * - Primary: OpenAI tts-1 voice `echo`
 * - Alt env: TTS_OPENAI_VOICE= alloy | nova
 */
const COACH_VOICE_PREFERENCES: Array<{ pattern: RegExp; score: number }> = [
  { pattern: /ryan.*natural|natural.*ryan/i, score: 100 },
  { pattern: /guy.*online.*natural|natural.*guy/i, score: 96 },
  { pattern: /jason.*natural|natural.*jason/i, score: 94 },
  { pattern: /\bjason\b/i, score: 90 },
  { pattern: /andrew.*multilingual|multilingual.*andrew/i, score: 88 },
  { pattern: /\balex\b/i, score: 87 },
  { pattern: /ryan/i, score: 86 },
  { pattern: /christopher.*multilingual/i, score: 72 },
  { pattern: /microsoft.*online.*natural.*\(.*en-us.*\)/i, score: 70 },
  { pattern: /google.*english.*\(.*us.*\)/i, score: 68 },
  { pattern: /google.*us.*english/i, score: 66 },
  { pattern: /neural|natural/i, score: 58 },
];

const COACH_VOICE_AVOID: RegExp[] = [
  /zira|jenny|aria|susan|heather|sonia|hazel|michelle|libby|emma|samantha|karen|moira|fiona|tessa|veena|linda|sara/i,
  /david desktop|mark desktop|richard|james|george|daniel desktop|tom/i,
  /christopher desktop|guy desktop/i,
];

const COACH_TTS_DEFAULTS = {
  lang: "en-US",
  rate: 0.94,
  pitch: 1.08,
} as const;

let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let cachedCoachVoice: SpeechSynthesisVoice | null | undefined;
let browserTtsPrimed = false;

export function canUseBrowserTts() {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

function listBrowserVoices(): SpeechSynthesisVoice[] {
  if (!canUseBrowserTts()) return [];
  return window.speechSynthesis.getVoices();
}

function waitForBrowserVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!canUseBrowserTts()) return Promise.resolve([]);

  const existing = listBrowserVoices();
  if (existing.length > 0) return Promise.resolve(existing);

  if (!voicesReadyPromise) {
    voicesReadyPromise = new Promise((resolve) => {
      const finish = () => {
        window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(listBrowserVoices());
      };

      const onVoicesChanged = () => {
        if (listBrowserVoices().length > 0) finish();
      };

      window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      window.setTimeout(finish, timeoutMs);
    });
  }

  return voicesReadyPromise;
}

function scoreCoachVoice(voice: SpeechSynthesisVoice): number {
  if (COACH_VOICE_AVOID.some((pattern) => pattern.test(voice.name))) {
    return -100;
  }

  let score = 0;
  for (const preference of COACH_VOICE_PREFERENCES) {
    if (preference.pattern.test(voice.name)) {
      score = Math.max(score, preference.score);
    }
  }

  if (voice.lang.toLowerCase().startsWith("en-us")) score += 8;
  else if (voice.lang.toLowerCase().startsWith("en-gb")) score += 6;
  else if (voice.lang.toLowerCase().startsWith("en-au")) score += 4;
  else if (!voice.lang.toLowerCase().startsWith("en")) score -= 20;

  if (voice.default && score >= 0) score += 2;
  if (/female|woman/i.test(voice.name)) score -= 40;

  return score;
}

function pickFallbackBrowserVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const englishUs =
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us") && !/female|woman/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en-us"));
  if (englishUs) return englishUs;

  const english =
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en") && !/female|woman/i.test(voice.name)) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));
  if (english) return english;

  return voices[0] ?? null;
}

export function pickCoachBrowserVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;

  const ranked = voices
    .map((voice) => ({ voice, score: scoreCoachVoice(voice) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.voice ?? pickFallbackBrowserVoice(voices);
}

export async function getCoachBrowserVoice(): Promise<SpeechSynthesisVoice | null> {
  if (cachedCoachVoice !== undefined) return cachedCoachVoice;
  const voices = await waitForBrowserVoices();
  cachedCoachVoice = pickCoachBrowserVoice(voices);
  return cachedCoachVoice;
}

function resolveCoachVoiceForSpeak(): SpeechSynthesisVoice | null {
  if (cachedCoachVoice !== undefined) {
    return cachedCoachVoice;
  }

  const voices = listBrowserVoices();
  const resolved = pickCoachBrowserVoice(voices);
  cachedCoachVoice = resolved;
  return resolved;
}

function applyCoachVoiceSettings(utterance: SpeechSynthesisUtterance, voice: SpeechSynthesisVoice | null) {
  utterance.lang = voice?.lang ?? COACH_TTS_DEFAULTS.lang;
  utterance.rate = COACH_TTS_DEFAULTS.rate;
  utterance.pitch = COACH_TTS_DEFAULTS.pitch;
  if (voice) utterance.voice = voice;
}

function resumeSpeechSynthesisIfNeeded() {
  if (!canUseBrowserTts()) return;
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

/**
 * Prime browser speech synthesis during a user gesture (required on iOS Safari).
 */
export function primeCoachBrowserTts(): void {
  if (!canUseBrowserTts() || browserTtsPrimed) return;
  browserTtsPrimed = true;

  void waitForBrowserVoices().then((voices) => {
    cachedCoachVoice = pickCoachBrowserVoice(voices);
  });

  try {
    resumeSpeechSynthesisIfNeeded();
    const unlockUtterance = new SpeechSynthesisUtterance("\u200b");
    unlockUtterance.volume = 0.01;
    unlockUtterance.rate = 1;
    window.speechSynthesis.speak(unlockUtterance);
  } catch {
    // Non-fatal; speakCoachSync still attempts playback.
  }
}

export function speakWithBrowserTts(payload: TtsPayload) {
  if (!canUseBrowserTts()) return false;

  const utterance = new SpeechSynthesisUtterance(payload.text);
  utterance.lang = payload.lang ?? "en-US";
  utterance.rate = payload.rate ?? 0.92;
  if (typeof payload.pitch === "number") utterance.pitch = payload.pitch;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  resumeSpeechSynthesisIfNeeded();
  window.speechSynthesis.speak(utterance);
  return true;
}

/**
 * Synchronous browser TTS — must run directly inside a tap/click handler on iOS.
 */
export function speakCoachSync(text: string): boolean {
  if (!canUseBrowserTts()) return false;

  const trimmed = text.trim();
  if (!trimmed) return false;

  const voice = resolveCoachVoiceForSpeak();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  applyCoachVoiceSettings(utterance, voice);

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  resumeSpeechSynthesisIfNeeded();
  window.speechSynthesis.speak(utterance);
  return true;
}

export async function speakCoachWithBrowserTts(text: string): Promise<boolean> {
  if (!canUseBrowserTts()) return false;

  const trimmed = text.trim();
  if (!trimmed) return false;

  if (cachedCoachVoice === undefined) {
    void getCoachBrowserVoice();
  }

  return speakCoachSync(trimmed);
}

export function getCoachVoiceProfileSummary() {
  return {
    target: "bright crisp male, mid-high pitch, moderate pace",
    browserDefaults: COACH_TTS_DEFAULTS,
    cloudPrimary: "OpenAI tts-1 echo (coach-tts edge function)",
    cloudAlternates: ["OpenAI alloy", "OpenAI nova"],
    cloudAvoid: ["OpenAI onyx (too deep for coach profile)"],
  };
}

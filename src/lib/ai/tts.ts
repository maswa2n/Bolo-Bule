export type TtsPayload = {
  text: string;
  lang?: string;
  rate?: number;
};

export function canUseBrowserTts() {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

export function speakWithBrowserTts(payload: TtsPayload) {
  if (!canUseBrowserTts()) return false;
  const utterance = new SpeechSynthesisUtterance(payload.text);
  utterance.lang = payload.lang ?? "en-US";
  utterance.rate = payload.rate ?? 0.92;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  return true;
}

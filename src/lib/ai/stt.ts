export type SttResult = {
  transcript: string;
  normalizedTranscript: string;
  confidence: number;
};

export function normalizeTranscript(transcript: string): string {
  return transcript.replace(/\s+/g, " ").trim();
}

export async function transcribeVoiceInput(rawTranscript: string): Promise<SttResult> {
  const normalizedTranscript = normalizeTranscript(rawTranscript);
  return {
    transcript: rawTranscript,
    normalizedTranscript,
    confidence: normalizedTranscript.length > 0 ? 0.82 : 0,
  };
}

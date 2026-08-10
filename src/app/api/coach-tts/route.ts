import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const MAX_TEXT_LENGTH = 600;

export async function POST(request: Request) {
  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "Missing text." }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "Text too long." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { fallback: "browser", error: "Supabase env is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/coach-tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token ?? supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({ text }),
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (response.ok && contentType.includes("audio")) {
      const audioBuffer = await response.arrayBuffer();
      if (audioBuffer.byteLength === 0) {
        return NextResponse.json(
          { fallback: "browser", error: "Empty audio response." },
          { status: 503 },
        );
      }

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    let payload: { fallback?: string; error?: string } | null = null;
    if (contentType.includes("application/json")) {
      payload = (await response.json()) as { fallback?: string; error?: string };
    }

    return NextResponse.json(
      {
        fallback: payload?.fallback ?? "browser",
        error: payload?.error ?? "Cloud TTS unavailable.",
      },
      { status: response.status >= 400 ? response.status : 503 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to synthesize coach audio.";
    return NextResponse.json({ fallback: "browser", error: message }, { status: 503 });
  }
}

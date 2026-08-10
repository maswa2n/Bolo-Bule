import { NextResponse } from "next/server";

import { getSpeakingSkillReport } from "@/lib/learning/speaking-report";

export async function GET() {
  try {
    const report = await getSpeakingSkillReport();
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build speaking report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

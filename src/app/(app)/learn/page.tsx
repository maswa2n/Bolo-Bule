import Link from "next/link";

import { SpeakingSkillReportView } from "@/components/learning/SpeakingSkillReportView";
import { getSpeakingSkillReport } from "@/lib/learning/speaking-report";

export default async function LearnPage() {
  let report;
  try {
    report = await getSpeakingSkillReport();
  } catch {
    report = null;
  }

  if (!report) {
    return (
      <div className="bb-glass-panel rounded-2xl p-6 text-sm text-slate-600">
        Raport belum tersedia. Mulai latihan di{" "}
        <Link href="/practice" className="font-semibold text-blue-600">
          Practice
        </Link>
        .
      </div>
    );
  }

  return <SpeakingSkillReportView report={report} />;
}

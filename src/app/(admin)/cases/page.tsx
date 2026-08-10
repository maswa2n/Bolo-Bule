import Link from "next/link";

import { CandidateGeneratorForm } from "@/components/case/CandidateGeneratorForm";
import { listCaseCandidatesAction, publishCaseCandidateAction } from "./actions";

function candidateStatusLabel(status: string, publishedCaseVersionId: number | null) {
  if (status === "approved" || publishedCaseVersionId) {
    return { text: "Published · siap latihan", className: "bb-badge-success" };
  }
  if (status === "pass_auto_validation" || status === "ready_for_human_review") {
    return { text: "Siap publish", className: "bb-badge-info" };
  }
  return { text: status, className: "bb-badge-warning" };
}

export default async function AdminCasesPage() {
  const candidates = await listCaseCandidatesAction();

  return (
    <div className="space-y-6">
      <section className="bb-practice-hero bb-motion-rise rounded-3xl p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-900">
            Admin console
          </span>
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-cyan-900">LLM case pipeline</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Admin Console</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Case Candidate Review</h1>
        <p className="mt-2 text-sm text-slate-600">
          Generate candidate → tinjau → <strong>Approve &amp; Publish</strong> → kasus otomatis masuk{" "}
          <Link href="/practice" className="font-semibold text-blue-700 hover:underline">
            Practice Studio
          </Link>
          .
        </p>
      </section>

      <section className="grid gap-4">
        <CandidateGeneratorForm />

        {candidates.length === 0 ? (
          <article className="bb-glass-panel bb-motion-rise bb-motion-delay-1 rounded-2xl border-dashed p-5 text-sm text-slate-600">
            Belum ada candidate baru. Jalankan generator atau buat demand signal terlebih dahulu.
          </article>
        ) : null}

        {candidates.map((candidate) => {
          const statusBadge = candidateStatusLabel(candidate.status, candidate.publishedCaseVersionId);
          const isPublished = Boolean(candidate.publishedCaseVersionId);

          return (
            <article key={candidate.id} className="bb-glass-panel bb-interactive-lift bb-motion-rise bb-motion-delay-1 rounded-2xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{candidate.domain}</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">{candidate.titleEn}</h2>
                  <p className="mt-2 text-sm text-slate-600">{candidate.scenarioId}</p>
                </div>
                <span
                  className={[
                    "bb-badge bb-state-enter px-3 py-1 text-xs font-semibold",
                    statusBadge.className,
                    isPublished ? "bb-celebrate-subtle" : "",
                  ].join(" ")}
                >
                  {statusBadge.text}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {isPublished ? (
                  <>
                    <Link
                      href="/practice"
                      className="bb-btn-secondary bb-press-depth bb-tap-target px-3 py-2 text-sm font-semibold"
                    >
                      Buka di Latihan
                    </Link>
                    <p className="self-center text-xs text-slate-500">
                      Case version #{candidate.publishedCaseVersionId} sudah ada di Case Bank.
                    </p>
                  </>
                ) : (
                  <form action={publishCaseCandidateAction}>
                    <input type="hidden" name="candidateId" value={candidate.id} />
                    <button
                      type="submit"
                      className="bb-btn-primary bb-press-depth bb-tap-target px-3 py-2 text-sm font-semibold"
                    >
                      Approve &amp; Publish
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

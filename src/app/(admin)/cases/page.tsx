import { CandidateGeneratorForm } from "@/components/case/CandidateGeneratorForm";
import { listCaseCandidatesAction, publishCaseCandidateAction } from "./actions";

export default async function AdminCasesPage() {
  const candidates = await listCaseCandidatesAction();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/50 bg-white/85 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Admin Console</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Case Candidate Review</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tinjau candidate, validasi hasil auto-check, lalu approve untuk publish.
        </p>
      </section>

      <section className="grid gap-4">
        <CandidateGeneratorForm />

        {candidates.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-5 text-sm text-slate-600">
            Belum ada candidate baru. Jalankan generator atau buat demand signal terlebih dahulu.
          </article>
        ) : null}

        {candidates.map((candidate) => (
          <article key={candidate.id} className="rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{candidate.domain}</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">{candidate.titleEn}</h2>
                <p className="mt-2 text-sm text-slate-600">{candidate.scenarioId}</p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {candidate.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <form action={publishCaseCandidateAction}>
                <input type="hidden" name="candidateId" value={candidate.id} />
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Approve & Publish
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

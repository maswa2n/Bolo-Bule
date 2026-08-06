import { EvaluationRunnerCard } from "@/components/case/EvaluationRunnerCard";
import { listEvaluationRunsAction } from "./actions";

export default async function AdminEvaluationPage() {
  const runs = await listEvaluationRunsAction();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/50 bg-white/85 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Evaluation Lab</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Prompt and Model Regression</h1>
        <p className="mt-2 text-sm text-slate-600">
          Jalankan quality gate sebelum perubahan prompt/model dipromosikan ke production.
        </p>
      </section>

      <EvaluationRunnerCard />

      <section className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Runs</h2>
        <div className="mt-3 space-y-2">
          {runs.length === 0 ? (
            <p className="text-sm text-slate-600">Belum ada evaluation run.</p>
          ) : null}
          {runs.map((run) => (
            <article key={run.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-3">
                <p>
                  <strong>Run #{run.id}</strong> · {run.run_status}
                </p>
                <p className="text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import { listPublishedCases } from "@/lib/learning/case-repository";
import { PracticeWorkspace } from "./practice-workspace";

export default async function PracticePage() {
  const cases = await listPublishedCases();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/50 bg-white/85 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Practice Studio</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Speaking and Writing in One Flow</h1>
        <p className="mt-2 text-sm text-slate-600">
          Satu kasus dipakai untuk latihan speaking dan writing agar transfer belajar lebih konsisten.
        </p>
      </section>

      <PracticeWorkspace cases={cases} />
    </div>
  );
}

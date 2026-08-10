import { listPublishedCases } from "@/lib/learning/case-repository";
import { PracticeWorkspace } from "./practice-workspace";

export default async function PracticePage() {
  const cases = await listPublishedCases();

  return (
    <div className="space-y-6">
      <section className="bb-practice-hero bb-motion-rise rounded-3xl p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-900">
            Practice Studio
          </span>
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-blue-900">
            Mobile-first flow
          </span>
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-amber-900">
            Voice + writing loop
          </span>
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-slate-900 sm:text-3xl">
          Speaking and Writing in One Flow
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Satu kasus dipakai untuk latihan speaking dan writing agar transfer belajar lebih konsisten.
        </p>
      </section>

      <PracticeWorkspace cases={cases} />
    </div>
  );
}

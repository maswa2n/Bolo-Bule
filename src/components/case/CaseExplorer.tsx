"use client";

import type { LearningCaseVersion } from "@/types/learning";

type CaseExplorerProps = {
  cases: LearningCaseVersion[];
  activeCaseId: number | null;
  onSelectCase: (caseVersionId: number) => void;
};

export function CaseExplorer({ cases, activeCaseId, onSelectCase }: CaseExplorerProps) {
  return (
    <section className="rounded-3xl border border-white/50 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Case Bank</p>
          <h2 className="text-xl font-semibold text-slate-900">Pilih Kasus Latihan</h2>
        </div>
        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
          {cases.length} cases
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cases.map((item) => {
          const active = activeCaseId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCase(item.id)}
              className={[
                "rounded-2xl border p-4 text-left transition",
                active
                  ? "border-blue-400 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/50",
              ].join(" ")}
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {item.domain} · {item.internalLevel}
              </p>
              <h3 className="text-base font-semibold text-slate-900">{item.title.en}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.scenario.id}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.objectives.slice(0, 3).map((objective) => (
                  <span
                    key={objective.objectiveCode}
                    className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700"
                  >
                    {objective.objectiveCode}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

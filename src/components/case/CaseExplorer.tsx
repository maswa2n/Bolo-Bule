"use client";

import type { LearningCaseVersion } from "@/types/learning";

type CaseExplorerProps = {
  cases: LearningCaseVersion[];
  activeCaseId: number | null;
  onSelectCase: (caseVersionId: number) => void;
};

export function CaseExplorer({ cases, activeCaseId, onSelectCase }: CaseExplorerProps) {
  return (
    <section className="bb-glass-panel bb-motion-rise bb-motion-delay-1 rounded-3xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Case Bank</p>
          <h2 className="text-xl font-semibold text-slate-900">Pilih Kasus Latihan</h2>
        </div>
        <span className="w-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">
          {cases.length} cases
        </span>
      </div>

      <div className="bb-scrollbar-hidden flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
        {cases.map((item) => {
          const active = activeCaseId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCase(item.id)}
              className={[
                "bb-interactive-lift bb-press-depth bb-tap-target min-w-[280px] snap-start rounded-2xl border p-4 text-left transition md:min-w-0",
                active
                  ? "border-blue-400 bg-blue-50 shadow-sm"
                  : "border-slate-200 bg-white/95 hover:border-cyan-300 hover:bg-cyan-50/50",
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

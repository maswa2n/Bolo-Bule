import Link from "next/link";

import { SkillRadarChart } from "@/components/learning/SkillRadarChart";
import type { SpeakingSkillReport } from "@/lib/learning/speaking-report";

type SpeakingSkillReportViewProps = {
  report: SpeakingSkillReport;
};

function priorityBarClass(priority: "high" | "medium" | "low") {
  if (priority === "high") return "bg-gradient-to-r from-amber-500 to-red-500";
  if (priority === "medium") return "bg-gradient-to-r from-yellow-400 to-amber-500";
  return "bg-gradient-to-r from-emerald-500 to-cyan-500";
}

function insightClass(type: SpeakingSkillReport["insights"][number]["type"]) {
  if (type === "gap") return "border-amber-500 bg-amber-50";
  if (type === "strength") return "border-emerald-500 bg-emerald-50";
  if (type === "pattern") return "border-cyan-500 bg-cyan-50";
  return "border-blue-500 bg-blue-50";
}

function objectiveStatus(status: SpeakingSkillReport["objectives"][number]["status"]) {
  if (status === "done") return { icon: "✓", className: "bg-emerald-100 text-emerald-700" };
  if (status === "in_progress") return { icon: "…", className: "bg-amber-100 text-amber-700" };
  return { icon: "!", className: "bg-rose-100 text-rose-700" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SpeakingSkillReportView({ report }: SpeakingSkillReportViewProps) {
  const focus = report.activeSession ?? report.session;
  const displayScore = report.kpis.inProgressScore || report.kpis.averageSessionScore;

  return (
    <div className="space-y-6">
      <section className="bb-hero-card bb-motion-rise rounded-3xl p-5 sm:p-6 md:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-900">
            Speaking Skill Report
          </span>
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-cyan-900">Data-driven</span>
          {focus ? (
            <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-cyan-900">
              {focus.cefrLevel} · Speaking
            </span>
          ) : null}
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">Raport Skill Berbicara</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{report.learnerName}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-blue-100 md:text-base">
          {focus
            ? focus.caseTitleId
            : "Belum ada latihan tercatat. Mulai sesi pertama untuk membuka raport personal."}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/15 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-cyan-100">Skor rata-rata</p>
            <p className="text-2xl font-bold text-white">
              {Math.round(displayScore)}
              <span className="text-sm font-semibold opacity-80">/100</span>
            </p>
          </div>
          <div className="rounded-xl bg-white/15 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-cyan-100">Total sesi</p>
            <p className="text-2xl font-bold text-white">{report.totalSessions}</p>
          </div>
          <div className="rounded-xl bg-white/15 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-cyan-100">Total turn</p>
            <p className="text-2xl font-bold text-white">{report.totalTurns}</p>
          </div>
          <div className="rounded-xl bg-white/15 px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-cyan-100">Momentum mingguan</p>
            <p className="text-2xl font-bold text-white">
              {report.kpis.weeklyMomentum >= 0 ? "+" : ""}
              {report.kpis.weeklyMomentum}%
            </p>
          </div>
        </div>

        {focus ? (
          <Link
            href="/practice"
            className="bb-btn-secondary bb-press-depth bb-tap-target mt-5 inline-flex px-4 py-2.5 text-sm font-semibold"
          >
            Lanjutkan latihan →
          </Link>
        ) : (
          <Link
            href="/practice"
            className="bb-btn-secondary bb-press-depth bb-tap-target mt-5 inline-flex px-4 py-2.5 text-sm font-semibold"
          >
            Mulai latihan pertama →
          </Link>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="bb-glass-panel bb-motion-rise bb-motion-delay-1 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Insight untuk peningkatan</h2>
          <div className="mt-4 space-y-3">
            {report.insights.map((insight) => (
              <div
                key={`${insight.type}-${insight.title}`}
                className={`rounded-r-xl border-l-[3px] px-3 py-2.5 ${insightClass(insight.type)}`}
              >
                <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{insight.body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="bb-glass-panel bb-motion-rise bb-motion-delay-1 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Radar 6 dimensi (semua latihan)
          </h2>
          <div className="mt-2 flex justify-center">
            <SkillRadarChart dimensions={report.dimensions} />
          </div>
          <div className="mt-2 space-y-2">
            {report.dimensions.map((dimension) => (
              <div key={dimension.key} className="flex items-center gap-3">
                <span className="w-28 shrink-0 text-xs text-slate-600">{dimension.labelId}</span>
                <div className="bb-progress-track h-2.5 flex-1">
                  <div
                    className={`h-2.5 rounded-full ${priorityBarClass(dimension.priority)}`}
                    style={{ width: `${dimension.score}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-semibold text-slate-700">{Math.round(dimension.score)}</span>
                {dimension.trend !== 0 ? (
                  <span className="w-8 text-right text-[10px] text-slate-500">
                    {dimension.trend > 0 ? `+${dimension.trend}` : dimension.trend}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="bb-glass-panel bb-motion-rise bb-motion-delay-2 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Progress objective (sesi terbaru)</h2>
          <div className="mt-3">
            {report.objectives.length === 0 ? (
              <p className="text-sm text-slate-600">Objective muncul setelah sesi latihan dimulai.</p>
            ) : (
              report.objectives.map((objective) => {
                const status = objectiveStatus(objective.status);
                return (
                  <div key={objective.code} className="flex gap-3 border-b border-slate-100 py-3 last:border-b-0">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${status.className}`}
                    >
                      {status.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {objective.code}
                        {objective.masteryScore != null ? ` · mastery ${objective.masteryScore}%` : ""}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">{objective.description}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Terdeteksi {objective.detectedCount}x
                        {objective.lastTurnNumber ? ` · turn terakhir #${objective.lastTurnNumber}` : ""}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>

        <article className="bb-glass-panel bb-motion-rise bb-motion-delay-2 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Remedial queue</h2>
          <div className="mt-3 space-y-2">
            {report.remedialQueue.length === 0 ? (
              <p className="text-sm text-slate-600">Tidak ada item remedial — lanjutkan ke kasus baru.</p>
            ) : (
              report.remedialQueue.map((item) => (
                <div
                  key={`${item.priority}-${item.title}`}
                  className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500 text-xs font-bold text-white">
                    {item.priority}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.title} — {item.reason}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{item.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="bb-glass-panel bb-motion-rise bb-motion-delay-2 rounded-2xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Riwayat sesi latihan</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-2 py-2">Kasus</th>
                <th className="px-2 py-2">Level</th>
                <th className="px-2 py-2">Progress</th>
                <th className="px-2 py-2">Skor</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {report.sessionHistory.map((session) => (
                <tr key={session.id} className="border-b border-slate-100">
                  <td className="px-2 py-3 font-medium text-slate-900">{session.caseTitleId || session.caseTitleEn}</td>
                  <td className="px-2 py-3 text-slate-600">{session.cefrLevel}</td>
                  <td className="px-2 py-3 text-slate-600">
                    {session.turnCount}/{session.targetTurns}
                  </td>
                  <td className="px-2 py-3 font-semibold text-slate-800">{Math.round(session.averageScore)}</td>
                  <td className="px-2 py-3 text-slate-600">{session.status.replaceAll("_", " ")}</td>
                  <td className="px-2 py-3 text-slate-500">{formatDate(session.startedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {report.masteryRows.length > 0 ? (
        <section className="bb-glass-panel bb-motion-rise bb-motion-delay-2 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mastery map (kumulatif)</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-2 py-2">Objective</th>
                  <th className="px-2 py-2">Mastery</th>
                  <th className="px-2 py-2">Attempts</th>
                  <th className="px-2 py-2">Insight</th>
                </tr>
              </thead>
              <tbody>
                {report.masteryRows.map((row) => (
                  <tr key={row.objectiveCode} className="border-b border-slate-100">
                    <td className="px-2 py-3">
                      <p className="font-semibold text-slate-900">{row.objectiveCode}</p>
                      <p className="text-xs text-slate-500">{row.description}</p>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <div className="bb-progress-track h-2.5 w-32">
                          <div className="bb-progress-fill h-2.5" style={{ width: `${row.masteryScore}%` }} />
                        </div>
                        <span className="font-semibold text-slate-700">{row.masteryScore}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-slate-600">
                      {row.successCount}/{row.attemptsCount} success
                    </td>
                    <td className="px-2 py-3 text-slate-600">{row.insight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="bb-glass-panel bb-motion-rise bb-motion-delay-2 rounded-2xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Riwayat turn & transkrip</h2>
        <div className="mt-3 space-y-3">
          {report.turns.length === 0 ? (
            <p className="text-sm text-slate-600">Belum ada transkrip terekam.</p>
          ) : (
            report.turns.map((turn) => (
              <div key={`${turn.sessionId}-${turn.turnNumber}`} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Sesi #{turn.sessionId} · Turn {turn.turnNumber} → {turn.targetObjective ?? "—"}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{turn.overallScore}/100</p>
                </div>
                <p className="mt-2 border-l-2 border-cyan-400 pl-3 text-sm italic leading-relaxed text-slate-700">
                  &ldquo;{turn.transcript}&rdquo;
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Task {turn.scores.task_completion}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Grammar {turn.scores.grammar}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Vocab {turn.scores.vocabulary}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Fluency {turn.scores.fluency}
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    Clarity {turn.scores.clarity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {report.languageTargets.grammar.length > 0 ? (
        <section className="bb-glass-panel bb-motion-rise bb-motion-delay-2 rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target bahasa scenario aktif</h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Grammar</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {report.languageTargets.grammar.map((item) => (
                  <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Vocabulary</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {report.languageTargets.vocabulary.map((item) => (
                  <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Functional language</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {report.languageTargets.functional.map((item) => (
                  <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-400">
            Generated {formatDate(report.generatedAt)} · {report.totalSessions} sesi · {report.totalTurns} turn
          </p>
        </section>
      ) : null}
    </div>
  );
}

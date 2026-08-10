const masteryRows = [
  { objective: "CONFIRM_STATUS", mastery: 82, note: "Stabil, naik konsisten" },
  { objective: "EXPLAIN_IMPACT", mastery: 76, note: "Perlu detail operasional lebih spesifik" },
  { objective: "REQUEST_COMMITMENT", mastery: 61, note: "Masih sering tidak meminta waktu spesifik" },
  { objective: "AGREE_FOLLOWUP", mastery: 73, note: "Sudah cukup baik, lanjutkan latihan transfer" },
];

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <section className="bb-practice-hero bb-motion-rise rounded-3xl p-5 shadow-sm sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-900">
            Learning intelligence
          </span>
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-cyan-900">Mastery map</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Learning Intelligence</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Progress per Objective</h1>
        <p className="mt-2 text-sm text-slate-600">
          Heatmap objective dipakai untuk memilih remedial queue dan rekomendasi kasus berikutnya.
        </p>
      </section>

      <section className="bb-glass-panel bb-motion-rise bb-motion-delay-1 rounded-3xl p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2">Objective</th>
                <th className="px-3 py-2">Mastery</th>
                <th className="px-3 py-2">Insight</th>
              </tr>
            </thead>
            <tbody>
              {masteryRows.map((row) => (
                <tr key={row.objective} className="border-b border-slate-100 transition-colors hover:bg-cyan-50/35">
                  <td className="px-3 py-3 font-semibold text-slate-900">{row.objective}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="bb-progress-track h-2.5 w-40">
                        <div
                          className="bb-progress-fill h-2.5 transition-[width] duration-700 ease-out"
                          style={{ width: `${row.mastery}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-700">{row.mastery}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

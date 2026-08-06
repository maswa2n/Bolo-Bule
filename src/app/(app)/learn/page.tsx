const masteryRows = [
  { objective: "CONFIRM_STATUS", mastery: 82, note: "Stabil, naik konsisten" },
  { objective: "EXPLAIN_IMPACT", mastery: 76, note: "Perlu detail operasional lebih spesifik" },
  { objective: "REQUEST_COMMITMENT", mastery: 61, note: "Masih sering tidak meminta waktu spesifik" },
  { objective: "AGREE_FOLLOWUP", mastery: 73, note: "Sudah cukup baik, lanjutkan latihan transfer" },
];

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/50 bg-white/80 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Learning Intelligence</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Progress per Objective</h1>
        <p className="mt-2 text-sm text-slate-600">
          Heatmap objective dipakai untuk memilih remedial queue dan rekomendasi kasus berikutnya.
        </p>
      </section>

      <section className="rounded-3xl border border-white/50 bg-white/85 p-4 shadow-sm">
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
                <tr key={row.objective} className="border-b border-slate-100">
                  <td className="px-3 py-3 font-semibold text-slate-900">{row.objective}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-40 rounded-full bg-slate-200">
                        <div
                          className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
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

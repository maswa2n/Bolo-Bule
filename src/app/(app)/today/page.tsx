import Link from "next/link";

import { getLearningKpiSnapshot } from "@/lib/learning/observability";

const cards = [
  {
    title: "Next Session",
    value: "Vendor Delivery Follow-up",
    detail: "Target: 6 turns · Intermediate B1 · Speaking",
  },
  {
    title: "Remedial Queue",
    value: "2 objectives",
    detail: "REQUEST_COMMITMENT, PROFESSIONAL_TONE",
  },
  {
    title: "Weekly Momentum",
    value: "+14%",
    detail: "Session completion naik dibanding minggu lalu",
  },
];

export default async function TodayPage() {
  let kpis = {
    sessionCompletionRate: 0,
    averageSessionScore: 0,
    evaluationPassRate: 0,
    activeLearners7d: 0,
  };

  try {
    kpis = await getLearningKpiSnapshot();
  } catch {
    // fallback default values in bootstrap mode
  }

  return (
    <div className="space-y-6">
      <section className="bb-hero-card rounded-3xl p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">Hari Ini</p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Satu Aksi Belajar Terbaik Hari Ini</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-blue-100 md:text-base">
          Mulai dari kasus prioritas yang paling berdampak ke objective yang belum Anda kuasai.
        </p>
        <div className="mt-5">
          <Link
            href="/practice"
            className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-slate-100"
          >
            Lanjutkan latihan prioritas
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-white/50 bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{card.value}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Completion rate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{Math.round(kpis.sessionCompletionRate * 100)}%</p>
        </article>
        <article className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Average score</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{kpis.averageSessionScore}</p>
        </article>
        <article className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Evaluation pass rate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{Math.round(kpis.evaluationPassRate * 100)}%</p>
        </article>
        <article className="rounded-2xl border border-white/50 bg-white/80 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500">Active learners (7d)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{kpis.activeLearners7d}</p>
        </article>
      </section>
    </div>
  );
}

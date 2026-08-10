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
    activeLearners7d: 0,
  };

  try {
    kpis = await getLearningKpiSnapshot();
  } catch {
    // fallback default values in bootstrap mode
  }

  return (
    <div className="space-y-6">
      <section className="bb-hero-card bb-motion-rise rounded-3xl p-5 sm:p-6 md:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-900">
            Today cockpit
          </span>
          <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-cyan-900">Prioritas berdampak tinggi</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">Hari Ini</p>
        <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl md:text-4xl">Satu Aksi Belajar Terbaik Hari Ini</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-blue-100 md:text-base">
          Mulai dari kasus prioritas yang paling berdampak ke objective yang belum Anda kuasai.
        </p>
        <div className="mt-5">
          <Link
            href="/practice"
            className="bb-btn-secondary bb-press-depth bb-tap-target inline-flex px-4 py-2.5 text-sm font-semibold"
          >
            Lanjutkan latihan prioritas
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.title} className="bb-glass-panel bb-interactive-lift bb-motion-rise bb-motion-delay-1 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{card.value}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="bb-glass-panel bb-interactive-lift bb-motion-rise bb-motion-delay-2 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Completion rate</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{Math.round(kpis.sessionCompletionRate * 100)}%</p>
        </article>
        <article className="bb-glass-panel bb-interactive-lift bb-motion-rise bb-motion-delay-2 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Average score</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{kpis.averageSessionScore}</p>
        </article>
        <article className="bb-glass-panel bb-interactive-lift bb-motion-rise bb-motion-delay-2 rounded-2xl p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Active learners (7d)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{kpis.activeLearners7d}</p>
        </article>
      </section>
    </div>
  );
}

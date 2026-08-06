import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="bb-bg relative min-h-screen overflow-hidden">
      <div className="bb-watermark" aria-hidden />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="bb-hero-card rounded-3xl p-8 shadow-xl md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Bolo Bule</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
            Adaptive Workplace English Learning Engine
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-blue-100 md:text-lg">
            Belajar bahasa Inggris kerja berbasis kasus nyata. Setiap sesi memiliki objective yang terukur,
            evaluator terpisah, dan rekomendasi latihan berikutnya yang personal.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/today"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-slate-100"
            >
              Masuk ke Dashboard
            </Link>
            <Link
              href="/practice"
              className="rounded-2xl border border-white/50 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              Mulai Latihan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

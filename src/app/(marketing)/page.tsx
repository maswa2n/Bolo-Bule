import Link from "next/link";
import Image from "next/image";

export default function MarketingPage() {
  return (
    <main className="bb-bg relative min-h-screen overflow-hidden">
      <div className="bb-watermark" aria-hidden />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="bb-hero-card bb-motion-rise rounded-3xl p-6 shadow-xl sm:p-8 md:p-12">
          <Image
            src="/branding/bolo-bule-logo.png"
            alt="Bolo Bule logo"
            width={220}
            height={220}
            className="h-auto w-28 drop-shadow-sm sm:w-36 md:w-44"
            priority
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bb-chip border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-50">
              Adaptive exchange
            </span>
            <span className="bb-chip border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold text-cyan-50">
              Voice + writing loop
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Bolo Bule</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-6xl">
            Adaptive Workplace English Learning Engine
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-blue-100 sm:text-base md:text-lg">
            Belajar bahasa Inggris kerja berbasis kasus nyata. Setiap sesi memiliki objective yang terukur,
            evaluator terpisah, dan rekomendasi latihan berikutnya yang personal.
          </p>

          <div className="mt-8 grid gap-2 sm:flex sm:flex-wrap">
            <Link
              href="/today"
              className="bb-btn-secondary bb-press-depth bb-tap-target inline-flex w-full justify-center px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              Masuk ke Dashboard
            </Link>
            <Link
              href="/practice"
              className="bb-btn-ghost-on-dark bb-press-depth bb-tap-target inline-flex w-full justify-center px-5 py-3 text-sm font-semibold sm:w-auto"
            >
              Mulai Latihan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

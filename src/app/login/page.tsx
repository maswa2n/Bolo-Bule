import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

type AuthMode = "signin" | "signup";
type CtaVariant = "a" | "b";
type SearchParamValue = string | string[] | undefined;

type LoginPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

const roleSignals = [
  "Sales Team",
  "Customer Support",
  "HR Interview Prep",
  "Operations",
  "Business Development",
  "Public Speaking",
];

const socialProof = [
  {
    quote:
      "Tim kami akhirnya punya pola latihan speaking yang konsisten dan mudah dievaluasi setiap minggu.",
    person: "Rina - Learning Lead",
  },
  {
    quote:
      "Feedback writing-nya jelas, jadi anggota tim tahu apa yang harus diperbaiki di sesi berikutnya.",
    person: "Dimas - Team Supervisor",
  },
  {
    quote:
      "Case-based flow membuat belajar bahasa asing terasa relevan dengan tantangan kerja harian.",
    person: "Tari - Program Manager",
  },
];

function pickFirstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function resolveMode(value: string | undefined): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

function resolveVariant(value: string | undefined): CtaVariant {
  return value === "b" ? "b" : "a";
}

function getPrimaryCtaCopy(mode: AuthMode, variant: CtaVariant): string {
  if (mode === "signup") {
    return variant === "b" ? "Klaim akun pertama tim" : "Buat akun & aktifkan tim";
  }

  return variant === "b" ? "Masuk & lanjut dari progres terakhir" : "Lanjutkan latihan sekarang";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const mode = resolveMode(pickFirstValue(resolvedSearchParams.mode));
  const variant = resolveVariant(pickFirstValue(resolvedSearchParams.variant));
  const isSignupMode = mode === "signup";
  const primaryCtaCopy = getPrimaryCtaCopy(mode, variant);

  const heroHeadline = isSignupMode
    ? "Bangun kultur belajar bahasa asing yang konsisten untuk tim Anda."
    : "Kembali lanjutkan latihan bahasa asing dari progres terbaik Anda.";
  const heroDescription = isSignupMode
    ? "Mulai dari satu akun admin, susun skenario latihan kerja nyata, lalu bantu tim berkembang lewat feedback speaking dan writing yang terstruktur."
    : "Masuk kembali ke Bolo Bule untuk melanjutkan turn latihan, membaca feedback terbaru, dan menjaga momentum peningkatan bahasa Anda setiap hari.";

  const journeySteps = isSignupMode
    ? [
        {
          title: "01. Setup team flow",
          description: "Buat akun pertama, siapkan case belajar, lalu tetapkan ritme latihan tim.",
        },
        {
          title: "02. Activate practice",
          description: "Tim berlatih speaking dan writing dengan coach response yang adaptif.",
        },
        {
          title: "03. Measure impact",
          description: "Pantau progres objective dan rekomendasi next drill tiap member.",
        },
      ]
    : [
        {
          title: "01. Resume session",
          description: "Lanjutkan dari case dan target yang terakhir Anda kerjakan.",
        },
        {
          title: "02. Practice deep",
          description: "Latihan speaking dan writing dengan respons coach adaptif di setiap turn.",
        },
        {
          title: "03. Improve fast",
          description: "Lihat progres objective, skor, dan rekomendasi latihan lanjutan yang personal.",
        },
      ];

  const socialProofHeading = isSignupMode
    ? "Tim belajar progresif memilih Bolo Bule untuk scale kemampuan bahasa."
    : "Profesional yang disiplin menjaga progres bahasa mereka bersama Bolo Bule.";

  const signinModeHref = `/login?mode=signin&variant=${variant}`;
  const signupModeHref = `/login?mode=signup&variant=${variant}`;

  return (
    <main className="bb-bg min-h-screen px-4 pb-24 pt-10 sm:px-6 sm:pb-14 sm:pt-14">
      <div className="bb-watermark" aria-hidden />
      <section className="mx-auto grid w-full max-w-6xl items-start gap-6 lg:min-h-[calc(100vh-7rem)] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="bb-hero-card bb-motion-rise bb-surface-shimmer rounded-3xl p-6 shadow-xl sm:p-8 md:p-10">
          <Image
            src="/branding/bolo-bule-logo.png"
            alt="Bolo Bule logo"
            width={220}
            height={220}
            className="h-auto w-24 drop-shadow-sm sm:w-32"
            priority
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="bb-chip border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-50">
              Real-world cases
            </span>
            <span className="bb-chip border-white/25 bg-white/15 px-3 py-1 text-[11px] font-semibold text-cyan-50">
              Speaking + writing feedback
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/25 bg-white/10 p-1 text-sm font-semibold text-cyan-50">
            <Link
              href={signinModeHref}
              className={[
                "bb-tap-target rounded-xl px-3 py-2 text-center transition",
                !isSignupMode ? "bg-white/20 text-white" : "text-cyan-100 hover:bg-white/10",
              ].join(" ")}
            >
              Mode Sign in
            </Link>
            <Link
              href={signupModeHref}
              className={[
                "bb-tap-target rounded-xl px-3 py-2 text-center transition",
                isSignupMode ? "bg-white/20 text-white" : "text-cyan-100 hover:bg-white/10",
              ].join(" ")}
            >
              Mode Sign up
            </Link>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Bolo Bule</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {heroHeadline}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
            {heroDescription}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {journeySteps.map((step, index) => (
              <article
                key={step.title}
                className={[
                  "bb-glass-panel bb-float-soft rounded-2xl p-4 text-left",
                  index === 1 ? "bb-motion-delay-1" : index === 2 ? "bb-motion-delay-2" : "",
                ].join(" ")}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{step.title}</p>
                <p className="mt-2 text-sm text-slate-700">{step.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-7 rounded-2xl border border-white/25 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-100">Social proof</p>
            <h2 className="mt-2 text-lg font-semibold text-white sm:text-xl">{socialProofHeading}</h2>
            <div className="bb-marquee mt-3">
              <div className="bb-marquee-track">
                {[...roleSignals, ...roleSignals].map((role, index) => (
                  <span
                    key={`${role}-${index}`}
                    className="bb-chip border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-cyan-50"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {socialProof.map((proof, index) => (
                <article
                  key={proof.person}
                  className={[
                    "bb-glass-panel rounded-2xl p-3 text-left text-slate-700",
                    index === 0 ? "bb-motion-rise" : index === 1 ? "bb-motion-rise bb-motion-delay-1" : "bb-motion-rise bb-motion-delay-2",
                  ].join(" ")}
                >
                  <p className="text-xs leading-relaxed text-slate-600">&quot;{proof.quote}&quot;</p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                    {proof.person}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:flex sm:flex-wrap">
            <Link
              href="/"
              className="bb-btn-secondary bb-press-depth bb-tap-target inline-flex justify-center px-4 py-2 text-sm font-semibold"
            >
              Eksplor halaman utama
            </Link>
            <Link
              href="#auth-panel"
              className="bb-btn-ghost-on-dark bb-press-depth bb-tap-target inline-flex justify-center px-4 py-2 text-sm font-semibold"
            >
              {primaryCtaCopy}
            </Link>
          </div>
        </div>

        <div id="auth-panel" className="space-y-4">
          <aside className="bb-glass-panel bb-motion-rise bb-motion-delay-2 bb-surface-shimmer rounded-3xl p-4 text-slate-700 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700">Conversion funnel</p>
              <span className="bb-badge bb-badge-info px-2 py-0.5 text-[11px] font-semibold">~90 detik</span>
            </div>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Mulai belajar tanpa friksi.</h2>
            <ol className="mt-3 space-y-2 text-sm">
              <li className="bb-funnel-step">
                <span className="bb-funnel-step-index">1</span>
                <span>Isi email dan password singkat.</span>
              </li>
              <li className="bb-funnel-step">
                <span className="bb-funnel-step-index">2</span>
                <span>Pilih masuk atau buat akun pertama.</span>
              </li>
              <li className="bb-funnel-step">
                <span className="bb-funnel-step-index">3</span>
                <span>Lanjut langsung ke workspace latihan Anda.</span>
              </li>
            </ol>
            <Link
              href="#auth-form"
              className="bb-btn-primary bb-btn-sheen bb-press-depth bb-tap-target mt-4 inline-flex w-full justify-center px-4 py-2 text-sm font-semibold"
            >
              {primaryCtaCopy}
            </Link>
          </aside>
          <Suspense
            fallback={
              <div className="bb-glass-panel bb-motion-rise mx-auto w-full max-w-md rounded-3xl p-6 text-center text-sm text-slate-700">
                Loading...
              </div>
            }
          >
            <LoginForm initialMode={mode} initialVariant={variant} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

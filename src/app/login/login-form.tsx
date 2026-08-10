"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileAction } from "@/lib/auth/ensure-profile";

type FeedbackTone = "success" | "error" | "info";
type AuthMode = "signin" | "signup";
type CtaVariant = "a" | "b";

type LoginFormProps = {
  initialMode: AuthMode;
  initialVariant: CtaVariant;
};

function resolveMode(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "signin";
}

function resolveVariant(value: string | null): CtaVariant | null {
  if (value === "a" || value === "b") {
    return value;
  }

  return null;
}

export function LoginForm({ initialMode, initialVariant }: LoginFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/cases";
  const queryMode = resolveMode(searchParams.get("mode"));
  const queryVariant = resolveVariant(searchParams.get("variant"));

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [variant, setVariant] = useState<CtaVariant>(initialVariant);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMode(queryMode);
  }, [queryMode]);

  useEffect(() => {
    if (queryVariant) {
      setVariant(queryVariant);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const storedVariant = window.localStorage.getItem("bb-login-cta-variant");
    const assignedVariant: CtaVariant =
      storedVariant === "a" || storedVariant === "b" ? storedVariant : Math.random() < 0.5 ? "a" : "b";

    window.localStorage.setItem("bb-login-cta-variant", assignedVariant);
    setVariant(assignedVariant);

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    params.set("variant", assignedVariant);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [mode, pathname, queryVariant, router, searchParams]);

  function syncSearchState(nextMode: AuthMode, nextVariant: CtaVariant) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", nextMode);
    params.set("variant", nextVariant);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setModeAndSync(nextMode: AuthMode) {
    setMode(nextMode);
    setFeedback(null);
    syncSearchState(nextMode, variant);
  }

  const ctaCopy = useMemo(() => {
    if (mode === "signup") {
      return variant === "b" ? "Aktifkan akun pertama tim" : "Buat akun & mulai latihan";
    }

    return variant === "b" ? "Masuk & lanjut dari progres terakhir" : "Lanjutkan belajar";
  }, [mode, variant]);

  const stickyCtaCopy = useMemo(() => {
    if (mode === "signup") {
      return variant === "b" ? "Aktifkan akun tim" : "Buat akun sekarang";
    }

    return variant === "b" ? "Masuk & lanjutkan progres" : "Lanjutkan latihan";
  }, [mode, variant]);

  function submit() {
    setFeedback(null);
    startTransition(async () => {
      try {
        const supabase = createClient();

        if (mode === "signup") {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) {
            setFeedback({ tone: "error", message: error.message });
            return;
          }
          setFeedback({
            tone: "success",
            message: "Akun dibuat. Jika email confirmation aktif, cek inbox. Lalu sign in.",
          });
          setMode("signin");
          syncSearchState("signin", variant);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setFeedback({ tone: "error", message: error.message });
          return;
        }

        const profileResult = await ensureProfileAction();
        if ("error" in profileResult && profileResult.error) {
          setFeedback({ tone: "error", message: profileResult.error });
          return;
        }

        router.push(redirectTo);
        router.refresh();
      } catch (error) {
        setFeedback({
          tone: "error",
          message: error instanceof Error ? error.message : "Login gagal.",
        });
      }
    });
  }

  return (
    <div
      id="auth-form"
      className="bb-glass-panel bb-motion-rise bb-motion-delay-1 bb-surface-shimmer mx-auto w-full max-w-lg rounded-3xl p-5 shadow-xl sm:p-6"
    >
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-cyan-100/80 bg-white/55 p-1">
        <button
          type="button"
          onClick={() => setModeAndSync("signin")}
          className={[
            "bb-tap-target rounded-xl px-3 py-2 text-sm font-semibold transition",
            mode === "signin" ? "bb-btn-primary" : "text-slate-600 hover:text-cyan-700",
          ].join(" ")}
        >
          Masuk
        </button>
        <button
          type="button"
          onClick={() => setModeAndSync("signup")}
          className={[
            "bb-tap-target rounded-xl px-3 py-2 text-sm font-semibold transition",
            mode === "signup" ? "bb-btn-primary" : "text-slate-600 hover:text-cyan-700",
          ].join(" ")}
        >
          Buat akun
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="bb-chip px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-900">
          Learning access
        </span>
        <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-cyan-900">Adaptive journey</span>
        <span className="bb-chip px-3 py-1 text-[11px] font-semibold text-cyan-900">CTA Variant {variant.toUpperCase()}</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">Mulai perjalanan belajar</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        {mode === "signin" ? "Masuk ke Bolo Bule" : "Buat akun pertama Anda"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {mode === "signin"
          ? "Lanjutkan latihan speaking dan writing dari progres terakhir Anda."
          : "Akun pertama otomatis mendapat role admin untuk menyiapkan case belajar tim."}
      </p>

      <div className="mt-4 rounded-2xl border border-cyan-100 bg-cyan-50/55 p-3 text-xs text-cyan-900">
        <p className="font-semibold">Yang akan Anda dapatkan setelah login:</p>
        <ul className="mt-2 space-y-1 text-cyan-800">
          <li>- Case-based practice yang relevan dengan situasi kerja nyata.</li>
          <li>- Feedback instan untuk grammar, clarity, dan confidence.</li>
          <li>- Rekomendasi latihan lanjutan berdasarkan performa Anda.</li>
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900">
        <p className="font-semibold">Rencana cepat setelah login:</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <p className="rounded-xl border border-blue-100 bg-white/80 px-2 py-1">1) Pilih case yang relevan</p>
          <p className="rounded-xl border border-blue-100 bg-white/80 px-2 py-1">2) Jalankan 3-5 turn latihan</p>
          <p className="rounded-xl border border-blue-100 bg-white/80 px-2 py-1">3) Cek feedback & next drill</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="bb-tap-target w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2 outline-none ring-cyan-400 focus:ring-2"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Password</span>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 ring-cyan-400 focus-within:ring-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="bb-tap-target w-full bg-transparent outline-none"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="bb-tap-target text-xs font-semibold text-cyan-700 hover:text-cyan-900"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
      </div>

      {feedback ? (
        <p
          className={[
            "bb-state-enter mt-3 rounded-xl px-3 py-2 text-sm",
            feedback.tone === "success"
              ? "bb-celebrate-subtle bb-state-success"
              : feedback.tone === "info"
                ? "bb-state-info"
                : "bb-state-error",
          ].join(" ")}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !email || !password}
          className={[
            "bb-btn-primary bb-btn-sheen bb-press-depth bb-tap-target w-full px-4 py-2 text-sm font-semibold disabled:opacity-60 sm:w-auto",
            isPending ? "bb-motion-pulse" : "",
          ].join(" ")}
        >
          {isPending ? "Menyiapkan sesi..." : ctaCopy}
        </button>
        <button
          type="button"
          onClick={() => setModeAndSync(mode === "signin" ? "signup" : "signin")}
          className="bb-btn-secondary bb-press-depth bb-tap-target w-full px-4 py-2 text-sm font-semibold sm:w-auto"
        >
          {mode === "signin" ? "Belum punya akun?" : "Sudah punya akun?"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Dengan melanjutkan, Anda menyetujui proses pembelajaran adaptif Bolo Bule untuk peningkatan
        kemampuan bahasa asing secara bertahap dan terukur.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cyan-100/70 bg-white/92 p-3 shadow-[0_-12px_24px_rgba(15,36,72,0.14)] backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !email || !password}
            className={[
              "bb-btn-primary bb-btn-sheen bb-press-depth bb-tap-target w-full px-4 py-2 text-sm font-semibold disabled:opacity-60",
              isPending ? "bb-motion-pulse" : "",
            ].join(" ")}
          >
            {isPending ? "Menyiapkan sesi..." : stickyCtaCopy}
          </button>
          <button
            type="button"
            onClick={() => setModeAndSync(mode === "signin" ? "signup" : "signin")}
            className="bb-btn-secondary bb-press-depth bb-tap-target shrink-0 px-3 py-2 text-xs font-semibold"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
      <div className="h-20 sm:hidden" aria-hidden />
    </div>
  );
}

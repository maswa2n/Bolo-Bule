"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { ensureProfileAction } from "@/lib/auth/ensure-profile";
import type { AuthMode } from "@/components/marketing/landing-data";

type FeedbackTone = "success" | "error" | "info";
type CtaVariant = "a" | "b";

type LoginFormProps = {
  initialMode: AuthMode;
  initialVariant: CtaVariant;
};

function resolveMode(value: string | null): AuthMode {
  return value === "signin" ? "signin" : "signup";
}

function resolveVariant(value: string | null): CtaVariant | null {
  if (value === "a" || value === "b") {
    return value;
  }

  return null;
}

const formCopy = {
  signup: {
    title: "Buat akun pertama Anda",
    subtitle: "Setup ~90 detik — langsung ke workspace latihan.",
    submit: "Buat akun",
    switchPrefix: "Sudah punya akun?",
    switchAction: "Masuk",
    passwordPlaceholder: "Minimal 8 karakter",
    footer:
      "Dengan mendaftar, Anda setuju kebijakan privasi Bolo Bule. Data latihan disimpan aman di Supabase.",
  },
  signin: {
    title: "Masuk ke workspace Anda",
    subtitle: "Lanjutkan dari progres terakhir.",
    submit: "Masuk",
    switchPrefix: "Belum punya akun?",
    switchAction: "Buat akun",
    passwordPlaceholder: "Password Anda",
    footer: "Gunakan email dan password yang sama dengan akun tim Anda.",
  },
} as const;

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
            message: "Akun dibuat. Jika email confirmation aktif, cek inbox. Lalu masuk.",
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

  const copy = formCopy[mode];

  return (
    <div id="auth-form" className="bb-landing-panel">
      <div className="bb-landing-auth-tabs" role="tablist" aria-label="Masuk atau buat akun">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={["bb-landing-auth-tab", mode === "signin" ? "is-active" : ""].join(" ")}
          onClick={() => setModeAndSync("signin")}
        >
          Masuk
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={["bb-landing-auth-tab", mode === "signup" ? "is-active" : ""].join(" ")}
          onClick={() => setModeAndSync("signup")}
        >
          Buat akun
        </button>
      </div>

      <form
        className="bb-landing-auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h2 className="bb-landing-form-title">{copy.title}</h2>
        <p className="bb-landing-form-subtitle">{copy.subtitle}</p>

        <div className="bb-landing-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="bb-landing-input"
            placeholder="nama@perusahaan.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="bb-landing-field">
          <label htmlFor="password">Password</label>
          <div className="bb-landing-input-wrap">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="bb-landing-input bb-landing-input-password"
              placeholder={copy.passwordPlaceholder}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
            />
            <button
              type="button"
              className="bb-landing-toggle-password"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {feedback ? (
          <p
            className={[
              "bb-landing-feedback",
              feedback.tone === "success"
                ? "bb-state-success"
                : feedback.tone === "info"
                  ? "bb-state-info"
                  : "bb-state-error",
            ].join(" ")}
          >
            {feedback.message}
          </p>
        ) : null}

        <div className="bb-landing-form-actions">
          <button
            type="submit"
            disabled={isPending || !email || !password}
            className="bb-landing-btn-primary bb-landing-btn-full"
          >
            {isPending ? "Menyiapkan sesi..." : copy.submit}
          </button>
        </div>

        <p className="bb-landing-form-switch">
          <span>{copy.switchPrefix} </span>
          <button
            type="button"
            className="bb-landing-link-btn"
            onClick={() => setModeAndSync(mode === "signin" ? "signup" : "signin")}
          >
            {copy.switchAction}
          </button>
        </p>

        <p className="bb-landing-form-footer">{copy.footer}</p>
      </form>
    </div>
  );
}

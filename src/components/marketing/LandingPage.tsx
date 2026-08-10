import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { LandingHeroSection } from "./LandingHeroSection";
import { LandingNav } from "./LandingNav";
import type { AuthMode } from "./landing-data";

type SearchParamValue = string | string[] | undefined;

type LandingPageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

type CtaVariant = "a" | "b";

function pickFirstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function resolveMode(value: string | undefined): AuthMode {
  return value === "signin" ? "signin" : "signup";
}

function resolveVariant(value: string | undefined): CtaVariant {
  return value === "b" ? "b" : "a";
}

export async function LandingPage({ searchParams }: LandingPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const mode = resolveMode(pickFirstValue(resolvedSearchParams.mode));
  const variant = resolveVariant(pickFirstValue(resolvedSearchParams.variant));

  return (
    <>
      <div className="bb-landing-bg" aria-hidden />
      <div className="bb-landing-watermark" aria-hidden />

      <div className="bb-landing-content">
        <LandingNav />

        <main className="bb-landing-hero">
          <LandingHeroSection mode={mode} />

          <aside id="auth">
            <Suspense
              fallback={
                <div className="bb-landing-panel bb-landing-panel-loading">
                  <p>Loading...</p>
                </div>
              }
            >
              <LoginForm initialMode={mode} initialVariant={variant} />
            </Suspense>
          </aside>
        </main>
      </div>
    </>
  );
}

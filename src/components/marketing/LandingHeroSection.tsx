import Link from "next/link";
import {
  getHeroCopy,
  roleSignals,
  signinSteps,
  signupSteps,
  socialProof,
  type AuthMode,
} from "./landing-data";

type LandingHeroSectionProps = {
  mode: AuthMode;
};

export function LandingHeroSection({ mode }: LandingHeroSectionProps) {
  const { headline, description } = getHeroCopy(mode);
  const steps = mode === "signup" ? signupSteps : signinSteps;

  return (
    <section aria-labelledby="hero-title">
      <div className="bb-landing-copy-zone">
        <div className="bb-landing-eyebrow">
          <span className="bb-landing-eyebrow-dot" aria-hidden />
          Real-world cases · Speaking + writing feedback
        </div>

        <h1 id="hero-title" className="bb-landing-title">
          {headline}
        </h1>

        <p className="bb-landing-desc">{description}</p>
      </div>

      <div className="bb-landing-steps" id="workflow">
        {steps.map((step, index) => (
          <article
            key={step.title}
            className={[
              "bb-landing-step",
              index === 0 ? "bb-landing-step-edge" : index === 1 ? "bb-landing-step-center" : "bb-landing-step-edge-alt",
            ].join(" ")}
          >
            <span className="bb-landing-step-num">{step.num}</span>
            <div>
              <p className="bb-landing-step-title">{step.title}</p>
              <p className="bb-landing-step-desc">{step.description}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="bb-landing-proof" id="proof">
        <p className="bb-landing-proof-label">Digunakan oleh tim di</p>
        <div className="bb-landing-proof-roles">
          {roleSignals.map((role) => (
            <span key={role} className="bb-landing-proof-role">
              {role}
            </span>
          ))}
        </div>
        <div className="bb-landing-proof-quotes">
          {socialProof.map((proof, index) => (
            <blockquote
              key={proof.person}
              className={[
                "bb-landing-proof-quote",
                index === 0
                  ? "bb-landing-proof-quote-edge"
                  : index === 1
                    ? "bb-landing-proof-quote-center"
                    : "bb-landing-proof-quote-edge-alt",
              ].join(" ")}
            >
              <p>&ldquo;{proof.quote}&rdquo;</p>
              <cite>{proof.person}</cite>
            </blockquote>
          ))}
        </div>
      </div>

      <div className="bb-landing-actions">
        <Link className="bb-landing-btn-secondary" href="/learn">
          Eksplor demo workspace
        </Link>
      </div>
    </section>
  );
}

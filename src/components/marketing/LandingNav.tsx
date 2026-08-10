import Image from "next/image";
import Link from "next/link";

export function LandingNav() {
  return (
    <header className="bb-landing-nav">
      <div className="bb-landing-nav-inner">
        <Link className="bb-landing-brand" href="/">
          <Image src="/branding/bolo-bule-logo.png" alt="Bolo Bule" width={28} height={28} priority />
          <span>Bolo Bule</span>
        </Link>
        <nav className="bb-landing-nav-links" aria-label="Navigasi utama">
          <a className="bb-landing-nav-link" href="#workflow">
            Alur kerja
          </a>
          <a className="bb-landing-nav-link" href="#proof">
            Testimoni
          </a>
          <a className="bb-landing-nav-link" href="#auth">
            Akses
          </a>
        </nav>
      </div>
    </header>
  );
}

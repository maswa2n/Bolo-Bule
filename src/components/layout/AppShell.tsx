"use client";

import { usePathname, useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";

type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  { href: "/today", label: "Hari Ini" },
  { href: "/learn", label: "Belajar" },
  { href: "/practice", label: "Latihan" },
  { href: "/cases", label: "Admin Cases" },
  { href: "/evaluation", label: "Evaluation" },
];

function isItemActive(pathname: string, href: string) {
  if (href === pathname) return true;
  if (href === "/cases" || href === "/evaluation") return pathname === href;
  return pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="bb-bg min-h-screen">
      <div className="bb-watermark" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-sky-100/35 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="bb-brand-mark" aria-hidden>
              BB
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Bolo Bule</p>
              <p className="text-sm font-semibold text-slate-800">Adaptive Language Exchange</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 rounded-2xl bg-white/85 p-1 shadow-sm ring-1 ring-sky-100">
            {navItems.map((item) => {
              const active = isItemActive(pathname, item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => {
                    event.preventDefault();
                    router.push(item.href);
                  }}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
                      : "text-slate-600 hover:bg-sky-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

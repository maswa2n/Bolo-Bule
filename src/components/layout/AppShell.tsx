"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type PropsWithChildren } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSessionUserAction } from "@/lib/auth/ensure-profile";

type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
};

const navItems: NavItem[] = [
  { href: "/today", label: "Hari Ini" },
  { href: "/learn", label: "Belajar" },
  { href: "/practice", label: "Latihan" },
  { href: "/cases", label: "Admin Cases", mobileLabel: "Admin" },
];

function isItemActive(pathname: string, href: string) {
  if (href === pathname) return true;
  if (href === "/cases") return pathname === href;
  return pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionLabel, setSessionLabel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getSessionUserAction().then((result) => {
      if (cancelled) return;
      if (!result.user) {
        setSessionLabel(null);
        return;
      }
      setSessionLabel(`${result.user.fullName} (${result.role})`);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function signOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      setSessionLabel(null);
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <div className="bb-bg min-h-screen">
      <div className="bb-watermark" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-sky-100/35 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src="/branding/bolo-bule-logo.png"
                alt="Bolo Bule logo"
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl bg-white/60 object-cover p-0.5 shadow-sm ring-1 ring-sky-100"
                priority
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Bolo Bule</p>
                <p className="truncate text-sm font-semibold text-slate-800 sm:text-base">Adaptive Language Exchange</p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
              <nav className="bb-scrollbar-hidden bb-glass-panel flex w-full items-center gap-1 overflow-x-auto rounded-2xl p-1 lg:w-auto">
                {navItems.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "bb-interactive-lift bb-press-depth bb-tap-target rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition",
                        active
                          ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow"
                          : "text-slate-600 hover:bg-sky-50 hover:text-slate-900",
                      ].join(" ")}
                    >
                      <span className="sm:hidden">{item.mobileLabel ?? item.label}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {sessionLabel ? (
                <div className="bb-glass-panel flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-600 lg:w-auto lg:justify-start">
                  <span className="max-w-[220px] truncate sm:max-w-[280px]">{sessionLabel}</span>
                  <button
                    type="button"
                    onClick={signOut}
                    disabled={isPending}
                    className="bb-btn-secondary bb-press-depth bb-tap-target px-2 py-1 text-slate-700 disabled:opacity-60"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login?redirect=/cases"
                  className="bb-btn-primary bb-press-depth bb-tap-target w-full px-3 py-2 text-center text-sm font-semibold lg:w-auto"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

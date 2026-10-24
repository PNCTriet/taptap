"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Compass,
  Globe,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, collectedStamps, stations } = useExplorer();

  const isAdminRoute = pathname?.startsWith("/admin");

  const navItems = [
    {
      href: "/",
      label: locale === "vi" ? "Khám phá" : "Explore",
      icon: Compass,
      isActive:
        pathname === "/" ||
        pathname?.startsWith("/collections") ||
        pathname?.startsWith("/s/"),
    },
    {
      href: "/passport",
      label: locale === "vi" ? "Hộ chiếu" : "Passport",
      icon: BookOpen,
      badge: `${collectedStamps.length}/${stations.length}`,
      isActive:
        pathname?.startsWith("/passport") || pathname?.startsWith("/rewards"),
    },
    {
      href: "/profile",
      label: locale === "vi" ? "Hồ sơ" : "Profile",
      icon: User,
      isActive: pathname?.startsWith("/profile"),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8EB] text-[#272E2B]">
      {/* Demo Seed Notice Banner */}
      <div className="bg-[#176B61] text-white px-4 py-2 text-xs">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#F2C653] shrink-0" />
            <span>
              {locale === "vi"
                ? "Dữ liệu mẫu phát triển (Thảo Cầm Viên Sài Gòn — Zoo Explorer). Chỉ dùng cho bản thử nghiệm giao diện."
                : "Development seed/demo data (Saigon Zoo — Zoo Explorer). For pilot preview & testing only."}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/health"
              className="underline decoration-[#F2C653] underline-offset-2 font-semibold hover:text-[#F2C653]"
            >
              {locale === "vi" ? "Trạng thái hệ thống" : "System Health"}
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 rounded-full bg-white/15 hover:bg-white/25 px-2.5 py-0.5 font-semibold transition-colors"
            >
              <ShieldCheck className="h-3 w-3 text-[#F2C653]" />
              Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E6DECB] bg-[#FFF8EB]/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo + Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-[#176B61] text-white flex items-center justify-center shadow-sm group-hover:bg-[#12564E] transition-colors">
              <Compass className="h-5 w-5 text-[#F2C653]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display-serif text-lg font-extrabold tracking-tight text-[#272E2B]">
                  TAPTAP
                </span>
                <span className="rounded-full bg-[#FDF6DF] border border-[#F2C653] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8F6505]">
                  Explorer
                </span>
              </div>
              <p className="text-xs font-semibold text-[#525D58]">
                Tap. Explore. Collect.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-1 rounded-full border border-[#E6DECB] bg-white p-1"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                    item.isActive && !isAdminRoute
                      ? "bg-[#176B61] text-white"
                      : "text-[#525D58] hover:text-[#272E2B] hover:bg-[#F5EFE2]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                        item.isActive && !isAdminRoute
                          ? "bg-white/20 text-white"
                          : "bg-[#E6F3F1] text-[#176B61]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                isAdminRoute
                  ? "bg-[#176B61] text-white"
                  : "text-[#525D58] hover:text-[#272E2B] hover:bg-[#F5EFE2]"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          </nav>

          {/* Interactive EN / VI Language Switcher */}
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Language switcher"
              className="inline-flex items-center rounded-full border border-[#E6DECB] bg-white p-1 shadow-xs"
            >
              <Globe className="h-3.5 w-3.5 text-[#78847E] ml-2 mr-1 hidden sm:inline" />
              <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`min-h-[32px] min-w-[38px] rounded-full px-2.5 text-xs font-extrabold transition-colors ${
                  locale === "en"
                    ? "bg-[#176B61] text-white"
                    : "text-[#525D58] hover:text-[#272E2B]"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLocale("vi")}
                aria-pressed={locale === "vi"}
                className={`min-h-[32px] min-w-[38px] rounded-full px-2.5 text-xs font-extrabold transition-colors ${
                  locale === "vi"
                    ? "bg-[#176B61] text-white"
                    : "text-[#525D58] hover:text-[#272E2B]"
                }`}
              >
                VI
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with Safe Bottom Padding for Mobile Tab Bar */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:pb-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6DECB] bg-[#F5EFE2] py-8 pb-28 md:pb-8 text-xs text-[#525D58]">
        <div className="mx-auto max-w-5xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display-serif font-bold text-[#272E2B]">
              TAPTAP
            </span>
            <span>•</span>
            <span>Tap. Explore. Collect.</span>
            <span>•</span>
            <span className="font-semibold text-[#176B61]">HOWLSLAB</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/collections/zoo-explorer" className="hover:underline">
              Zoo Explorer
            </Link>
            <Link href="/passport" className="hover:underline">
              {locale === "vi" ? "Hộ chiếu" : "Passport"}
            </Link>
            <Link href="/admin" className="hover:underline">
              Admin
            </Link>
            <Link href="/health" className="hover:underline">
              Health
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (3 items, 48px+ touch targets) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#E6DECB] bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-[0_-4px_16px_rgba(39,46,43,0.06)]"
      >
        <div className="mx-auto max-w-md grid grid-cols-3 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl px-3 py-1.5 text-xs font-extrabold transition-colors ${
                  item.isActive && !isAdminRoute
                    ? "bg-[#176B61] text-white shadow-xs"
                    : "text-[#525D58] hover:bg-[#F5EFE2]"
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                  {item.badge && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        item.isActive && !isAdminRoute
                          ? "bg-[#F2C653] text-[#272E2B]"
                          : "bg-[#E6F3F1] text-[#176B61]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

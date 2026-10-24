"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, ShieldCheck, User } from "lucide-react";
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
      {/* Minimal Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#E6DECB]/80 bg-[#FFF8EB]/90 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-[#176B61] text-white flex items-center justify-center shadow-xs group-hover:bg-[#12564E] transition-colors">
              <Compass className="h-4 w-4 text-[#F2C653]" />
            </div>
            <span className="font-display-serif text-lg font-extrabold tracking-tight text-[#272E2B]">
              TAPTAP
            </span>
          </Link>

          {/* Desktop Navigation */}
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
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                    item.isActive && !isAdminRoute
                      ? "bg-[#176B61] text-white"
                      : "text-[#525D58] hover:text-[#272E2B] hover:bg-[#F5EFE2]"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
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
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-colors ${
                isAdminRoute
                  ? "bg-[#176B61] text-white"
                  : "text-[#525D58] hover:text-[#272E2B] hover:bg-[#F5EFE2]"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          </nav>

          {/* EN / VI Pill Switcher */}
          <div
            role="group"
            aria-label="Language switcher"
            className="inline-flex items-center rounded-full border border-[#E6DECB] bg-white p-0.5"
          >
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              className={`min-h-[30px] min-w-[34px] rounded-full px-2.5 text-xs font-extrabold transition-colors cursor-pointer ${
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
              className={`min-h-[30px] min-w-[34px] rounded-full px-2.5 text-xs font-extrabold transition-colors cursor-pointer ${
                locale === "vi"
                  ? "bg-[#176B61] text-white"
                  : "text-[#525D58] hover:text-[#272E2B]"
              }`}
            >
              VI
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 pt-6 pb-28 md:pb-16">
        {children}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#E6DECB]/60 py-6 pb-24 md:pb-6 text-xs text-[#78847E]">
        <div className="mx-auto max-w-4xl px-4 flex items-center justify-between">
          <span>TAPTAP • Tap. Explore. Collect.</span>
          <Link href="/admin" className="hover:text-[#272E2B] font-semibold">
            Admin
          </Link>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#E6DECB] bg-white/95 backdrop-blur-md px-3 py-1.5"
      >
        <div className="mx-auto max-w-md grid grid-cols-3 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl px-3 py-1 text-xs font-extrabold transition-colors ${
                  item.isActive && !isAdminRoute
                    ? "bg-[#176B61] text-white"
                    : "text-[#525D58] hover:bg-[#F5EFE2]"
                }`}
              >
                <div className="flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                  {item.badge && (
                    <span
                      className={`ml-1 rounded-full px-1.5 text-[10px] font-extrabold ${
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

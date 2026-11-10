"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Map, ShieldCheck, User } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AppIcon } from "@/components/ui/app-icon";
import { LocaleSwitch } from "@/components/ui/locale-switch";

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, collectedStamps, stations } = useExplorer();

  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isBare =
    pathname === "/" ||
    isAdminRoute ||
    (pathname?.startsWith("/b2b") ?? false);

  const navItems = [
    {
      href: "/explore",
      label: locale === "vi" ? "Khám phá" : "Explore",
      icon: Compass,
      isActive:
        pathname === "/explore" ||
        pathname?.startsWith("/collections") ||
        pathname?.startsWith("/s/"),
    },
    {
      href: "/map",
      label: locale === "vi" ? "Bản đồ" : "Map",
      icon: Map,
      isActive: pathname?.startsWith("/map"),
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

  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => item.isActive)
  );

  if (isBare) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8EB] text-[#272E2B]">
      {/* Minimal Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#E6DECB]/80 bg-[#FFF8EB]/90 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-2.5 group transition-transform duration-150 active:scale-[0.97]"
          >
            <div className="h-9 w-9 rounded-xl bg-[#176B61] text-white flex items-center justify-center shadow-xs group-hover:bg-[#12564E] transition-colors">
              <AppIcon icon={Compass} size="sm" className="text-[#F2C653]" />
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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] ${
                    item.isActive
                      ? "bg-[#176B61] text-white"
                      : "text-[#525D58] hover:text-[#272E2B] hover:bg-[#F5EFE2]"
                  }`}
                >
                  <AppIcon icon={item.icon} size="xs" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`type-mono rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                        item.isActive
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
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] ${
                isAdminRoute
                  ? "bg-[#176B61] text-white"
                  : "text-[#525D58] hover:text-[#272E2B] hover:bg-[#F5EFE2]"
              }`}
            >
              <AppIcon icon={ShieldCheck} size="xs" />
              <span>Admin</span>
            </Link>
          </nav>

          <LocaleSwitch tone="paper" />
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
          <span className="flex items-center gap-3">
            <Link href="/b2b" className="font-semibold hover:text-[#272E2B]">
              {locale === "vi" ? "Doanh nghiệp" : "Business"}
            </Link>
            <Link href="/admin" className="font-semibold hover:text-[#272E2B]">
              Admin
            </Link>
          </span>
        </div>
      </footer>

      {/* Mobile Bottom Navigation with Sliding Active Indicator Pill */}
      {!isAdminRoute && (
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#E6DECB] bg-white/95 backdrop-blur-md px-2 py-1.5"
      >
        <div className="relative mx-auto max-w-md grid grid-cols-4 gap-1.5">
          <div
            aria-hidden="true"
            style={{
              transform: `translateX(${activeIndex * 100}%)`,
            }}
            className="pointer-events-none absolute -top-1.5 left-0 w-1/4 flex justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <span className="h-1 w-9 rounded-b-full bg-[#176B61]" />
          </div>

          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl px-2 py-1 text-xs font-extrabold transition-all duration-150 active:scale-[0.95] ${
                  item.isActive
                    ? "bg-[#176B61] text-white"
                    : "text-[#525D58] hover:bg-[#F5EFE2]"
                }`}
              >
                <div className="flex items-center justify-center">
                  <AppIcon icon={item.icon} size="sm" />
                  {item.badge && (
                    <span
                      className={`type-mono ml-1 rounded-full px-1.5 text-[10px] font-extrabold ${
                        item.isActive
                          ? "bg-[#F2C653] text-[#272E2B]"
                          : "bg-[#E6F3F1] text-[#176B61]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 text-[11px] leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      )}
    </div>
  );
}

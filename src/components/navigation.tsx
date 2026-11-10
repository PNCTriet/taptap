"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GuestMergeNotice } from "@/components/passport/guest-merge-notice";
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
    <div className="flex min-h-screen flex-col bg-gouache-bg text-gouache-ink">
      {/* Minimal Top Header */}
      <header className="sticky top-0 z-30 border-b border-gouache-line/80 bg-gouache-bg/90 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 h-16 flex items-center justify-between gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-2.5 group transition-transform duration-150 active:scale-[0.97]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gouache-ink text-gouache-cream transition-transform group-active:scale-95">
              <AppIcon icon={Compass} size="sm" className="text-player-pastel" />
            </div>
            <span className="font-display-serif text-lg font-extrabold tracking-tight text-[#272E2B]">
              TAPTAP
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary Navigation"
            className="hidden items-center gap-1 rounded-full border border-gouache-line bg-gouache-cream p-1 md:flex"
          >
            {navItems.map((item) => {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all duration-150 active:scale-[0.97] ${
                    item.isActive
                      ? "bg-gouache-ink text-gouache-cream"
                      : "text-gouache-muted hover:bg-white hover:text-gouache-ink"
                  }`}
                >
                  <AppIcon icon={item.icon} size="xs" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`type-mono rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                        item.isActive
                          ? "bg-white/20 text-gouache-cream"
                          : "bg-player-pastel text-gouache-ink"
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
                  ? "bg-gouache-ink text-gouache-cream"
                  : "text-gouache-muted hover:bg-white hover:text-gouache-ink"
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
      <GuestMergeNotice />

      {/* Minimal Footer */}
      <footer className="border-t border-gouache-line/60 py-6 pb-24 text-xs text-gouache-muted md:pb-6">
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
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gouache-line bg-gouache-cream/95 px-2 py-1.5 backdrop-blur-md md:hidden"
      >
        <div className="relative mx-auto max-w-md grid grid-cols-4 gap-1.5">
          <div
            aria-hidden="true"
            style={{
              transform: `translateX(${activeIndex * 100}%)`,
            }}
            className="pointer-events-none absolute -top-1.5 left-0 w-1/4 flex justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <span className="h-1 w-9 rounded-b-full bg-gouache-ink" />
          </div>

          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl px-2 py-1 text-xs font-extrabold transition-all duration-150 active:scale-[0.95] ${
                  item.isActive
                    ? "bg-gouache-ink text-gouache-cream"
                    : "text-gouache-muted hover:bg-gouache-bg"
                }`}
              >
                <div className="flex items-center justify-center">
                  <AppIcon icon={item.icon} size="sm" />
                  {item.badge && (
                    <span
                      className={`type-mono ml-1 rounded-full px-1.5 text-[10px] font-extrabold ${
                        item.isActive
                        ? "bg-player-pastel text-gouache-ink"
                        : "bg-gouache-line text-gouache-ink"
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

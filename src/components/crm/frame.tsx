"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Ellipsis } from "lucide-react";
import { LocaleSwitch } from "@/components/ui/locale-switch";

export interface CrmNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  tab?: boolean;
}

function pathOf(href: string) {
  return href.split("?")[0] ?? href;
}

function isCurrent(pathname: string, item: CrmNavItem) {
  const path = pathOf(item.href);
  if (item.exact) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function CrmFrame({
  product,
  title,
  switcher,
  role,
  links,
  moreLabel,
  extra,
  children,
  testId,
}: {
  product: string;
  title: string;
  switcher?: React.ReactNode;
  role?: string | null;
  links: CrmNavItem[];
  moreLabel: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
}) {
  const pathname = usePathname() ?? "";
  const [more, setMore] = useState(false);
  const tabs = links.filter((item) => item.tab);
  const overflow = links.filter((item) => !item.tab);

  return (
    <div className="min-h-dvh bg-[#F2F2F7] text-[#1D1D1F]" data-testid={testId} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Be Vietnam Pro", "Segoe UI", sans-serif' }}>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-black/[0.06] bg-white md:flex">
        <div className="border-b border-black/[0.06] px-4 py-4">
          <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8E8E93]">TAPTAP</div>
          <div className="text-[17px] font-semibold tracking-tight">{product}</div>
          {switcher ? <div className="mt-3">{switcher}</div> : <div className="mt-1 truncate text-[13px] text-[#6E6E73]">{title}</div>}
          {role ? (
            <span className="mt-2 inline-flex rounded-full bg-[#F2F2F7] px-2.5 py-0.5 text-[12px] font-medium text-[#3A3A3C]" data-testid="tenant-role">
              {role}
            </span>
          ) : null}
        </div>
        <nav aria-label={product} className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {links.map((item) => {
            const active = isCurrent(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-medium ${active ? "bg-[#1F4B66] text-white" : "text-[#1D1D1F] hover:bg-[#F2F2F7]"}`}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-black/[0.06] bg-[#F2F2F7]/95 px-4 backdrop-blur-md">
          <div className="min-w-0 md:hidden">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8E8E93]">{product}</div>
            <div className="truncate text-[15px] font-semibold">{title}</div>
          </div>
          <div className="hidden text-[13px] font-medium text-[#6E6E73] md:block">{title}</div>
          <div className="flex items-center gap-2">
            {role ? <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-medium text-[#3A3A3C] ring-1 ring-black/[0.06] md:hidden">{role}</span> : null}
            {extra}
            <LocaleSwitch tone="paper" />
          </div>
        </header>
        <main className="px-4 pb-28 pt-4 md:px-8 md:pb-12">{children}</main>
      </div>

      <nav aria-label={product} className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 backdrop-blur-md md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length + (overflow.length ? 1 : 0)}, minmax(0, 1fr))` }}>
          {tabs.map((item) => {
            const active = isCurrent(pathname, item);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${active ? "text-[#1F4B66]" : "text-[#8E8E93]"}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          {overflow.length ? (
            <button type="button" className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-[#8E8E93]" aria-expanded={more} onClick={() => setMore(true)}>
              <Ellipsis className="h-5 w-5" aria-hidden="true" />
              {moreLabel}
            </button>
          ) : null}
        </div>
      </nav>

      {more ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/30" aria-label={moreLabel} onClick={() => setMore(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-3 pb-8 shadow-xl">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#E5E5EA]" />
            {overflow.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMore(false)} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-[15px] font-medium text-[#1D1D1F]">
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExplorer } from "@/context/explorer-context";
import { LocaleSwitch } from "@/components/ui/locale-switch";

const LINKS = [
  { href: "/", labelEn: "Home", labelVi: "Trang chủ" },
  { href: "/explore", labelEn: "Play", labelVi: "Chơi" },
  { href: "/b2b", labelEn: "Business", labelVi: "Doanh nghiệp" },
  { href: "/admin", labelEn: "Admin", labelVi: "Quản trị" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = useExplorer();

  return (
    <div className="min-h-dvh bg-admin-paper font-be text-admin-ink">
      <header className="sticky top-0 z-30 bg-admin-bar text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2">
          <Link href="/admin" className="flex min-h-11 items-center gap-2">
            <span className="font-gouache text-[1.15rem] leading-none">TAPTAP</span>
            <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
              {locale === "vi" ? "Quản trị" : "Admin"}
            </span>
          </Link>
          <nav aria-label={locale === "vi" ? "Điều hướng quản trị" : "Admin"} className="hidden items-center gap-1 sm:flex">
            {LINKS.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin" || pathname.startsWith("/admin/")
                  : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-full px-3 text-[13px] font-semibold ${
                    active ? "bg-white text-admin-bar" : "text-white/85 hover:bg-white/10"
                  }`}
                >
                  {locale === "vi" ? item.labelVi : item.labelEn}
                </Link>
              );
            })}
          </nav>
          <LocaleSwitch tone="ink" />
        </div>
        <nav aria-label={locale === "vi" ? "Điều hướng quản trị" : "Admin"} className="flex gap-1 overflow-x-auto px-3 pb-2 sm:hidden">
          {LINKS.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname.startsWith("/admin")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-[13px] font-semibold ${
                  active ? "bg-white text-admin-bar" : "text-white/85"
                }`}
              >
                {locale === "vi" ? item.labelVi : item.labelEn}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-4xl px-4 py-6">{children}</div>
    </div>
  );
}

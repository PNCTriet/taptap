"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExplorer } from "@/context/explorer-context";
import { LocaleSwitch } from "@/components/ui/locale-switch";

const LINKS = [
  { href: "/", labelEn: "Home", labelVi: "Trang chủ" },
  { href: "/explore", labelEn: "Play", labelVi: "Chơi" },
  { href: "/b2b", labelEn: "Business", labelVi: "Doanh nghiệp" },
];

export function BusinessChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale } = useExplorer();

  return (
    <div className="min-h-dvh bg-business-paper font-be text-business-ink">
      <div className="h-1 bg-business-accent" />
      <header className="sticky top-0 z-30 border-b border-business-line bg-business-mist/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link href="/b2b" className="flex min-h-11 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-business-accent text-[12px] font-extrabold text-white">
              B
            </span>
            <span className="leading-tight">
              <span className="block font-gouache text-[1.05rem] leading-none">TAPTAP</span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-business-accent">
                {locale === "vi" ? "Doanh nghiệp" : "Business"}
              </span>
            </span>
          </Link>
          <LocaleSwitch tone="paper" />
        </div>
        <nav
          aria-label={locale === "vi" ? "Điều hướng doanh nghiệp" : "Business"}
          className="mx-auto grid max-w-3xl grid-cols-3 gap-1 px-3 pb-2"
        >
          {LINKS.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center justify-center rounded-[10px] px-2 text-[13px] font-semibold ${
                  active ? "bg-business-accent text-white" : "text-business-ink hover:bg-white"
                }`}
              >
                {locale === "vi" ? item.labelVi : item.labelEn}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto w-full max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useExplorer } from "@/context/explorer-context";

type LocaleSwitchProps = {
  tone?: "paper" | "ink" | "gouache";
};

const TONE: Record<NonNullable<LocaleSwitchProps["tone"]>, { shell: string; active: string; idle: string }> = {
  paper: {
    shell: "border-[#E6DECB] bg-white",
    active: "bg-[#176B61] text-white",
    idle: "text-[#525D58]",
  },
  ink: {
    shell: "border-white/25 bg-white/10",
    active: "bg-white text-[#241c16]",
    idle: "text-white/80",
  },
  gouache: {
    shell: "border-gouache-line bg-gouache-cream",
    active: "bg-gouache-ink text-gouache-cream",
    idle: "text-gouache-muted",
  },
};

export function LocaleSwitch({ tone = "paper" }: LocaleSwitchProps) {
  const { locale, setLocale } = useExplorer();
  const palette = TONE[tone];

  useEffect(() => {
    document.documentElement.lang = locale === "vi" ? "vi" : "en";
  }, [locale]);

  return (
    <div
      role="group"
      aria-label={locale === "vi" ? "Ngôn ngữ" : "Language"}
      className={`inline-flex items-center rounded-full border p-0.5 ${palette.shell}`}
    >
      {(["en", "vi"] as const).map((code) => {
        const selected = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={selected}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2.5 text-[13px] font-bold transition-transform duration-instant active:scale-95 ${
              selected ? palette.active : palette.idle
            }`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

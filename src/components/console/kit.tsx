"use client";

import React from "react";
import { useExplorer } from "@/context/explorer-context";

/** Inline bilingual copy helper: tx("Rooms", "Phòng"). EN is the default locale. */
export function useTx() {
  const { locale } = useExplorer();
  return React.useCallback((en: string, vi: string) => (locale === "vi" ? vi : en), [locale]);
}

export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[17px] font-semibold tracking-tight text-[#1D1D1F]">{children}</h2>
      {action}
    </div>
  );
}

type ButtonTone = "primary" | "secondary" | "danger" | "plain";
export function Button({
  tone = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  const tones: Record<ButtonTone, string> = {
    primary: "bg-[#0A66FF] text-white hover:bg-[#0057E0]",
    secondary: "bg-[#F2F2F7] text-[#1D1D1F] hover:bg-[#E5E5EA]",
    danger: "bg-[#FFF1F0] text-[#D70015] hover:bg-[#FFE3E1]",
    plain: "bg-transparent text-[#0A66FF] hover:bg-[#F2F7FF]",
  };
  return (
    <button
      type="button"
      className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 text-[15px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${tones[tone]} ${className}`}
      {...rest}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-[13px] font-medium text-[#6E6E73]">{label}</span>
      {children}
      {hint ? <span className="block text-[12px] text-[#8E8E93]">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full min-h-[44px] rounded-xl border border-black/10 bg-[#FBFBFD] px-3 text-[15px] text-[#1D1D1F] outline-none focus:border-[#0A66FF] focus:ring-2 focus:ring-[#0A66FF]/20";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

const PILL: Record<string, string> = {
  active: "bg-[#E8F8EE] text-[#1A7F37]",
  draft: "bg-[#F2F2F7] text-[#6E6E73]",
  pending: "bg-[#FFF6E0] text-[#9A6700]",
  maintenance: "bg-[#FFF6E0] text-[#9A6700]",
  inactive: "bg-[#F2F2F7] text-[#6E6E73]",
  archived: "bg-[#F2F2F7] text-[#6E6E73]",
  disabled: "bg-[#FFF1F0] text-[#D70015]",
  suspended: "bg-[#FFF1F0] text-[#D70015]",
  lost: "bg-[#FFF1F0] text-[#D70015]",
  replaced: "bg-[#F2F2F7] text-[#6E6E73]",
};
export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium ${PILL[status] ?? "bg-[#F2F2F7] text-[#6E6E73]"}`}>
      {status}
    </span>
  );
}

export function Notice({ tone = "error", children, testId }: { tone?: "error" | "success" | "info"; children: React.ReactNode; testId?: string }) {
  const tones = {
    error: "bg-[#FFF1F0] text-[#D70015]",
    success: "bg-[#E8F8EE] text-[#1A7F37]",
    info: "bg-[#F2F7FF] text-[#0A4FBF]",
  };
  return (
    <p role={tone === "error" ? "alert" : "status"} data-testid={testId} className={`rounded-xl px-3 py-2 text-[14px] ${tones[tone]}`}>
      {children}
    </p>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-[14px] text-[#8E8E93]">{children}</p>;
}

export interface ApiError {
  status: number;
  code?: string;
  message?: { en: string; vi: string };
}

/** POST helper for /api/b2b/<action>. Returns data or throws ApiError. */
export async function b2bAction<T = unknown>(action: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/b2b/${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: T; code?: string; message?: { en: string; vi: string } };
  if (!res.ok || !json.ok) {
    const err: ApiError = { status: res.status, code: json.code, message: json.message };
    throw err;
  }
  return json.data as T;
}

export function errorText(err: unknown, locale: "en" | "vi"): string {
  const e = err as ApiError & { message?: unknown };
  if (e && typeof e === "object" && e.message && typeof e.message === "object") {
    const m = e.message as { en: string; vi: string };
    return locale === "vi" ? m.vi : m.en;
  }
  if (e && typeof (e as { message?: unknown }).message === "string") return String((e as { message: string }).message);
  return locale === "vi" ? "Có lỗi xảy ra." : "Something went wrong.";
}

export function UsageMeter({ label, used, max, testId }: { label: string; used: number; max: number; testId?: string }) {
  const ratio = max === 0 ? 1 : Math.min(1, used / max);
  const color = used >= max ? "bg-[#FF3B30]" : ratio >= 0.8 ? "bg-[#FF9500]" : "bg-[#34C759]";
  return (
    <div className="space-y-1.5" data-testid={testId}>
      <div className="flex items-baseline justify-between">
        <span className="text-[14px] text-[#6E6E73]">{label}</span>
        <span className="text-[15px] font-semibold tabular-nums text-[#1D1D1F]" data-testid={testId ? `${testId}-value` : undefined}>
          {used} / {max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#F2F2F7]">
        <div className={`h-full rounded-full ${color} transition-[width] duration-500 motion-reduce:transition-none`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

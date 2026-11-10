"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/console/kit";

export function PageHeader({
  title,
  subtitle,
  action,
  meta,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="sticky top-14 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-[#F2F2F7]/95 px-4 py-3 backdrop-blur-md md:top-0 md:mx-0 md:rounded-2xl md:border md:bg-white/90 md:px-4">
      <div className="min-w-0">
        <h1 className="truncate text-[28px] font-semibold tracking-tight text-[#1D1D1F]">{title}</h1>
        {subtitle ? <p className="text-[13px] text-[#6E6E73]">{subtitle}</p> : null}
        {meta}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PrimaryButton({
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button {...rest} className={`shadow-sm ${rest.className ?? ""}`}>
      {children}
    </Button>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#E5E5EA] motion-reduce:animate-none ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24" />
        ))}
      </div>
      <SkeletonBlock className="h-56" />
      <SkeletonBlock className="h-40" />
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBlock key={index} className="h-14" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white px-6 py-10 text-center">
      <h2 className="text-[17px] font-semibold text-[#1D1D1F]">{title}</h2>
      <p className="mx-auto mt-1 max-w-sm text-[14px] text-[#6E6E73]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

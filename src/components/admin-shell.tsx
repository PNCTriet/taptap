"use client";

import type { ReactNode } from "react";

/** Page heading inside the admin frame. Section navigation lives on the frame. */
export function AdminShell({
  title,
  subtitle,
  action,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-[#1D1D1F]">{title}</h1>
            {subtitle ? <p className="text-[14px] text-[#6E6E73]">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </div>
  );
}

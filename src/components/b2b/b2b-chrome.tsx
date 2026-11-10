"use client";

import type { ReactNode } from "react";

/** Background for signed-out and signed-in business routes. Navigation lives in B2bShell. */
export function BusinessChrome({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-[#F2F2F7] text-[#1D1D1F]">{children}</div>;
}

import Link from "next/link";
import React from "react";

/** Server-rendered "no access" panel (minimal copy, EN + VI). */
export function AccessDenied({ signedIn, next }: { signedIn: boolean; next: string }) {
  return (
    <div className="mx-auto max-w-sm space-y-3 py-10 text-center" data-testid="access-denied">
      <h1 className="text-[22px] font-semibold text-[#1D1D1F]">
        {signedIn ? "No access · Không có quyền" : "Sign in required · Cần đăng nhập"}
      </h1>
      <Link
        href={`/login?next=${encodeURIComponent(next)}`}
        className="inline-flex min-h-[44px] items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white"
      >
        {signedIn ? "Switch account" : "Sign in"}
      </Link>
    </div>
  );
}

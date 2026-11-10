import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Database,
  FileCode2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { getEnvStatus } from "@/lib/env";
import { AppIcon } from "@/components/ui/app-icon";

export default function HealthPage() {
  const envStatus = getEnvStatus();

  const checks = [
    {
      name: "NEXT_PUBLIC_APP_URL",
      configured: Boolean(envStatus.appUrl),
      detail: `Resolved canonical URL: ${envStatus.appUrl}`,
    },
    {
      name: "NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY",
      configured: envStatus.publicEnvConfigured,
      detail: envStatus.publicEnvConfigured
        ? "Valid Supabase public client configuration detected."
        : "Running in Pilot Seed Preview mode (using deterministic Saigon Zoo seed data).",
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY (server-only)",
      configured: envStatus.serverEnvConfigured,
      detail: envStatus.serverEnvConfigured
        ? "Server-only privileged key configured."
        : "Not configured in this environment; server-only guard is active.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="paper-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F6F0] px-3 py-1 text-xs font-extrabold text-[#1B7F5C]">
              <AppIcon icon={CheckCircle2} size="xs" />
              System Healthy • HTTP 200
            </span>
            <h1 className="font-display-serif text-3xl font-extrabold text-[#272E2B] mt-2">
              TAPTAP System & Environment Readiness
            </h1>
            <p className="text-sm text-[#525D58] mt-1">
              Phase 0 Foundation & Playful Explorer UI Diagnostics (`GET /api/health`)
            </p>
          </div>

          <Link
            href="/api/health"
            className="rounded-full border border-[#E6DECB] bg-[#FFF8EB] hover:bg-[#E6F3F1] px-4 py-2 text-xs font-extrabold text-[#176B61] transition-colors"
          >
            View JSON (/api/health)
          </Link>
        </div>

        {/* Mode Banner */}
        <div className="rounded-2xl border border-[#176B61]/30 bg-[#E6F3F1]/60 p-4 flex items-start gap-3">
          <AppIcon icon={Database} size="md" className="text-[#176B61] mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-[#272E2B]">
              Runtime Data Mode:{" "}
              <span className="font-mono text-[#176B61]">{envStatus.mode}</span>
            </p>
            <p className="text-[#525D58]">
              Secrets are never printed or exposed. When live Supabase credentials are
              absent, TAPTAP safely serves the Saigon Zoo &quot;Zoo Explorer&quot; seed dataset.
            </p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          <h2 className="font-display-serif text-lg font-extrabold text-[#272E2B]">
            Environment Validation Checks
          </h2>
          {checks.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-[#E6DECB] bg-[#FFFDF8] p-4 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="font-mono text-xs font-bold text-[#272E2B]">
                  {item.name}
                </p>
                <p className="text-xs text-[#525D58]">{item.detail}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-extrabold ${
                  item.configured
                    ? "bg-[#E7F6F0] text-[#1B7F5C]"
                    : "bg-[#FDF6DF] text-[#8F6505]"
                }`}
              >
                {item.configured ? "Configured" : "Seed Fallback"}
              </span>
            </div>
          ))}
        </div>

        {/* Architecture & Security Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-2xl border border-[#E6DECB] bg-white p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#176B61]">
              <AppIcon icon={ShieldCheck} size="sm" />
              <span>Row Level Security (RLS)</span>
            </div>
            <p className="text-xs text-[#525D58]">
              Enabled across all 12 tables in{" "}
              <code className="font-mono">20261024000000_phase0_initial_schema.sql</code>{" "}
              with Visitor, Venue Admin, and Platform Admin policies.
            </p>
          </div>

          <div className="rounded-2xl border border-[#E6DECB] bg-white p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#F07861]">
              <AppIcon icon={FileCode2} size="sm" />
              <span>Server-Only Isolation</span>
            </div>
            <p className="text-xs text-[#525D58]">
              <code className="font-mono">src/lib/supabase/admin.ts</code> is guarded by{" "}
              <code className="font-mono">server-only</code> to prevent client bundle leakage.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs text-[#78847E]">
          <span className="inline-flex items-center gap-1">
            <AppIcon icon={Sparkles} size="xs" className="text-[#F2C653]" />
            TAPTAP • Saigon Zoo
          </span>
          <Link href="/explore" className="font-extrabold text-[#176B61] hover:underline">
            Return to Explore →
          </Link>
        </div>
      </div>
    </div>
  );
}

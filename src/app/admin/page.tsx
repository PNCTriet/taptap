"use client";

import Link from "next/link";
import { DailyChart, MetricGrid } from "@/components/crm/dashboard";
import { DashboardSkeleton, EmptyState, PageHeader } from "@/components/crm/states";
import { useCrmActivity } from "@/components/crm/use-crm";
import { AdminShell } from "@/components/admin-shell";
import { Notice, useTx } from "@/components/console/kit";

export default function AdminDashboardPage() {
  const tx = useTx();
  const crm = useCrmActivity("all");

  return (
    <AdminShell>
      <div className="space-y-4" data-testid="admin-dashboard">
        <PageHeader
          title={tx("Overview", "Tổng quan")}
          subtitle={tx("Every tenant and the public catalog · last 30 days", "Mọi tenant và catalog công khai · 30 ngày gần đây")}
          action={
            <Link href="/admin/stations" className="inline-flex min-h-11 items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white">
              {tx("Add station", "Thêm trạm")}
            </Link>
          }
        />
        {crm.loading && !crm.data ? <DashboardSkeleton /> : null}
        {crm.error && crm.code !== "MIGRATION_REQUIRED" ? <Notice>{crm.error}</Notice> : null}
        {crm.code === "MIGRATION_REQUIRED" ? <EmptyState title={tx("Analytics not ready", "Chưa có số liệu")} body={crm.error ?? ""} /> : null}
        {crm.data ? (
          <>
            <MetricGrid overview={crm.data.overview} />
            <DailyChart points={crm.data.overview.daily} />
          </>
        ) : null}
        <Link href="/admin/b2b" className="block rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold text-[#1F4B66] ring-1 ring-black/[0.06]">
          {tx("Plan usage by tenant", "Mức dùng gói theo tenant")}
        </Link>
      </div>
    </AdminShell>
  );
}

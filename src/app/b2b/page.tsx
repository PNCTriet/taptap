"use client";

import Link from "next/link";
import { DailyChart, MetricGrid, PlanUsage } from "@/components/crm/dashboard";
import { DashboardSkeleton, EmptyState, PageHeader } from "@/components/crm/states";
import { useCrmActivity } from "@/components/crm/use-crm";
import { Notice, useTx } from "@/components/console/kit";
import { useTenant } from "@/components/b2b/tenant-context";

export default function TenantHomePage() {
  const tx = useTx();
  const { tenant, href, canEditStations, usage } = useTenant();
  const crm = useCrmActivity(tenant?.id ?? null);
  const quota = crm.data?.quota ?? (usage ? { limits: usage.limits, used: usage.used, packageCode: usage.packageCode, packageName: usage.packageName } : null);
  const primary = canEditStations
    ? { href: href("/b2b/stations"), label: tx("Add station", "Thêm trạm") }
    : { href: href("/b2b/visitors"), label: tx("View visitors", "Xem khách") };

  return (
    <div className="space-y-4" data-testid="b2b-dashboard">
      <PageHeader
        title={tx("Overview", "Tổng quan")}
        subtitle={tenant?.is_demo ? tx("Demo tenant · last 30 days", "Tenant demo · 30 ngày gần đây") : tx("Last 30 days", "30 ngày gần đây")}
        action={
          <Link href={primary.href} className="inline-flex min-h-11 items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white">
            {primary.label}
          </Link>
        }
      />
      {crm.loading && !crm.data ? <DashboardSkeleton /> : null}
      {crm.error && crm.code !== "MIGRATION_REQUIRED" ? <Notice>{crm.error}</Notice> : null}
      {crm.code === "MIGRATION_REQUIRED" ? (
        <EmptyState title={tx("Analytics not ready", "Chưa có số liệu")} body={crm.error ?? ""} />
      ) : null}
      {crm.data ? (
        <>
          {crm.data.truncated ? <Notice tone="info">{tx("Showing the latest 8,000 events.", "Đang hiện 8.000 sự kiện mới nhất.")}</Notice> : null}
          <MetricGrid overview={crm.data.overview} />
          <DailyChart points={crm.data.overview.daily} />
        </>
      ) : null}
      {quota ? <PlanUsage used={quota.used} limits={quota.limits} packageName={quota.packageName} /> : null}
    </div>
  );
}

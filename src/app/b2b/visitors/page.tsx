"use client";

import Link from "next/link";
import { VisitorCrm } from "@/components/crm/visitors";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/crm/states";
import { useCrmActivity } from "@/components/crm/use-crm";
import { Notice, useTx } from "@/components/console/kit";
import { useTenant } from "@/components/b2b/tenant-context";

export default function TenantVisitorsPage() {
  const tx = useTx();
  const { tenant, href, canEditStations } = useTenant();
  const crm = useCrmActivity(tenant?.id ?? null);

  return (
    <div className="space-y-3">
      <PageHeader
        title={tx("Visitors", "Khách")}
        subtitle={tx("Search, filter, and open a visitor for tap and stamp history.", "Tìm, lọc, và mở khách để xem lịch sử chạm và dấu.")}
        action={
          <Link href={canEditStations ? href("/b2b/stations") : href("/b2b")} className="inline-flex min-h-11 items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white">
            {canEditStations ? tx("Add station", "Thêm trạm") : tx("Overview", "Tổng quan")}
          </Link>
        }
      />
      {crm.loading && !crm.data ? <ListSkeleton /> : null}
      {crm.error ? (
        crm.code === "MIGRATION_REQUIRED" ? <EmptyState title={tx("Visitor CRM not ready", "CRM khách chưa sẵn sàng")} body={crm.error} /> : <Notice>{crm.error}</Notice>
      ) : null}
      {crm.data ? (
        <VisitorCrm
          rows={crm.data.visitors}
          taps={crm.data.taps}
          grants={crm.data.grants}
          range={crm.data.range}
          timeZone={crm.data.timeZone}
        />
      ) : null}
    </div>
  );
}

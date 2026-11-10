"use client";

import Link from "next/link";
import { VisitorCrm } from "@/components/crm/visitors";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/crm/states";
import { useCrmActivity } from "@/components/crm/use-crm";
import { AdminShell } from "@/components/admin-shell";
import { Notice, useTx } from "@/components/console/kit";

export default function AdminVisitorsPage() {
  const tx = useTx();
  const crm = useCrmActivity("all");

  return (
    <AdminShell>
      <div className="space-y-3">
        <PageHeader
          title={tx("Visitors", "Khách")}
          subtitle={tx("Platform view across every tenant.", "Nhìn toàn nền tảng, mọi tenant.")}
          action={
            <Link href="/admin/stations" className="inline-flex min-h-11 items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white">
              {tx("Add station", "Thêm trạm")}
            </Link>
          }
        />
        {crm.loading && !crm.data ? <ListSkeleton /> : null}
        {crm.error ? (
          crm.code === "MIGRATION_REQUIRED" ? <EmptyState title={tx("Visitor CRM not ready", "CRM khách chưa sẵn sàng")} body={crm.error} /> : <Notice>{crm.error}</Notice>
        ) : null}
        {crm.data ? (
          <VisitorCrm rows={crm.data.visitors} taps={crm.data.taps} grants={crm.data.grants} range={crm.data.range} timeZone={crm.data.timeZone} />
        ) : null}
      </div>
    </AdminShell>
  );
}

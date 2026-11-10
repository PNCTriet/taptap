"use client";

import Link from "next/link";
import { Card, SectionTitle, useTx } from "@/components/console/kit";
import { PageHeader } from "@/components/crm/states";
import { QuotaPanel } from "@/components/b2b/quota-panel";
import { useTenant } from "@/components/b2b/tenant-context";

export default function TenantPlanPage() {
  const tx = useTx();
  const { usage, href } = useTenant();
  return (
    <div className="space-y-4">
      <PageHeader
        title={tx("Plan", "Gói")}
        subtitle={tx("Rooms, stations, members, and active tags count against the plan.", "Phòng, trạm, thành viên và thẻ đang bật tính vào hạn mức gói.")}
        action={
          <Link href={href("/b2b/members")} className="inline-flex min-h-11 items-center rounded-xl bg-[#1F4B66] px-4 text-[15px] font-semibold text-white">
            {tx("Members", "Thành viên")}
          </Link>
        }
      />
      <Card className="space-y-4">
        <SectionTitle>{usage?.packageName ?? tx("No active plan", "Chưa có gói")}</SectionTitle>
        {usage ? <QuotaPanel used={usage.used} limits={usage.limits} /> : null}
        <p className="text-[13px] text-[#8E8E93]">{tx("Contact the TAPTAP team to change plans.", "Liên hệ đội TAPTAP để đổi gói.")}</p>
      </Card>
    </div>
  );
}

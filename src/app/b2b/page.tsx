"use client";

import Link from "next/link";
import { Card, SectionTitle, useTx } from "@/components/console/kit";
import { QuotaPanel } from "@/components/b2b/quota-panel";
import { useTenant } from "@/components/b2b/tenant-context";

export default function TenantHomePage() {
  const tx = useTx();
  const { usage, tenant, href, canManageRooms, canEditStations } = useTenant();
  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <SectionTitle>
          {tx("Usage", "Mức sử dụng")} <span className="text-[13px] font-normal text-[#8E8E93]">· {usage?.packageName ?? "—"}{tenant?.is_demo ? " · DEMO" : ""}</span>
        </SectionTitle>
        {usage ? <QuotaPanel used={usage.used} limits={usage.limits} /> : null}
      </Card>
      <div className="grid grid-cols-2 gap-3">
        {canManageRooms ? (
          <Link href={href("/b2b/rooms")}><Card className="text-[15px] font-semibold text-[#0A66FF]">+ {tx("Room", "Phòng")}</Card></Link>
        ) : null}
        {canEditStations ? (
          <Link href={href("/b2b/stations")}><Card className="text-[15px] font-semibold text-[#0A66FF]">+ {tx("Station", "Trạm")}</Card></Link>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { Card, SectionTitle, useTx } from "@/components/console/kit";
import { QuotaPanel } from "@/components/b2b/quota-panel";
import { useTenant } from "@/components/b2b/tenant-context";

export default function TenantPlanPage() {
  const tx = useTx();
  const { usage } = useTenant();
  return (
    <Card className="space-y-4">
      <SectionTitle>{usage?.packageName ?? tx("No active plan", "Chưa có gói")}</SectionTitle>
      {usage ? <QuotaPanel used={usage.used} limits={usage.limits} /> : null}
      <p className="text-[13px] text-[#8E8E93]">{tx("Contact the TAPTAP team to change plans.", "Liên hệ đội TAPTAP để đổi gói.")}</p>
    </Card>
  );
}

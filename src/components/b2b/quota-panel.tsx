"use client";

import React from "react";
import { UsageMeter, useTx } from "@/components/console/kit";
import { quotaMeters, type QuotaLimits, type QuotaUsage } from "@/server/quota/quota";

const LABELS = {
  rooms: ["Rooms", "Phòng"],
  stations: ["Stations", "Trạm"],
  members: ["Members", "Thành viên"],
  active_nfc_tags: ["Active tags", "Thẻ đang bật"],
} as const;

export function QuotaPanel({ used, limits }: { used: QuotaUsage; limits: QuotaLimits }) {
  const tx = useTx();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="quota-panel">
      {quotaMeters(used, limits).map((m) => (
        <UsageMeter key={m.resource} label={tx(LABELS[m.resource][0], LABELS[m.resource][1])} used={m.used} max={m.max} testId={`quota-${m.resource}`} />
      ))}
    </div>
  );
}

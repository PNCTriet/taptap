"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { ResourceManager, type ResourceConfig } from "@/components/console/resource-manager";
import { playerStationUrl, randomTagCode } from "@/lib/routes";

const STATUS = ["active", "disabled", "lost", "replaced"].map((s) => ({ value: s, label: s }));

function TagsManager() {
  const station = useSearchParams().get("station");
  const config = useMemo<ResourceConfig>(
    () => ({
      table: "nfc_tags",
      testId: "tags",
      title: ["NFC tags", "Thẻ NFC"],
      select: "*, station:stations(name)",
      order: { column: "created_at" },
      filter: station ? (q) => q.eq("station_id", station) : undefined,
      fields: [
        { key: "station_id", label: ["Station", "Trạm"], type: "select", required: true, optionsFrom: { table: "stations", label: "name" }, defaultValue: station ?? undefined },
        { key: "public_code", label: ["Public code", "Mã công khai"], type: "text", required: true, defaultValue: () => randomTagCode("tcv"), hint: ["Encoded in the NFC / QR URL /s/<code>", "Ghi vào URL NFC / QR /s/<code>"] },
        { key: "label", label: ["Label", "Nhãn"], type: "text" },
        { key: "status", label: ["Status", "Trạng thái"], type: "select", options: STATUS, defaultValue: "active" },
      ],
      toPayload: (v) => ({ station_id: v.station_id, public_code: (v.public_code ?? "").trim().toLowerCase(), label: v.label || null, status: v.status }),
      primary: (r) => r.public_code,
      secondary: (r) => `${r.station?.name ?? ""}${r.label ? ` · ${r.label}` : ""}`,
      status: (r) => r.status,
      rowActions: (r) => (
        <Link href={playerStationUrl(r.public_code)} target="_blank" className="text-[13px] font-semibold text-[#176B61]" data-testid="tag-open-player">
          /s/{r.public_code} ↗
        </Link>
      ),
    }),
    [station]
  );
  return <ResourceManager config={config} />;
}

export default function AdminTagsPage() {
  return (
    <AdminShell>
      <Suspense>
        <TagsManager />
      </Suspense>
    </AdminShell>
  );
}

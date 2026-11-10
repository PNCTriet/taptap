"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ResourceManager, type ResourceConfig } from "@/components/console/resource-manager";

const STATUS = ["active", "maintenance", "inactive"].map((s) => ({ value: s, label: s }));

const config: ResourceConfig = {
  table: "stations",
  testId: "stations",
  title: ["Stations", "Trạm"],
  select: "*, venue:venues(name), nfc_tags(id,status)",
  order: { column: "created_at" },
  fields: [
    { key: "venue_id", label: ["Venue", "Điểm đến"], type: "select", required: true, optionsFrom: { table: "venues", label: "name" } },
    { key: "name", label: ["Name", "Tên"], type: "text", required: true },
    { key: "slug", label: ["Slug", "Slug"], type: "text", required: true },
    { key: "description", label: ["Description", "Mô tả"], type: "textarea" },
    { key: "location_hint", label: ["Location hint", "Gợi ý vị trí"], type: "text" },
    { key: "image_url", label: ["Image URL", "Ảnh (URL)"], type: "text" },
    { key: "latitude", label: ["Latitude", "Vĩ độ"], type: "number" },
    { key: "longitude", label: ["Longitude", "Kinh độ"], type: "number" },
    { key: "status", label: ["Status", "Trạng thái"], type: "select", options: STATUS, defaultValue: "active" },
  ],
  primary: (r) => r.name,
  secondary: (r) => `${r.venue?.name ?? ""} · ${(r.nfc_tags ?? []).filter((t: { status: string }) => t.status === "active").length} active tags`,
  status: (r) => r.status,
  rowActions: (r) => (
    <Link href={`/admin/tags?station=${r.id}`} className="text-[13px] font-semibold text-[#1F4B66]">
      Tags
    </Link>
  ),
};

export default function AdminStationsPage() {
  return (
    <AdminShell>
      <ResourceManager config={config} />
    </AdminShell>
  );
}

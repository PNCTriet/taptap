"use client";

import { AdminShell } from "@/components/admin-shell";
import { ResourceManager, type ResourceConfig } from "@/components/console/resource-manager";

const STATUS = ["active", "inactive"].map((s) => ({ value: s, label: s }));

const config: ResourceConfig = {
  table: "stamps",
  testId: "stamps",
  title: ["Stamps", "Con dấu"],
  select: "*, collection:collections(name), station:stations(name)",
  order: { column: "sort_order" },
  fields: [
    { key: "collection_id", label: ["Collection", "Bộ sưu tập"], type: "select", required: true, optionsFrom: { table: "collections", label: "name" } },
    { key: "station_id", label: ["Station", "Trạm"], type: "select", required: true, optionsFrom: { table: "stations", label: "name" } },
    { key: "name", label: ["Name", "Tên"], type: "text", required: true },
    { key: "description", label: ["Description", "Mô tả"], type: "textarea" },
    { key: "image_url", label: ["Artwork URL", "Ảnh dấu (URL)"], type: "text" },
    { key: "sort_order", label: ["Order", "Thứ tự"], type: "number", defaultValue: "1" },
    { key: "status", label: ["Status", "Trạng thái"], type: "select", options: STATUS, defaultValue: "active" },
  ],
  primary: (r) => `#${r.sort_order} ${r.name}`,
  secondary: (r) => `${r.collection?.name ?? ""} · ${r.station?.name ?? ""}`,
  status: (r) => r.status,
};

export default function AdminStampsPage() {
  return (
    <AdminShell>
      <ResourceManager config={config} />
    </AdminShell>
  );
}

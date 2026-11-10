"use client";

import { AdminShell } from "@/components/admin-shell";
import { ResourceManager, type ResourceConfig } from "@/components/console/resource-manager";

const STATUS = ["draft", "active", "archived"].map((s) => ({ value: s, label: s }));

const config: ResourceConfig = {
  table: "venues",
  testId: "venues",
  title: ["Venues", "Điểm đến"],
  order: { column: "created_at" },
  fields: [
    { key: "name", label: ["Name", "Tên"], type: "text", required: true },
    { key: "slug", label: ["Slug", "Slug"], type: "text", required: true },
    { key: "description", label: ["Description", "Mô tả"], type: "textarea" },
    { key: "status", label: ["Status", "Trạng thái"], type: "select", options: STATUS, defaultValue: "active" },
  ],
  primary: (r) => r.name,
  secondary: (r) => r.slug,
  status: (r) => r.status,
};

export default function AdminVenuesPage() {
  return (
    <AdminShell>
      <ResourceManager config={config} />
    </AdminShell>
  );
}

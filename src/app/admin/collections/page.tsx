"use client";

import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { ResourceManager, type ResourceConfig } from "@/components/console/resource-manager";
import { playerCollectionUrl } from "@/lib/routes";

const STATUS = ["draft", "active", "archived"].map((s) => ({ value: s, label: s }));

const config: ResourceConfig = {
  table: "collections",
  testId: "collections",
  title: ["Collections", "Bộ sưu tập"],
  select: "*, venue:venues(name)",
  order: { column: "created_at" },
  fields: [
    { key: "venue_id", label: ["Venue", "Điểm đến"], type: "select", required: true, optionsFrom: { table: "venues", label: "name" } },
    { key: "name", label: ["Name", "Tên"], type: "text", required: true },
    { key: "slug", label: ["Slug", "Slug"], type: "text", required: true },
    { key: "description", label: ["Description", "Mô tả"], type: "textarea" },
    { key: "required", label: ["Stamps to complete", "Số dấu để hoàn thành"], type: "number", hint: ["Leave empty = all stamps", "Bỏ trống = tất cả"] },
    { key: "status", label: ["Status", "Trạng thái"], type: "select", options: STATUS, defaultValue: "active" },
  ],
  fromRow: (r) => ({
    venue_id: r.venue_id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    required: r.completion_criteria?.required != null ? String(r.completion_criteria.required) : "",
    status: r.status,
  }),
  toPayload: (v) => ({
    venue_id: v.venue_id,
    name: v.name,
    slug: v.slug,
    description: v.description || null,
    status: v.status,
    completion_criteria: v.required ? { type: "count", required: Number(v.required) } : { type: "all" },
  }),
  primary: (r) => r.name,
  secondary: (r) => `${r.venue?.name ?? ""} · ${r.slug}`,
  status: (r) => r.status,
  rowActions: (r) => (
    <Link href={playerCollectionUrl(r.slug)} target="_blank" className="text-[13px] font-semibold text-[#176B61]" data-testid="collection-preview">
      Preview ↗
    </Link>
  ),
};

export default function AdminCollectionsPage() {
  return (
    <AdminShell>
      <ResourceManager config={config} />
    </AdminShell>
  );
}

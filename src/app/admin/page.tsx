"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AdminShell } from "@/components/admin-shell";
import { Card, useTx } from "@/components/console/kit";
import { createClientSupabaseClient } from "@/lib/supabase/client";

const RESOURCES = [
  { table: "venues", href: "/admin/venues", en: "Venues", vi: "Điểm đến" },
  { table: "collections", href: "/admin/collections", en: "Collections", vi: "Bộ sưu tập" },
  { table: "stations", href: "/admin/stations", en: "Stations", vi: "Trạm" },
  { table: "stamps", href: "/admin/stamps", en: "Stamps", vi: "Con dấu" },
  { table: "nfc_tags", href: "/admin/tags", en: "Active tags", vi: "Thẻ đang bật", active: true },
];

export default function AdminDashboardPage() {
  const tx = useTx();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = useMemo(() => createClientSupabaseClient() as unknown as SupabaseClient<any>, []);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [taps, setTaps] = useState<number | null>(null);

  useEffect(() => {
    RESOURCES.forEach(async (r) => {
      let q = supabase.from(r.table).select("id", { count: "exact", head: true }).is("tenant_id", null);
      if (r.active) q = q.eq("status", "active");
      const { count } = await q;
      setCounts((c) => ({ ...c, [r.table]: count ?? 0 }));
    });
    void supabase
      .from("collected_stamps")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setTaps(count ?? 0));
  }, [supabase]);

  return (
    <AdminShell title={tx("B2C CMS", "B2C CMS")} subtitle={tx("Venue → collection → station → stamp → tag", "Điểm đến → bộ sưu tập → trạm → dấu → thẻ")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {RESOURCES.map((r) => (
          <Link key={r.table} href={r.href}>
            <Card className="space-y-1 transition hover:ring-2 hover:ring-[#0A66FF]/20">
              <div className="text-[28px] font-bold tabular-nums text-[#1D1D1F]" data-testid={`count-${r.table}`}>
                {counts[r.table] ?? "–"}
              </div>
              <div className="text-[14px] text-[#6E6E73]">{tx(r.en, r.vi)}</div>
            </Card>
          </Link>
        ))}
        <Card className="space-y-1">
          <div className="text-[28px] font-bold tabular-nums text-[#1D1D1F]">{taps ?? "–"}</div>
          <div className="text-[14px] text-[#6E6E73]">{tx("Stamps collected", "Lượt nhận dấu")}</div>
        </Card>
      </div>
    </AdminShell>
  );
}

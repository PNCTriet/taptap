"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Card, Empty, SectionTitle, StatusPill, useTx } from "@/components/console/kit";
import { QuotaPanel } from "@/components/b2b/quota-panel";
import { useSupabase } from "@/components/b2b/use-supabase";
import { parseTenantUsage } from "@/server/quota/quota";

interface Row { id: string; name: string; slug: string; status: string; is_demo: boolean; usage?: ReturnType<typeof parseTenantUsage> }

export default function B2bOverviewPage() {
  const tx = useTx();
  const supabase = useSupabase();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("tenants").select("id,name,slug,status,is_demo").order("created_at");
      const list = (data as Row[]) ?? [];
      const withUsage = await Promise.all(
        list.map(async (t) => ({ ...t, usage: parseTenantUsage((await supabase.rpc("tenant_usage", { p_tenant: t.id })).data) }))
      );
      setRows(withUsage);
    })();
  }, [supabase]);

  return (
    <AdminShell title={tx("Business usage", "Sử dụng B2B")}>
      <div className="flex gap-2">
        <Link href="/admin/b2b/packages" className="rounded-xl bg-white px-4 py-2.5 text-[15px] font-semibold text-[#0A66FF] ring-1 ring-black/[0.08]">{tx("Packages", "Gói")}</Link>
        <Link href="/admin/b2b/tenants" className="rounded-xl bg-white px-4 py-2.5 text-[15px] font-semibold text-[#0A66FF] ring-1 ring-black/[0.08]">{tx("Tenants", "Tenant")}</Link>
      </div>
      {rows === null ? <Empty>…</Empty> : rows.length === 0 ? <Empty>{tx("No tenants yet", "Chưa có tenant")}</Empty> : rows.map((t) => (
        <Link key={t.id} href={`/admin/b2b/tenants/${t.id}`} className="block">
          <Card className="space-y-3">
            <SectionTitle action={<StatusPill status={t.status} />}>
              {t.name} <span className="text-[13px] font-normal text-[#8E8E93]">· {t.usage?.packageName ?? "—"}{t.is_demo ? " · DEMO" : ""}</span>
            </SectionTitle>
            {t.usage ? <QuotaPanel used={t.usage.used} limits={t.usage.limits} /> : null}
          </Card>
        </Link>
      ))}
    </AdminShell>
  );
}

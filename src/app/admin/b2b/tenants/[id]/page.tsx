"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { b2bAction, Button, Card, errorText, Field, Notice, SectionTitle, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { MembersPanel } from "@/components/b2b/members-panel";
import { QuotaPanel } from "@/components/b2b/quota-panel";
import { useSupabase } from "@/components/b2b/use-supabase";
import { useExplorer } from "@/context/explorer-context";
import { parseTenantUsage } from "@/server/quota/quota";

interface Tenant { id: string; name: string; slug: string; status: string; is_demo: boolean }

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [usage, setUsage] = useState<ReturnType<typeof parseTenantUsage> | null>(null);
  const [packages, setPackages] = useState<{ code: string; name: string }[]>([]);
  const [pkg, setPkg] = useState("");
  const [overrides, setOverrides] = useState({ max_rooms: "", max_stations: "", max_members: "", max_active_nfc_tags: "" });
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    const [t, u, p] = await Promise.all([
      supabase.from("tenants").select("*").eq("id", id).single(),
      supabase.rpc("tenant_usage", { p_tenant: id }),
      supabase.from("subscription_packages").select("code,name").eq("status", "active").order("max_rooms"),
    ]);
    setTenant(t.data as Tenant);
    const parsed = parseTenantUsage(u.data);
    setUsage(parsed);
    setPkg((cur) => cur || parsed.packageCode || "starter");
    setPackages((p.data as { code: string; name: string }[]) ?? []);
  }, [supabase, id]);
  useEffect(() => void load(), [load]);

  const run = async (action: string, body: unknown, ok: string) => {
    try {
      await b2bAction(action, body);
      setMsg({ tone: "success", text: ok });
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
  };

  if (!tenant) return <AdminShell><p className="text-[14px] text-[#8E8E93]">…</p></AdminShell>;

  const ov = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== "").map(([k, v]) => [k, Number(v)]));

  return (
    <AdminShell title={tenant.name} subtitle={`${tenant.slug}${tenant.is_demo ? " · DEMO" : ""}`}>
      {msg ? <Notice tone={msg.tone} testId="tenant-detail-msg">{msg.text}</Notice> : null}
      <Card className="space-y-4">
        <SectionTitle action={<StatusPill status={tenant.status} />}>{usage?.packageName ?? tx("No plan", "Chưa có gói")}</SectionTitle>
        {usage ? <QuotaPanel used={usage.used} limits={usage.limits} /> : null}
        <div className="flex flex-wrap gap-2">
          {tenant.status === "active" ? (
            <Button tone="danger" onClick={() => run("set-tenant-status", { tenantId: id, status: "suspended" }, tx("Suspended", "Đã tạm khoá"))}>{tx("Suspend", "Tạm khoá")}</Button>
          ) : (
            <Button tone="secondary" onClick={() => run("set-tenant-status", { tenantId: id, status: "active" }, tx("Activated", "Đã kích hoạt"))}>{tx("Activate", "Kích hoạt")}</Button>
          )}
          <Link href={`/b2b?tenant=${tenant.slug}`} className="inline-flex min-h-[44px] items-center rounded-xl px-4 text-[15px] font-semibold text-[#0A66FF]">
            {tx("Open tenant site", "Mở trang tenant")} →
          </Link>
        </div>
      </Card>

      <Card className="space-y-3">
        <SectionTitle>{tx("Plan & overrides", "Gói & hạn mức riêng")}</SectionTitle>
        <Field label={tx("Package", "Gói")}>
          <Select value={pkg} onChange={(e) => setPkg(e.target.value)} data-testid="assign-package">
            {packages.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(overrides) as (keyof typeof overrides)[]).map((k) => (
            <Field key={k} label={k.replace("max_", "").replace(/_/g, " ")}>
              <TextInput type="number" min={0} placeholder="—" value={overrides[k]} onChange={(e) => setOverrides({ ...overrides, [k]: e.target.value })} />
            </Field>
          ))}
        </div>
        <Button onClick={() => run("assign-package", { tenantId: id, packageCode: pkg, overrides: ov }, tx("Plan updated", "Đã cập nhật gói"))} data-testid="assign-package-save">
          {tx("Apply plan", "Áp dụng gói")}
        </Button>
      </Card>

      <MembersPanel tenantId={id} canManage canAssignOwner onChange={load} />
    </AdminShell>
  );
}

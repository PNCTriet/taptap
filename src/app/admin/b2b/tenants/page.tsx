"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { b2bAction, Button, Card, Empty, errorText, Field, Notice, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { useSupabase } from "@/components/b2b/use-supabase";
import { slugify } from "@/components/console/resource-manager";
import { useExplorer } from "@/context/explorer-context";

interface TenantRow { id: string; name: string; slug: string; status: string; is_demo: boolean; tenant_subscriptions: { status: string; package: { name: string } | null }[] }

export default function TenantsPage() {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const [rows, setRows] = useState<TenantRow[]>([]);
  const [packages, setPackages] = useState<{ code: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", packageCode: "starter", ownerEmail: "", isDemo: true });
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([
      supabase.from("tenants").select("id,name,slug,status,is_demo,tenant_subscriptions(status,package:subscription_packages(name))").order("created_at"),
      supabase.from("subscription_packages").select("code,name").eq("status", "active").order("max_rooms"),
    ]);
    setRows((t.data as unknown as TenantRow[]) ?? []);
    setPackages((p.data as { code: string; name: string }[]) ?? []);
  }, [supabase]);
  useEffect(() => void load(), [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await b2bAction<{ owner?: { status: string } }>("create-tenant", form);
      const ownerNote = res?.owner?.status === "invited" ? tx(" · owner invited", " · đã mời chủ") : res?.owner?.status === "added" ? tx(" · owner added", " · đã thêm chủ") : "";
      setMsg({ tone: "success", text: tx("Tenant created", "Đã tạo tenant") + ownerNote });
      setOpen(false);
      setForm({ name: "", slug: "", packageCode: "starter", ownerEmail: "", isDemo: true });
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
  };

  return (
    <AdminShell title={tx("Tenants", "Tenant")}>
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} data-testid="tenant-new">+ {tx("New tenant", "Tenant mới")}</Button>
      </div>
      {msg ? <Notice tone={msg.tone} testId="tenant-msg">{msg.text}</Notice> : null}
      {open ? (
        <Card>
          <form onSubmit={create} className="space-y-3">
            <Field label={tx("Name", "Tên")}>
              <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: slugify(e.target.value) })} data-testid="tenant-name" />
            </Field>
            <Field label="Slug"><TextInput required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} data-testid="tenant-slug" /></Field>
            <Field label={tx("Package", "Gói")}>
              <Select value={form.packageCode} onChange={(e) => setForm({ ...form, packageCode: e.target.value })} data-testid="tenant-package">
                {packages.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </Select>
            </Field>
            <Field label={tx("Owner email", "Email chủ sở hữu")} hint={tx("Added now if they have an account, otherwise invited on first sign-in.", "Thêm ngay nếu đã có tài khoản, nếu chưa sẽ được mời khi đăng nhập lần đầu.")}>
              <TextInput type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} data-testid="tenant-owner" />
            </Field>
            <label className="flex items-center gap-2 text-[14px] text-[#3A3A3C]">
              <input type="checkbox" checked={form.isDemo} onChange={(e) => setForm({ ...form, isDemo: e.target.checked })} /> {tx("Demo data", "Dữ liệu demo")}
            </label>
            <div className="flex gap-2">
              <Button type="submit" data-testid="tenant-save">{tx("Create", "Tạo")}</Button>
              <Button tone="secondary" onClick={() => setOpen(false)}>{tx("Cancel", "Huỷ")}</Button>
            </div>
          </form>
        </Card>
      ) : null}
      <Card className="divide-y divide-black/[0.06] p-0">
        {rows.length === 0 ? <Empty>{tx("No tenants", "Chưa có tenant")}</Empty> : rows.map((t) => {
          const sub = t.tenant_subscriptions.find((s) => s.status === "active");
          return (
            <Link key={t.id} href={`/admin/b2b/tenants/${t.id}`} className="flex items-center gap-3 px-4 py-3" data-testid="tenant-row">
              <div className="flex-1">
                <div className="text-[15px] font-semibold text-[#1D1D1F]">{t.name}{t.is_demo ? <span className="ml-2 rounded bg-[#FFF6E0] px-1.5 text-[11px] font-medium text-[#9A6700]">DEMO</span> : null}</div>
                <div className="text-[13px] text-[#6E6E73]">{t.slug} · {sub?.package?.name ?? tx("No plan", "Chưa có gói")}</div>
              </div>
              <StatusPill status={t.status} />
            </Link>
          );
        })}
      </Card>
    </AdminShell>
  );
}

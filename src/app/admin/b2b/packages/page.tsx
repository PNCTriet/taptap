"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { b2bAction, Button, Card, Empty, errorText, Field, Notice, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { useSupabase } from "@/components/b2b/use-supabase";
import { useExplorer } from "@/context/explorer-context";

interface Pkg { id: string; code: string; name: string; max_rooms: number; max_stations: number; max_members: number; max_active_nfc_tags: number; status: string }
const EMPTY = { code: "", name: "", maxRooms: "1", maxStations: "10", maxMembers: "3", maxActiveNfcTags: "10" };

export default function PackagesPage() {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const [rows, setRows] = useState<Pkg[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("subscription_packages").select("*").order("max_rooms");
    setRows((data as Pkg[]) ?? []);
  }, [supabase]);
  useEffect(() => void load(), [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await b2bAction("upsert-package", { ...form, status: "active" });
      setMsg({ tone: "success", text: tx("Package saved", "Đã lưu gói") });
      setOpen(false);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
  };

  const edit = (p: Pkg) => {
    setForm({ code: p.code, name: p.name, maxRooms: String(p.max_rooms), maxStations: String(p.max_stations), maxMembers: String(p.max_members), maxActiveNfcTags: String(p.max_active_nfc_tags) });
    setOpen(true);
  };

  const num = (k: keyof typeof EMPTY, en: string, vi: string) => (
    <Field label={tx(en, vi)}>
      <TextInput type="number" min={0} required value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} data-testid={`pkg-${k}`} />
    </Field>
  );

  return (
    <AdminShell title={tx("Packages", "Gói đăng ký")}>
      <div className="flex justify-end">
        <Button onClick={() => { setForm(EMPTY); setOpen(true); }} data-testid="pkg-new">+ {tx("New package", "Gói mới")}</Button>
      </div>
      {msg ? <Notice tone={msg.tone} testId="pkg-msg">{msg.text}</Notice> : null}
      {open ? (
        <Card>
          <form onSubmit={save} className="grid grid-cols-2 gap-3">
            <Field label={tx("Code", "Mã")}><TextInput required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} data-testid="pkg-code" /></Field>
            <Field label={tx("Name", "Tên")}><TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="pkg-name" /></Field>
            {num("maxRooms", "Max rooms", "Số phòng tối đa")}
            {num("maxStations", "Max stations", "Số trạm tối đa")}
            {num("maxMembers", "Max members", "Số thành viên tối đa")}
            {num("maxActiveNfcTags", "Max active tags", "Số thẻ bật tối đa")}
            <div className="col-span-2 flex gap-2">
              <Button type="submit" data-testid="pkg-save">{tx("Save", "Lưu")}</Button>
              <Button tone="secondary" onClick={() => setOpen(false)}>{tx("Cancel", "Huỷ")}</Button>
            </div>
          </form>
        </Card>
      ) : null}
      <Card className="divide-y divide-black/[0.06] p-0">
        {rows.length === 0 ? <Empty>{tx("No packages", "Chưa có gói")}</Empty> : rows.map((p) => (
          <button key={p.id} type="button" onClick={() => edit(p)} className="flex w-full items-center gap-3 px-4 py-3 text-left" data-testid="pkg-row">
            <div className="flex-1">
              <div className="text-[15px] font-semibold text-[#1D1D1F]">{p.name} <span className="text-[#8E8E93]">· {p.code}</span></div>
              <div className="text-[13px] tabular-nums text-[#6E6E73]">
                {p.max_rooms} {tx("rooms", "phòng")} · {p.max_stations} {tx("stations", "trạm")} · {p.max_members} {tx("members", "thành viên")} · {p.max_active_nfc_tags} {tx("tags", "thẻ")}
              </div>
            </div>
            <StatusPill status={p.status} />
          </button>
        ))}
      </Card>
    </AdminShell>
  );
}

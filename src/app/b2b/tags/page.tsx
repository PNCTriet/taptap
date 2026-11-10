"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { b2bAction, Button, errorText, Notice, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { CrmSheet } from "@/components/crm/sheet";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/crm/states";
import { useExplorer } from "@/context/explorer-context";
import { playerStationUrl } from "@/lib/routes";
import { useSupabase } from "@/components/b2b/use-supabase";
import { useTenant } from "@/components/b2b/tenant-context";

interface TagRow { id: string; public_code: string; label: string | null; status: string; station_id: string; station: { name: string } | null }
interface Station { id: string; name: string }

export default function TenantTagsPage() {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const { tenant, canEditStations, refresh, usage } = useTenant();
  const [tags, setTags] = useState<TagRow[] | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TagRow | null>(null);
  const [stationId, setStationId] = useState("");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    const [tagRes, stationRes] = await Promise.all([
      supabase.from("nfc_tags").select("id,public_code,label,status,station_id,station:stations(name)").eq("tenant_id", tenant.id).order("created_at"),
      supabase.from("stations").select("id,name").eq("tenant_id", tenant.id).order("created_at"),
    ]);
    setTags((tagRes.data as unknown as TagRow[]) ?? []);
    const list = (stationRes.data as Station[]) ?? [];
    setStations(list);
    setStationId((current) => current || list[0]?.id || "");
  }, [supabase, tenant]);
  useEffect(() => void load(), [load]);

  const run = async (action: string, body: unknown, ok: string) => {
    try {
      await b2bAction(action, body);
      setMsg({ tone: "success", text: ok });
      return true;
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
      return false;
    } finally {
      await Promise.all([load(), refresh()]);
    }
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={tx("Tags", "Thẻ")}
        meta={usage ? <p className="text-[13px] tabular-nums text-[#6E6E73]">{usage.used.active_nfc_tags} / {usage.limits.active_nfc_tags} {tx("active", "đang bật")}</p> : null}
        action={canEditStations ? <Button onClick={() => setCreating(true)}>{tx("Issue tag", "Cấp thẻ")}</Button> : null}
      />
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      {tags === null ? <ListSkeleton /> : tags.length === 0 ? (
        <EmptyState title={tx("No tags yet", "Chưa có thẻ")} body={tx("Issue an NFC or QR tag for a station.", "Cấp thẻ NFC hoặc QR cho một trạm.")} action={canEditStations ? <Button onClick={() => setCreating(true)}>{tx("Issue tag", "Cấp thẻ")}</Button> : null} />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-3 border-t border-black/[0.06] px-4 py-3 first:border-t-0">
              <div className="min-w-0 flex-1">
                <Link href={playerStationUrl(tag.public_code)} target="_blank" className="font-mono text-[14px] font-semibold text-[#1F4B66]">{tag.public_code}</Link>
                <div className="truncate text-[13px] text-[#6E6E73]">{tag.station?.name ?? ""}{tag.label ? ` · ${tag.label}` : ""}</div>
              </div>
              <StatusPill status={tag.status} />
              {canEditStations ? <Button tone="plain" className="min-h-11 px-2" onClick={() => setEditing(tag)}>{tx("Edit", "Sửa")}</Button> : null}
            </div>
          ))}
        </div>
      )}

      <CrmSheet open={creating && canEditStations} title={tx("Issue tag", "Cấp thẻ")} onClose={() => setCreating(false)}>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run("create-tag", { stationId, label }, tx("Tag issued", "Đã cấp thẻ"));
            if (ok) {
              setLabel("");
              setCreating(false);
            }
          }}
        >
          <Select required value={stationId} onChange={(event) => setStationId(event.target.value)}>
            {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
          </Select>
          <TextInput value={label} placeholder={tx("Label", "Nhãn")} onChange={(event) => setLabel(event.target.value)} />
          <Button type="submit">{tx("Issue", "Cấp")}</Button>
        </form>
      </CrmSheet>

      <CrmSheet open={Boolean(editing)} title={editing?.public_code ?? tx("Tag", "Thẻ")} onClose={() => setEditing(null)}>
        {editing ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await run("set-tag-status", { tagId: editing.id, status: editing.status }, tx("Tag updated", "Đã cập nhật thẻ"));
              if (ok) setEditing(null);
            }}
          >
            <Select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
              {["active", "disabled", "lost", "replaced"].map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <p className="text-[13px] text-[#6E6E73]">{tx("Turning a tag off frees an active-tag slot. Turning it on can hit the plan limit.", "Tắt thẻ sẽ trả một suất thẻ đang bật. Bật lại có thể chạm hạn mức gói.")}</p>
            <Button type="submit">{tx("Save", "Lưu")}</Button>
          </form>
        ) : null}
      </CrmSheet>
    </div>
  );
}

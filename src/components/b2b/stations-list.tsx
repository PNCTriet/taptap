"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { b2bAction, Button, Card, Empty, errorText, Notice, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { useSupabase } from "./use-supabase";
import { useTenant } from "./tenant-context";
import { useExplorer } from "@/context/explorer-context";
import { playerStationUrl } from "@/lib/routes";

interface Tag { id: string; public_code: string; status: string; label: string | null }
interface Station { id: string; name: string; status: string; room_id: string | null; room: { name: string } | null; nfc_tags: Tag[] }

export function StationsList({ roomId }: { roomId?: string }) {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const { tenant, canEditStations, refresh, usage } = useTenant();
  const [stations, setStations] = useState<Station[]>([]);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState("");
  const [room, setRoom] = useState(roomId ?? "");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    let q = supabase.from("stations").select("id,name,status,room_id,room:rooms(name),nfc_tags(id,public_code,status,label)").eq("tenant_id", tenant.id).order("created_at");
    if (roomId) q = q.eq("room_id", roomId);
    const [s, r] = await Promise.all([q, supabase.from("rooms").select("id,name").eq("tenant_id", tenant.id).order("created_at")]);
    setStations((s.data as unknown as Station[]) ?? []);
    setRooms((r.data as { id: string; name: string }[]) ?? []);
  }, [supabase, tenant, roomId]);
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
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[22px] font-bold tracking-tight text-[#1D1D1F]">{tx("Stations", "Trạm")}</h2>
        {usage ? (
          <span className="text-[13px] tabular-nums text-[#6E6E73]" data-testid="stations-usage">
            {usage.used.stations}/{usage.limits.stations} · {tx("tags", "thẻ")} {usage.used.active_nfc_tags}/{usage.limits.active_nfc_tags}
          </span>
        ) : null}
      </div>
      {msg ? <Notice tone={msg.tone} testId="stations-msg">{msg.text}</Notice> : null}
      {canEditStations ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (tenant && (await run("create-station", { tenantId: tenant.id, roomId: room || null, name }, tx("Station created", "Đã tạo trạm")))) setName("");
          }}
        >
          <TextInput required placeholder={tx("Station name (e.g. a toy)", "Tên trạm (vd. đồ chơi)")} value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1" data-testid="station-name" />
          {!roomId ? (
            <Select value={room} onChange={(e) => setRoom(e.target.value)} className="w-auto" data-testid="station-room">
              <option value="">{tx("No room", "Không phòng")}</option>
              {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Select>
          ) : null}
          <Button type="submit" data-testid="station-create">{tx("Add", "Thêm")}</Button>
        </form>
      ) : null}
      <Card className="divide-y divide-black/[0.06] p-0">
        {stations.length === 0 ? <Empty>{tx("No stations yet", "Chưa có trạm")}</Empty> : stations.map((s) => (
          <div key={s.id} className="space-y-2 px-4 py-3" data-testid="station-row">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-[#1D1D1F]">{s.name}</div>
                <div className="text-[13px] text-[#6E6E73]">{s.room?.name ?? tx("No room", "Không phòng")}</div>
              </div>
              {canEditStations ? (
                <Select value={s.status} className="w-auto min-h-[36px]" onChange={(e) => void run("update-station", { stationId: s.id, name: s.name, roomId: s.room_id, status: e.target.value }, tx("Saved", "Đã lưu"))}>
                  {["active", "maintenance", "inactive"].map((v) => <option key={v} value={v}>{v}</option>)}
                </Select>
              ) : <StatusPill status={s.status} />}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {s.nfc_tags.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2F2F7] px-2 py-1 text-[12px]" data-testid="tag-chip">
                  <Link href={playerStationUrl(t.public_code)} target="_blank" className="font-mono text-[#1F4B66]">{t.public_code}</Link>
                  <StatusPill status={t.status} />
                  {canEditStations ? (
                    <button type="button" className="text-[#6E6E73] underline" onClick={() => void run("set-tag-status", { tagId: t.id, status: t.status === "active" ? "disabled" : "active" }, tx("Tag updated", "Đã cập nhật thẻ"))}>
                      {t.status === "active" ? tx("Disable", "Tắt") : tx("Enable", "Bật")}
                    </button>
                  ) : null}
                </span>
              ))}
              {canEditStations ? (
                <Button tone="plain" className="min-h-[32px] px-2 text-[13px]" onClick={() => void run("create-tag", { stationId: s.id, label: `${s.name} tag` }, tx("Tag issued", "Đã cấp thẻ"))} data-testid="tag-create">
                  + {tx("NFC / QR tag", "Thẻ NFC / QR")}
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

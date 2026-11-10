"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { b2bAction, Button, errorText, Notice, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { CrmSheet } from "@/components/crm/sheet";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/crm/states";
import { useExplorer } from "@/context/explorer-context";
import { playerStationUrl } from "@/lib/routes";
import { useSupabase } from "./use-supabase";
import { useTenant } from "./tenant-context";

interface Tag { id: string; public_code: string; status: string; label: string | null }
interface Station { id: string; name: string; description: string | null; status: string; room_id: string | null; room: { name: string } | null; nfc_tags: Tag[] }

export function StationsList({ roomId }: { roomId?: string }) {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const { tenant, canEditStations, refresh, usage } = useTenant();
  const [stations, setStations] = useState<Station[] | null>(null);
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [name, setName] = useState("");
  const [room, setRoom] = useState(roomId ?? "");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    let query = supabase.from("stations").select("id,name,description,status,room_id,room:rooms(name),nfc_tags(id,public_code,status,label)").eq("tenant_id", tenant.id).order("created_at");
    if (roomId) query = query.eq("room_id", roomId);
    const [stationRes, roomRes] = await Promise.all([
      query,
      supabase.from("rooms").select("id,name").eq("tenant_id", tenant.id).order("created_at"),
    ]);
    setStations((stationRes.data as unknown as Station[]) ?? []);
    setRooms((roomRes.data as { id: string; name: string }[]) ?? []);
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
    <div className="space-y-3">
      <PageHeader
        title={tx("Stations", "Trạm")}
        meta={usage ? (
          <p className="text-[13px] tabular-nums text-[#6E6E73]" data-testid="stations-usage">
            {usage.used.stations}/{usage.limits.stations} · {tx("tags", "thẻ")} {usage.used.active_nfc_tags}/{usage.limits.active_nfc_tags}
          </p>
        ) : null}
        action={canEditStations ? <Button onClick={() => setCreating(true)}>{tx("Add station", "Thêm trạm")}</Button> : null}
      />
      {msg ? <Notice tone={msg.tone} testId="stations-msg">{msg.text}</Notice> : null}
      {stations === null ? <ListSkeleton /> : stations.length === 0 ? (
        <EmptyState
          title={tx("No stations yet", "Chưa có trạm")}
          body={tx("A station is the thing a guest taps.", "Trạm là nơi khách chạm.")}
          action={canEditStations ? <Button onClick={() => setCreating(true)}>{tx("Add station", "Thêm trạm")}</Button> : null}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
          {stations.map((station) => (
            <div key={station.id} className="space-y-2 border-t border-black/[0.06] px-4 py-3 first:border-t-0" data-testid="station-row">
              <div className="flex items-center gap-2">
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => canEditStations && setEditing(station)}>
                  <div className="truncate text-[15px] font-semibold text-[#1D1D1F]">{station.name}</div>
                  <div className="text-[13px] text-[#6E6E73]">{station.room?.name ?? tx("No room", "Không phòng")}</div>
                </button>
                <StatusPill status={station.status} />
                {canEditStations ? <Button tone="plain" className="min-h-11 px-2" onClick={() => setEditing(station)}>{tx("Edit", "Sửa")}</Button> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {station.nfc_tags.map((tag) => (
                  <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2F2F7] px-2 py-1 text-[12px]" data-testid="tag-chip">
                    <Link href={playerStationUrl(tag.public_code)} target="_blank" className="font-mono text-[#1F4B66]">{tag.public_code}</Link>
                    <StatusPill status={tag.status} />
                  </span>
                ))}
                {canEditStations ? (
                  <Button tone="plain" className="min-h-11 px-2 text-[13px]" onClick={() => void run("create-tag", { stationId: station.id, label: `${station.name} tag` }, tx("Tag issued", "Đã cấp thẻ"))} data-testid="tag-create">
                    {tx("Add tag", "Thêm thẻ")}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <CrmSheet open={creating && canEditStations} title={tx("New station", "Trạm mới")} onClose={() => setCreating(false)}>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!tenant) return;
            const ok = await run("create-station", { tenantId: tenant.id, roomId: room || null, name }, tx("Station created", "Đã tạo trạm"));
            if (ok) setName("");
          }}
        >
          <TextInput required placeholder={tx("Station name", "Tên trạm")} value={name} onChange={(event) => setName(event.target.value)} data-testid="station-name" />
          {!roomId ? (
            <Select value={room} onChange={(event) => setRoom(event.target.value)} data-testid="station-room">
              <option value="">{tx("No room", "Không phòng")}</option>
              {rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          ) : null}
          <Button type="submit" data-testid="station-create">{tx("Add", "Thêm")}</Button>
        </form>
      </CrmSheet>

      <CrmSheet open={Boolean(editing)} title={tx("Edit station", "Sửa trạm")} onClose={() => setEditing(null)}>
        {editing ? (
          <form
            className="space-y-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await run("update-station", {
                stationId: editing.id,
                name: editing.name,
                description: editing.description,
                roomId: editing.room_id,
                status: editing.status,
              }, tx("Saved", "Đã lưu"));
              if (ok) setEditing(null);
            }}
          >
            <TextInput required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
            <Select value={editing.room_id ?? ""} onChange={(event) => setEditing({ ...editing, room_id: event.target.value || null })}>
              <option value="">{tx("No room", "Không phòng")}</option>
              {rooms.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
            <Select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
              {["active", "maintenance", "inactive"].map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <Button type="submit">{tx("Save", "Lưu")}</Button>
          </form>
        ) : null}
      </CrmSheet>
    </div>
  );
}

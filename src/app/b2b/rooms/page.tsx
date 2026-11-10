"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { b2bAction, Button, Card, Empty, errorText, Notice, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { useSupabase } from "@/components/b2b/use-supabase";
import { useTenant } from "@/components/b2b/tenant-context";
import { useExplorer } from "@/context/explorer-context";

interface Room { id: string; name: string; slug: string; status: string; stations: { count: number }[] }

export default function TenantRoomsPage() {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const { tenant, canManageRooms, refresh, usage, href } = useTenant();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    const { data } = await supabase.from("rooms").select("id,name,slug,status,stations(count)").eq("tenant_id", tenant.id).order("created_at");
    setRooms((data as Room[]) ?? []);
  }, [supabase, tenant]);
  useEffect(() => void load(), [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    try {
      await b2bAction("create-room", { tenantId: tenant.id, name });
      setMsg({ tone: "success", text: tx("Room created", "Đã tạo phòng") });
      setName("");
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
    await Promise.all([load(), refresh()]);
  };

  const remove = async (id: string) => {
    try {
      await b2bAction("delete-room", { roomId: id });
      setMsg({ tone: "success", text: tx("Room deleted", "Đã xoá phòng") });
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
    await Promise.all([load(), refresh()]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#1D1D1F]">{tx("Rooms", "Phòng")}</h1>
        {usage ? <span className="text-[15px] tabular-nums text-[#6E6E73]" data-testid="rooms-usage">{usage.used.rooms} / {usage.limits.rooms}</span> : null}
      </div>
      {msg ? <Notice tone={msg.tone} testId="rooms-msg">{msg.text}</Notice> : null}
      {canManageRooms ? (
        <form onSubmit={create} className="flex gap-2">
          <TextInput required placeholder={tx("Room name", "Tên phòng")} value={name} onChange={(e) => setName(e.target.value)} className="flex-1" data-testid="room-name" />
          <Button type="submit" data-testid="room-create">{tx("Add", "Thêm")}</Button>
        </form>
      ) : null}
      <Card className="divide-y divide-black/[0.06] p-0">
        {rooms.length === 0 ? <Empty>{tx("No rooms yet", "Chưa có phòng")}</Empty> : rooms.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-4 py-3" data-testid="room-row">
            <Link href={href(`/b2b/rooms/${r.id}`)} className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold text-[#1D1D1F]">{r.name}</div>
              <div className="text-[13px] text-[#6E6E73]">{r.stations?.[0]?.count ?? 0} {tx("stations", "trạm")}</div>
            </Link>
            <StatusPill status={r.status} />
            {canManageRooms ? (
              <Button tone="plain" className="min-h-[36px] px-2 text-[#D70015]" onClick={() => void remove(r.id)} data-testid="room-delete">{tx("Delete", "Xoá")}</Button>
            ) : null}
          </div>
        ))}
      </Card>
    </div>
  );
}

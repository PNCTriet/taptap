"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { b2bAction, Button, errorText, Notice, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { CrmSheet } from "@/components/crm/sheet";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/crm/states";
import { useSupabase } from "@/components/b2b/use-supabase";
import { useTenant } from "@/components/b2b/tenant-context";
import { useExplorer } from "@/context/explorer-context";

interface Room { id: string; name: string; description: string | null; status: string; stations: { count: number }[] }

export default function TenantRoomsPage() {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const { tenant, canManageRooms, refresh, usage, href } = useTenant();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!tenant) return;
    let cancel = false;
    void supabase.from("rooms").select("id,name,description,status,stations(count)").eq("tenant_id", tenant.id).order("created_at").then(({ data }) => {
      if (!cancel) setRooms((data as Room[]) ?? []);
    });
    return () => { cancel = true; };
  }, [supabase, tenant]);

  useEffect(() => {
    if (canManageRooms) setCreating(true);
  }, [canManageRooms]);

  const reload = async () => {
    if (!tenant) return;
    const { data } = await supabase.from("rooms").select("id,name,description,status,stations(count)").eq("tenant_id", tenant.id).order("created_at");
    setRooms((data as Room[]) ?? []);
    await refresh();
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tenant) return;
    try {
      await b2bAction("create-room", { tenantId: tenant.id, name });
      setMsg({ tone: "success", text: tx("Room created", "Đã tạo phòng") });
      setName("");
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
    await reload();
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    try {
      await b2bAction("update-room", { roomId: editing.id, name: editing.name, description: editing.description, status: editing.status });
      setMsg({ tone: "success", text: tx("Saved", "Đã lưu") });
      setEditing(null);
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
    await reload();
  };

  const remove = async (id: string) => {
    try {
      await b2bAction("delete-room", { roomId: id });
      setMsg({ tone: "success", text: tx("Room deleted", "Đã xoá phòng") });
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
    await reload();
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={tx("Rooms", "Phòng")}
        meta={usage ? <p className="text-[13px] tabular-nums text-[#6E6E73]" data-testid="rooms-usage">{usage.used.rooms} / {usage.limits.rooms}</p> : null}
        action={canManageRooms ? (
          <Button onClick={() => setCreating(true)}>{tx("Add room", "Thêm phòng")}</Button>
        ) : null}
      />
      {msg ? <Notice tone={msg.tone} testId="rooms-msg">{msg.text}</Notice> : null}
      {rooms === null ? <ListSkeleton /> : rooms.length === 0 ? (
        <EmptyState
          title={tx("No rooms yet", "Chưa có phòng")}
          body={tx("A room groups the stations guests tap.", "Phòng gom các trạm khách sẽ chạm.")}
          action={canManageRooms ? <Button onClick={() => setCreating(true)}>{tx("Add room", "Thêm phòng")}</Button> : null}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center gap-3 border-t border-black/[0.06] px-4 py-3 first:border-t-0" data-testid="room-row">
              <Link href={href(`/b2b/rooms/${room.id}`)} className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-[#1D1D1F]">{room.name}</div>
                <div className="text-[13px] text-[#6E6E73]">{room.stations?.[0]?.count ?? 0} {tx("stations", "trạm")}</div>
              </Link>
              <StatusPill status={room.status} />
              {canManageRooms ? (
                <>
                  <Button tone="plain" className="min-h-11 px-2" onClick={() => setEditing(room)}>{tx("Edit", "Sửa")}</Button>
                  <Button tone="plain" className="min-h-11 px-2 text-[#D70015]" onClick={() => void remove(room.id)} data-testid="room-delete">{tx("Delete", "Xoá")}</Button>
                </>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <CrmSheet open={creating && canManageRooms} title={tx("New room", "Phòng mới")} onClose={() => setCreating(false)}>
        <form onSubmit={create} className="space-y-3">
          <TextInput required placeholder={tx("Room name", "Tên phòng")} value={name} onChange={(event) => setName(event.target.value)} data-testid="room-name" />
          <Button type="submit" data-testid="room-create">{tx("Add", "Thêm")}</Button>
        </form>
      </CrmSheet>

      <CrmSheet open={Boolean(editing)} title={tx("Edit room", "Sửa phòng")} onClose={() => setEditing(null)}>
        {editing ? (
          <form onSubmit={save} className="space-y-3">
            <TextInput required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
            <TextInput value={editing.description ?? ""} placeholder={tx("Description", "Mô tả")} onChange={(event) => setEditing({ ...editing, description: event.target.value })} />
            <Select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
              {["draft", "active", "archived"].map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
            <Button type="submit">{tx("Save", "Lưu")}</Button>
          </form>
        ) : null}
      </CrmSheet>
    </div>
  );
}

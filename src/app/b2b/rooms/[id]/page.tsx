"use client";

import { use, useCallback, useEffect, useState } from "react";
import { b2bAction, Button, Card, errorText, Notice, Select, TextInput, useTx } from "@/components/console/kit";
import { StationsList } from "@/components/b2b/stations-list";
import { useSupabase } from "@/components/b2b/use-supabase";
import { useTenant } from "@/components/b2b/tenant-context";
import { useExplorer } from "@/context/explorer-context";

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const { canManageRooms } = useTenant();
  const [room, setRoom] = useState<{ name: string; description: string | null; status: string } | null>(null);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("rooms").select("name,description,status").eq("id", id).single();
    setRoom(data);
  }, [supabase, id]);
  useEffect(() => void load(), [load]);

  if (!room) return null;
  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
        {canManageRooms ? (
          <form
            className="flex flex-wrap gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await b2bAction("update-room", { roomId: id, name: room.name, description: room.description, status: room.status });
                setMsg({ tone: "success", text: tx("Saved", "Đã lưu") });
              } catch (err) {
                setMsg({ tone: "error", text: errorText(err, locale) });
              }
            }}
          >
            <TextInput value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} className="min-w-0 flex-1 text-[17px] font-semibold" />
            <Select value={room.status} onChange={(e) => setRoom({ ...room, status: e.target.value })} className="w-auto">
              {["draft", "active", "archived"].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
            <Button type="submit">{tx("Save", "Lưu")}</Button>
          </form>
        ) : (
          <h1 className="text-[22px] font-bold text-[#1D1D1F]">{room.name}</h1>
        )}
      </Card>
      <StationsList roomId={id} />
    </div>
  );
}

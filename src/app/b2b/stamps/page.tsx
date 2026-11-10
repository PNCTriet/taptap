"use client";

import { useCallback, useEffect, useState } from "react";
import { b2bAction, Button, errorText, Notice, Select, StatusPill, TextInput, useTx } from "@/components/console/kit";
import { CrmSheet } from "@/components/crm/sheet";
import { EmptyState, ListSkeleton, PageHeader } from "@/components/crm/states";
import { useExplorer } from "@/context/explorer-context";
import { useSupabase } from "@/components/b2b/use-supabase";
import { useTenant } from "@/components/b2b/tenant-context";

interface Stamp { id: string; name: string; description: string | null; status: string; station_id: string; station: { name: string } | null }
interface Station { id: string; name: string }

export default function TenantStampsPage() {
  const tx = useTx();
  const { locale } = useExplorer();
  const supabase = useSupabase();
  const { tenant, canEditStations } = useTenant();
  const [stamps, setStamps] = useState<Stamp[] | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [open, setOpen] = useState(false);
  const [stationId, setStationId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;
    const [stampRes, stationRes] = await Promise.all([
      supabase.from("stamps").select("id,name,description,status,station_id,station:stations(name)").eq("tenant_id", tenant.id).order("sort_order"),
      supabase.from("stations").select("id,name").eq("tenant_id", tenant.id).order("created_at"),
    ]);
    setStamps((stampRes.data as unknown as Stamp[]) ?? []);
    setStations((stationRes.data as Station[]) ?? []);
  }, [supabase, tenant]);
  useEffect(() => void load(), [load]);

  const start = (stamp?: Stamp) => {
    setStationId(stamp?.station_id ?? stations[0]?.id ?? "");
    setName(stamp?.name ?? "");
    setDescription(stamp?.description ?? "");
    setStatus(stamp?.status ?? "active");
    setOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await b2bAction("upsert-stamp", { stationId, name, description, status });
      setMsg({ tone: "success", text: tx("Stamp saved", "Đã lưu dấu") });
      setOpen(false);
    } catch (err) {
      setMsg({ tone: "error", text: errorText(err, locale) });
    }
    await load();
  };

  return (
    <div className="space-y-3">
      <PageHeader
        title={tx("Stamps", "Con dấu")}
        subtitle={tx("One stamp per station. Saving creates it if it is missing.", "Mỗi trạm một dấu. Lưu sẽ tạo nếu chưa có.")}
        action={canEditStations ? <Button onClick={() => start()} data-testid="stamp-new">{tx("New stamp", "Thêm dấu")}</Button> : null}
      />
      {msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null}
      {stamps === null ? <ListSkeleton /> : stamps.length === 0 ? (
        <EmptyState title={tx("No stamps yet", "Chưa có dấu")} body={tx("Create a station first, then name its stamp.", "Hãy tạo trạm, rồi đặt tên dấu.")} action={canEditStations ? <Button onClick={() => start()}>{tx("New stamp", "Thêm dấu")}</Button> : null} />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06]">
          {stamps.map((stamp) => (
            <button key={stamp.id} type="button" onClick={() => canEditStations && start(stamp)} className="flex w-full items-center gap-3 border-t border-black/[0.06] px-4 py-3 text-left first:border-t-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-[#1D1D1F]">{stamp.name}</div>
                <div className="text-[13px] text-[#6E6E73]">{stamp.station?.name ?? tx("Station", "Trạm")}</div>
              </div>
              <StatusPill status={stamp.status} />
            </button>
          ))}
        </div>
      )}
      <CrmSheet open={open && canEditStations} title={tx("Stamp", "Con dấu")} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-3">
          <Select required value={stationId} onChange={(event) => setStationId(event.target.value)}>
            {stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
          </Select>
          <TextInput required value={name} placeholder={tx("Stamp name", "Tên dấu")} onChange={(event) => setName(event.target.value)} />
          <TextInput value={description} placeholder={tx("Description", "Mô tả")} onChange={(event) => setDescription(event.target.value)} />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </Select>
          <Button type="submit">{tx("Save", "Lưu")}</Button>
        </form>
      </CrmSheet>
    </div>
  );
}

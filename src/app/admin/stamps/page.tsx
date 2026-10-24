"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit3, Search } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AdminShell } from "@/components/admin-shell";
import { StampCard } from "@/components/stamp-card";
import type { PilotStation } from "@/types/domain";

const stampFormSchema = z.object({
  stampNameEn: z.string().min(2),
  stampNameVi: z.string().min(2),
  stampDescEn: z.string().min(4),
  sortOrder: z.coerce.number().int().min(1).max(50),
  accentColor: z.enum(["teal", "coral", "yellow", "blue"]),
  status: z.enum(["active", "inactive"]),
});

type StampFormValues = z.infer<typeof stampFormSchema>;

export default function AdminStampsPage() {
  const { locale, t, collections, stations, upsertStation } = useExplorer();
  const [search, setSearch] = useState("");
  const [editingStation, setEditingStation] = useState<PilotStation | null>(null);

  const form = useForm<StampFormValues>({
    resolver: zodResolver(stampFormSchema),
    defaultValues: {
      stampNameEn: "",
      stampNameVi: "",
      stampDescEn: "",
      sortOrder: 1,
      accentColor: "teal",
      status: "active",
    },
  });

  const openEditStamp = (st: PilotStation) => {
    setEditingStation(st);
    form.reset({
      stampNameEn: st.stamp.name.en,
      stampNameVi: st.stamp.name.vi,
      stampDescEn: st.stamp.description.en,
      sortOrder: st.stamp.sortOrder,
      accentColor: st.stamp.accentColor,
      status: st.stamp.status,
    });
  };

  const onSubmit = (values: StampFormValues) => {
    if (!editingStation) return;
    upsertStation({
      ...editingStation,
      stamp: {
        ...editingStation.stamp,
        name: { en: values.stampNameEn, vi: values.stampNameVi },
        description: {
          en: values.stampDescEn,
          vi: editingStation.stamp.description.vi,
        },
        sortOrder: values.sortOrder,
        accentColor: values.accentColor,
        status: values.status,
      },
    });
    setEditingStation(null);
  };

  const collectionName = collections[0] ? t(collections[0].name) : "Zoo Explorer";

  const filtered = stations.filter(
    (s) =>
      s.stamp.name.en.toLowerCase().includes(search.toLowerCase()) ||
      s.stamp.name.vi.toLowerCase().includes(search.toLowerCase()) ||
      s.name.en.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell
      title={locale === "vi" ? "Quản Lý Con Dấu (Stamps)" : "Stamps Art & Ordering"}
      subtitle={
        locale === "vi"
          ? "Chỉnh sửa tên con dấu, thứ tự đóng dấu trong hộ chiếu và màu sắc chủ đạo."
          : "Configure passport stamp titles, postmark accent colors, and sort order."
      }
    >
      <div className="relative max-w-md">
        <Search className="h-4 w-4 text-[#78847E] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search stamps..."
          className="min-h-[42px] w-full rounded-full border border-[#E6DECB] bg-white pl-10 pr-4 py-2 text-xs font-semibold"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map((st) => (
          <div key={st.stamp.id} className="space-y-2">
            <StampCard
              station={st}
              collectionName={collectionName}
              state="available"
              showTapLink={false}
            />
            <button
              type="button"
              onClick={() => openEditStamp(st)}
              className="w-full min-h-[38px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] px-4 py-1.5 text-xs font-extrabold text-[#272E2B] cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit Stamp Metadata</span>
            </button>
          </div>
        ))}
      </div>

      {editingStation && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="paper-card max-w-lg w-full p-6 space-y-4">
            <h3 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
              Edit Stamp — {t(editingStation.name)}
            </h3>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Stamp Title (EN)
                  </label>
                  <input
                    {...form.register("stampNameEn")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Stamp Title (VI)
                  </label>
                  <input
                    {...form.register("stampNameVi")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    {...form.register("sortOrder")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Accent Color
                  </label>
                  <select
                    {...form.register("accentColor")}
                    className="w-full rounded-xl border border-[#CFC4AB] bg-white px-3 py-2 text-xs"
                  >
                    <option value="teal">Explorer Teal</option>
                    <option value="coral">Adventure Coral</option>
                    <option value="yellow">Sunshine Yellow</option>
                    <option value="blue">Discovery Blue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Status
                  </label>
                  <select
                    {...form.register("status")}
                    className="w-full rounded-xl border border-[#CFC4AB] bg-white px-3 py-2 text-xs"
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#525D58] mb-1">
                  Caption (EN)
                </label>
                <textarea
                  rows={2}
                  {...form.register("stampDescEn")}
                  className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="rounded-full border border-[#E6DECB] bg-white px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#176B61] text-white px-5 py-2 text-xs font-extrabold"
                >
                  Save Stamp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

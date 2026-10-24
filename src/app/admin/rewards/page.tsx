"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit3, Plus, Search } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AdminShell } from "@/components/admin-shell";
import type { PilotReward } from "@/types/domain";

const rewardFormSchema = z.object({
  nameEn: z.string().min(2),
  nameVi: z.string().min(2),
  requiredStamps: z.coerce.number().int().min(1).max(20),
  descriptionEn: z.string().min(5),
  instructionsEn: z.string().min(5),
  status: z.enum(["active", "paused", "exhausted"]),
});

type RewardFormValues = z.infer<typeof rewardFormSchema>;

export default function AdminRewardsPage() {
  const { locale, t, collections, rewards, upsertReward } = useExplorer();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PilotReward | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<RewardFormValues>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      nameEn: "",
      nameVi: "",
      requiredStamps: 4,
      descriptionEn: "",
      instructionsEn: "",
      status: "active",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      nameEn: "",
      nameVi: "",
      requiredStamps: 4,
      descriptionEn: "",
      instructionsEn: "Present your redemption code at the Main Gate Visitor Kiosk.",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const openEdit = (reward: PilotReward) => {
    setEditing(reward);
    form.reset({
      nameEn: reward.name.en,
      nameVi: reward.name.vi,
      requiredStamps: reward.requiredStamps,
      descriptionEn: reward.description.en,
      instructionsEn: reward.redemptionInstructions.en,
      status: reward.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: RewardFormValues) => {
    const next: PilotReward = {
      id: editing?.id ?? `reward-${Date.now()}`,
      collectionId:
        editing?.collectionId ??
        collections[0]?.id ??
        "22222222-2222-4222-8222-222222222201",
      name: { en: values.nameEn, vi: values.nameVi },
      description: {
        en: values.descriptionEn,
        vi: editing?.description.vi ?? values.descriptionEn,
      },
      imageUrl:
        editing?.imageUrl ??
        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80",
      redemptionInstructions: {
        en: values.instructionsEn,
        vi: editing?.redemptionInstructions.vi ?? values.instructionsEn,
      },
      requiredStamps: values.requiredStamps,
      status: values.status,
    };
    upsertReward(next);
    setIsModalOpen(false);
  };

  const filtered = rewards.filter(
    (r) =>
      r.name.en.toLowerCase().includes(search.toLowerCase()) ||
      r.name.vi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell
      title={locale === "vi" ? "Quản Lý Phần Thưởng (Rewards)" : "Rewards Management"}
      subtitle={
        locale === "vi"
          ? "Cấu hình quà tặng hoàn thành bộ sưu tập và hướng dẫn đổi thưởng tại quầy."
          : "Configure completion rewards, stamp thresholds, and redemption instructions."
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-[#78847E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rewards..."
            className="min-h-[42px] w-full rounded-full border border-[#E6DECB] bg-white pl-10 pr-4 py-2 text-xs font-semibold"
          />
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[42px] inline-flex items-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2 text-xs font-extrabold cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{locale === "vi" ? "Thêm phần thưởng" : "New Reward"}</span>
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((reward) => (
          <div
            key={reward.id}
            className="paper-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                    reward.status === "active"
                      ? "bg-[#E7F6F0] text-[#1B7F5C]"
                      : reward.status === "paused"
                      ? "bg-[#FDF6DF] text-[#8F6505]"
                      : "bg-[#FDEAEA] text-[#C93B3B]"
                  }`}
                >
                  {reward.status}
                </span>
                <span className="rounded-full bg-[#E6F3F1] px-2.5 py-0.5 text-[11px] font-bold text-[#176B61]">
                  Threshold: {reward.requiredStamps} stamps
                </span>
              </div>
              <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
                {t(reward.name)}
              </h2>
              <p className="text-xs text-[#525D58]">{t(reward.description)}</p>
              <p className="text-xs font-semibold text-[#176B61]">
                {t(reward.redemptionInstructions)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openEdit(reward)}
              className="min-h-[38px] shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] px-4 py-1.5 text-xs font-extrabold text-[#272E2B] cursor-pointer"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{locale === "vi" ? "Chỉnh sửa" : "Edit"}</span>
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="paper-card max-w-lg w-full p-6 space-y-4">
            <h3 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
              {editing ? "Edit Reward" : "Create Reward"}
            </h3>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Reward Name (EN)
                  </label>
                  <input
                    {...form.register("nameEn")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Reward Name (VI)
                  </label>
                  <input
                    {...form.register("nameVi")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Required Stamps
                  </label>
                  <input
                    type="number"
                    {...form.register("requiredStamps")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
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
                    <option value="paused">paused</option>
                    <option value="exhausted">exhausted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#525D58] mb-1">
                  Description (EN)
                </label>
                <textarea
                  rows={2}
                  {...form.register("descriptionEn")}
                  className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#525D58] mb-1">
                  Redemption Instructions (EN)
                </label>
                <textarea
                  rows={2}
                  {...form.register("instructionsEn")}
                  className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full border border-[#E6DECB] bg-white px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#176B61] text-white px-5 py-2 text-xs font-extrabold"
                >
                  Save Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

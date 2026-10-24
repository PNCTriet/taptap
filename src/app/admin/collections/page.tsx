"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit3, Plus, Search } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AdminShell } from "@/components/admin-shell";
import type { PilotCollection } from "@/types/domain";

const collectionFormSchema = z.object({
  nameEn: z.string().min(2, "English name is required"),
  nameVi: z.string().min(2, "Vietnamese name is required"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  requiredStamps: z.coerce.number().int().min(1).max(20),
  estimatedDurationMinutes: z.coerce.number().int().min(5).max(300),
  descriptionEn: z.string().min(5),
  status: z.enum(["draft", "active", "archived"]),
});

type CollectionFormValues = z.infer<typeof collectionFormSchema>;

export default function AdminCollectionsPage() {
  const { locale, t, venues, collections, upsertCollection } = useExplorer();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<PilotCollection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      nameEn: "",
      nameVi: "",
      slug: "",
      requiredStamps: 4,
      estimatedDurationMinutes: 45,
      descriptionEn: "",
      status: "active",
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({
      nameEn: "",
      nameVi: "",
      slug: "",
      requiredStamps: 4,
      estimatedDurationMinutes: 45,
      descriptionEn: "",
      status: "draft",
    });
    setIsModalOpen(true);
  };

  const openEdit = (col: PilotCollection) => {
    setEditing(col);
    form.reset({
      nameEn: col.name.en,
      nameVi: col.name.vi,
      slug: col.slug,
      requiredStamps: col.requiredStamps,
      estimatedDurationMinutes: col.estimatedDurationMinutes,
      descriptionEn: col.description.en,
      status: col.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: CollectionFormValues) => {
    const next: PilotCollection = {
      id: editing?.id ?? `col-${Date.now()}`,
      venueId: editing?.venueId ?? venues[0]?.id ?? "11111111-1111-4111-8111-111111111101",
      slug: values.slug,
      name: { en: values.nameEn, vi: values.nameVi },
      subtitle: editing?.subtitle ?? {
        en: `${values.requiredStamps} NFC Checkpoints`,
        vi: `${values.requiredStamps} Trạm NFC`,
      },
      description: {
        en: values.descriptionEn,
        vi: editing?.description.vi ?? values.descriptionEn,
      },
      coverImageUrl:
        editing?.coverImageUrl ??
        "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80",
      requiredStamps: values.requiredStamps,
      estimatedDurationMinutes: values.estimatedDurationMinutes,
      status: values.status,
    };
    upsertCollection(next);
    setIsModalOpen(false);
  };

  const filtered = collections.filter(
    (c) =>
      c.name.en.toLowerCase().includes(search.toLowerCase()) ||
      c.name.vi.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell
      title={
        locale === "vi"
          ? "Quản Lý Bộ Sưu Tập (Collections)"
          : "Collections Management"
      }
      subtitle={
        locale === "vi"
          ? "Thiết lập các tuyến hành trình khám phá và tiêu chí hoàn thành."
          : "Configure stamp trails, completion criteria, and publication status."
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-[#78847E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="min-h-[42px] w-full rounded-full border border-[#E6DECB] bg-white pl-10 pr-4 py-2 text-xs font-semibold"
          />
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[42px] inline-flex items-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2 text-xs font-extrabold cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{locale === "vi" ? "Thêm bộ sưu tập" : "New Collection"}</span>
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((col) => (
          <div
            key={col.id}
            className="paper-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                    col.status === "active"
                      ? "bg-[#E7F6F0] text-[#1B7F5C]"
                      : col.status === "draft"
                      ? "bg-[#FDF6DF] text-[#8F6505]"
                      : "bg-[#FDEAEA] text-[#C93B3B]"
                  }`}
                >
                  {col.status}
                </span>
                <span className="font-mono text-xs text-[#78847E]">
                  /collections/{col.slug}
                </span>
                <span className="rounded-full bg-[#E6F3F1] px-2.5 py-0.5 text-[11px] font-bold text-[#176B61]">
                  Required: {col.requiredStamps} stamps
                </span>
              </div>
              <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
                {t(col.name)}
              </h2>
              <p className="text-xs text-[#525D58]">{t(col.description)}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openEdit(col)}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] px-4 py-1.5 text-xs font-extrabold text-[#272E2B] cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{locale === "vi" ? "Chỉnh sửa" : "Edit"}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="paper-card max-w-lg w-full p-6 space-y-4">
            <h3 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
              {editing ? "Edit Collection" : "Create Collection"}
            </h3>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Name (EN)
                  </label>
                  <input
                    {...form.register("nameEn")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Name (VI)
                  </label>
                  <input
                    {...form.register("nameVi")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Slug
                  </label>
                  <input
                    {...form.register("slug")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 font-mono text-xs"
                  />
                </div>
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
                    <option value="draft">draft</option>
                    <option value="active">active</option>
                    <option value="archived">archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#525D58] mb-1">
                  Description (EN)
                </label>
                <textarea
                  rows={3}
                  {...form.register("descriptionEn")}
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
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Edit3, Plus, Search, ShieldAlert } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AdminShell } from "@/components/admin-shell";
import type { PilotVenue } from "@/types/domain";

const venueFormSchema = z.object({
  nameEn: z.string().min(2, "English name is required"),
  nameVi: z.string().min(2, "Vietnamese name is required"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
  locationEn: z.string().min(2, "Location label is required"),
  descriptionEn: z.string().min(5, "Description is required"),
  coverImageUrl: z.string().url("Must be a valid image URL"),
  status: z.enum(["draft", "active", "archived"]),
});

type VenueFormValues = z.infer<typeof venueFormSchema>;

export default function AdminVenuesPage() {
  const { locale, t, venues, upsertVenue } = useExplorer();
  const [search, setSearch] = useState("");
  const [editingVenue, setEditingVenue] = useState<PilotVenue | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      nameEn: "",
      nameVi: "",
      slug: "",
      locationEn: "",
      descriptionEn: "",
      coverImageUrl:
        "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80",
      status: "active",
    },
  });

  const openCreateModal = () => {
    setEditingVenue(null);
    form.reset({
      nameEn: "",
      nameVi: "",
      slug: "",
      locationEn: "Ho Chi Minh City",
      descriptionEn: "",
      coverImageUrl:
        "https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=1200&q=80",
      status: "draft",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (venue: PilotVenue) => {
    setEditingVenue(venue);
    form.reset({
      nameEn: venue.name.en,
      nameVi: venue.name.vi,
      slug: venue.slug,
      locationEn: venue.locationLabel.en,
      descriptionEn: venue.description.en,
      coverImageUrl: venue.coverImageUrl,
      status: venue.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: VenueFormValues) => {
    const nextVenue: PilotVenue = {
      id: editingVenue?.id ?? `venue-${Date.now()}`,
      slug: values.slug,
      name: { en: values.nameEn, vi: values.nameVi },
      description: {
        en: values.descriptionEn,
        vi: editingVenue?.description.vi ?? values.descriptionEn,
      },
      locationLabel: {
        en: values.locationEn,
        vi: editingVenue?.locationLabel.vi ?? values.locationEn,
      },
      coverImageUrl: values.coverImageUrl,
      status: values.status,
      isDemoSeed: true,
    };
    upsertVenue(nextVenue);
    setIsModalOpen(false);
  };

  const filtered = venues.filter(
    (v) =>
      v.name.en.toLowerCase().includes(search.toLowerCase()) ||
      v.name.vi.toLowerCase().includes(search.toLowerCase()) ||
      v.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell
      title={locale === "vi" ? "Quản Lý Điểm Đến (Venues)" : "Venues Management"}
      subtitle={
        locale === "vi"
          ? "Tạo và chỉnh sửa thông tin địa điểm đối tác."
          : "Create and edit partner venues and publication status."
      }
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-[#78847E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              locale === "vi" ? "Tìm theo tên hoặc slug..." : "Search venues by name or slug..."
            }
            className="min-h-[42px] w-full rounded-full border border-[#E6DECB] bg-white pl-10 pr-4 py-2 text-xs font-semibold text-[#272E2B] focus:border-[#176B61] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[42px] inline-flex items-center justify-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2 text-xs font-extrabold transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{locale === "vi" ? "Thêm điểm đến" : "New Venue"}</span>
        </button>
      </div>

      {/* Venues List */}
      <div className="space-y-3">
        {filtered.map((venue) => (
          <div
            key={venue.id}
            className="paper-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                    venue.status === "active"
                      ? "bg-[#E7F6F0] text-[#1B7F5C]"
                      : venue.status === "draft"
                      ? "bg-[#FDF6DF] text-[#8F6505]"
                      : "bg-[#FDEAEA] text-[#C93B3B]"
                  }`}
                >
                  {venue.status}
                </span>
                <span className="font-mono text-xs text-[#78847E]">
                  /{venue.slug}
                </span>
              </div>
              <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
                {t(venue.name)}
              </h2>
              <p className="text-xs text-[#525D58]">{t(venue.description)}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openEditModal(venue)}
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] px-4 py-1.5 text-xs font-extrabold text-[#272E2B] cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{locale === "vi" ? "Chỉnh sửa" : "Edit"}</span>
              </button>

              {venue.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => setConfirmArchiveId(venue.id)}
                  className="min-h-[38px] inline-flex items-center gap-1.5 rounded-full border border-[#C93B3B]/30 bg-[#FDEAEA] hover:bg-[#C93B3B] text-[#C93B3B] hover:text-white px-4 py-1.5 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  <span>{locale === "vi" ? "Lưu trữ" : "Archive"}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Destructive Action Confirmation Dialog */}
      {confirmArchiveId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="paper-card max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-[#C93B3B] shrink-0" />
              <div>
                <h3 className="font-display-serif text-lg font-extrabold text-[#272E2B]">
                  {locale === "vi"
                    ? "Xác nhận lưu trữ điểm đến?"
                    : "Confirm archiving this venue?"}
                </h3>
                <p className="text-xs text-[#525D58] mt-1">
                  {locale === "vi"
                    ? "Điểm đến được lưu trữ sẽ ẩn khỏi trang Khám phá công khai."
                    : "Archived venues are hidden from public visitor discovery."}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmArchiveId(null)}
                className="rounded-full border border-[#E6DECB] bg-white px-4 py-2 text-xs font-bold text-[#272E2B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = venues.find((v) => v.id === confirmArchiveId);
                  if (target) {
                    upsertVenue({ ...target, status: "archived" });
                  }
                  setConfirmArchiveId(null);
                }}
                className="rounded-full bg-[#C93B3B] text-white px-4 py-2 text-xs font-extrabold"
              >
                Confirm Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="paper-card max-w-lg w-full p-6 space-y-4">
            <h3 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
              {editingVenue ? "Edit Venue" : "Create Venue"}
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
                  {form.formState.errors.nameEn && (
                    <p className="text-[11px] text-[#C93B3B] mt-0.5">
                      {form.formState.errors.nameEn.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Name (VI)
                  </label>
                  <input
                    {...form.register("nameVi")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                  {form.formState.errors.nameVi && (
                    <p className="text-[11px] text-[#C93B3B] mt-0.5">
                      {form.formState.errors.nameVi.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Slug
                  </label>
                  <input
                    {...form.register("slug")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 font-mono text-xs"
                  />
                  {form.formState.errors.slug && (
                    <p className="text-[11px] text-[#C93B3B] mt-0.5">
                      {form.formState.errors.slug.message}
                    </p>
                  )}
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
                  Location Label
                </label>
                <input
                  {...form.register("locationEn")}
                  className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                />
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
                  Cover Image URL
                </label>
                <input
                  {...form.register("coverImageUrl")}
                  className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 font-mono text-xs"
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
                  Save Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

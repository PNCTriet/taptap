"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  Plus,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { AdminShell } from "@/components/admin-shell";
import { QrCodeSvg } from "@/components/qr-code-svg";
import { StationIllustration } from "@/components/station-artwork";
import type { PilotStation } from "@/types/domain";

const stationFormSchema = z.object({
  nameEn: z.string().min(2),
  nameVi: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  publicCode: z
    .string()
    .min(6)
    .regex(/^[a-zA-Z0-9_-]+$/),
  locationHintEn: z.string().min(2),
  descriptionEn: z.string().min(5),
  imageUrl: z.string().url(),
  status: z.enum(["active", "maintenance", "inactive"]),
  tagStatus: z.enum(["active", "disabled", "lost", "replaced"]),
});

type StationFormValues = z.infer<typeof stationFormSchema>;

export default function AdminStationsPage() {
  const { locale, t, venues, collections, stations, upsertStation } =
    useExplorer();
  const [search, setSearch] = useState("");
  const [baseOrigin, setBaseOrigin] = useState("https://taptap-five.vercel.app");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editing, setEditing] = useState<PilotStation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDisableStation, setConfirmDisableStation] =
    useState<PilotStation | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setBaseOrigin(window.location.origin);
    }
  }, []);

  const form = useForm<StationFormValues>({
    resolver: zodResolver(stationFormSchema),
    defaultValues: {
      nameEn: "",
      nameVi: "",
      slug: "",
      publicCode: "tcv-new123",
      locationHintEn: "",
      descriptionEn: "",
      imageUrl:
        "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80",
      status: "active",
      tagStatus: "active",
    },
  });

  const handleCopyUrl = (publicCode: string) => {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : baseOrigin;
    const fullUrl = `${origin}/s/${publicCode}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedCode(publicCode);
    window.setTimeout(() => setCopiedCode(null), 2000);
  };

  const openCreate = () => {
    setEditing(null);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    form.reset({
      nameEn: "",
      nameVi: "",
      slug: "",
      publicCode: `tcv-${randomSuffix}`,
      locationHintEn: "Saigon Zoo",
      descriptionEn: "",
      imageUrl:
        "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80",
      status: "active",
      tagStatus: "active",
    });
    setIsModalOpen(true);
  };

  const openEdit = (st: PilotStation) => {
    setEditing(st);
    form.reset({
      nameEn: st.name.en,
      nameVi: st.name.vi,
      slug: st.slug,
      publicCode: st.tag.publicCode,
      locationHintEn: st.locationHint.en,
      descriptionEn: st.description.en,
      imageUrl: st.imageUrl,
      status: st.status,
      tagStatus: st.tag.status,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: StationFormValues) => {
    const nextStation: PilotStation = {
      id: editing?.id ?? `station-${Date.now()}`,
      venueId:
        editing?.venueId ??
        venues[0]?.id ??
        "11111111-1111-4111-8111-111111111101",
      collectionId:
        editing?.collectionId ??
        collections[0]?.id ??
        "22222222-2222-4222-8222-222222222201",
      slug: values.slug,
      name: { en: values.nameEn, vi: values.nameVi },
      description: {
        en: values.descriptionEn,
        vi: editing?.description.vi ?? values.descriptionEn,
      },
      funFact: editing?.funFact ?? {
        en: "Saigon Zoo heritage station.",
        vi: "Trạm di sản Thảo Cầm Viên.",
      },
      locationHint: {
        en: values.locationHintEn,
        vi: editing?.locationHint.vi ?? values.locationHintEn,
      },
      latitude: editing?.latitude ?? 10.7883,
      longitude: editing?.longitude ?? 106.7054,
      imageUrl: values.imageUrl,
      status: values.status,
      tag: {
        id: editing?.tag.id ?? `tag-${Date.now()}`,
        publicCode: values.publicCode,
        label: `${values.nameEn} — NFC`,
        status: values.tagStatus,
      },
      stamp: editing?.stamp ?? {
        id: `stamp-${Date.now()}`,
        name: {
          en: values.nameEn,
          vi: values.nameVi,
        },
        description: {
          en: values.descriptionEn,
          vi: values.descriptionEn,
        },
        imageUrl: values.imageUrl,
        sortOrder: stations.length + 1,
        status: "active",
        accentColor: "teal",
      },
    };
    upsertStation(nextStation);
    setIsModalOpen(false);
  };

  const filtered = stations.filter(
    (s) =>
      s.name.en.toLowerCase().includes(search.toLowerCase()) ||
      s.name.vi.toLowerCase().includes(search.toLowerCase()) ||
      s.tag.publicCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell
      title={locale === "vi" ? "Trạm & Thẻ NFC" : "Stations & NFC URLs"}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-[#78847E] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stations or public_code..."
            className="min-h-[42px] w-full rounded-full border border-[#E6DECB] bg-white pl-10 pr-4 py-2 text-xs font-semibold"
          />
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="min-h-[42px] inline-flex items-center gap-2 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2 text-xs font-extrabold cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{locale === "vi" ? "Thêm trạm" : "New Station"}</span>
        </button>
      </div>

      <div className="space-y-4">
        {filtered.map((st) => {
          const fullNfcUrl = `${baseOrigin}/s/${st.tag.publicCode}`;
          return (
            <div
              key={st.id}
              className="paper-card p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center"
            >
              {/* Station Info */}
              <div className="lg:col-span-8 space-y-2.5">
                <div className="flex items-center gap-3">
                  <StationIllustration stationIdOrSlug={st.id} variant="avatar" className="h-12 w-12 shrink-0 border border-[#E6DECB]" />
                  <div>
                    <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B]">{t(st.name)}</h2>
                    <p className="type-mono text-[11px] text-[#78847E]">{st.latitude.toFixed(4)}, {st.longitude.toFixed(4)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                      st.status === "active"
                        ? "bg-[#E7F6F0] text-[#1B7F5C]"
                        : st.status === "maintenance"
                        ? "bg-[#FDF6DF] text-[#8F6505]"
                        : "bg-[#FDEAEA] text-[#C93B3B]"
                    }`}
                  >
                    {st.status}
                  </span>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                      st.tag.status === "active"
                        ? "bg-[#E6F3F1] text-[#176B61]"
                        : "bg-[#FDEAEA] text-[#C93B3B]"
                    }`}
                  >
                    NFC: {st.tag.status}
                  </span>

                  <span className="font-mono text-xs text-[#78847E]">
                    #{st.stamp.sortOrder}
                  </span>
                </div>

                <p className="text-xs text-[#525D58]">{t(st.description)}</p>

                {/* Copyable Full NFC URL */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <code className="rounded-xl bg-[#F5EFE2] border border-[#E6DECB] px-3 py-1.5 font-mono text-xs font-bold text-[#272E2B] break-all">
                    {fullNfcUrl}
                  </code>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(st.tag.publicCode)}
                    className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-4 py-1.5 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    {copiedCode === st.tag.publicCode ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#F2C653]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#F2C653]" />
                        <span>Copy NFC URL</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/s/${st.tag.publicCode}`}
                    className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] px-3.5 py-1.5 text-xs font-bold text-[#272E2B]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Test NFC Tap</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => openEdit(st)}
                    className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-white hover:bg-[#F5EFE2] px-3.5 py-1.5 text-xs font-bold text-[#272E2B] cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>

                  {st.tag.status === "active" && (
                    <button
                      type="button"
                      onClick={() => setConfirmDisableStation(st)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full border border-[#C93B3B]/30 bg-[#FDEAEA] hover:bg-[#C93B3B] text-[#C93B3B] hover:text-white px-3.5 py-1.5 text-xs font-extrabold transition-colors cursor-pointer"
                    >
                      <span>Disable</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SVG QR Code Preview & Download */}
              <div className="lg:col-span-4 flex justify-start lg:justify-end">
                <QrCodeSvg
                  value={fullNfcUrl}
                  label={t(st.name)}
                  code={st.tag.publicCode}
                  size={128}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog for Disabling an NFC Tag */}
      {confirmDisableStation && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="paper-card max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-6 w-6 text-[#C93B3B] shrink-0" />
              <div>
                <h3 className="font-display-serif text-lg font-extrabold text-[#272E2B]">
                  Disable NFC Tag {confirmDisableStation.tag.publicCode}?
                </h3>
                <p className="text-xs text-[#525D58] mt-1">
                  Visitors tapping `/s/{confirmDisableStation.tag.publicCode}`
                  will see an inactive tag notice.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDisableStation(null)}
                className="rounded-full border border-[#E6DECB] bg-white px-4 py-2 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  upsertStation({
                    ...confirmDisableStation,
                    tag: {
                      ...confirmDisableStation.tag,
                      status: "disabled",
                    },
                  });
                  setConfirmDisableStation(null);
                }}
                className="rounded-full bg-[#C93B3B] text-white px-4 py-2 text-xs font-extrabold"
              >
                Confirm Disable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Station Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="paper-card max-w-lg w-full p-6 space-y-4">
            <h3 className="font-display-serif text-xl font-extrabold text-[#272E2B]">
              {editing ? "Edit Station & NFC Tag" : "Create Station & NFC Tag"}
            </h3>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Station Name (EN)
                  </label>
                  <input
                    {...form.register("nameEn")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Station Name (VI)
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
                    Station Slug
                  </label>
                  <input
                    {...form.register("slug")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    NFC Tag Public Code (/s/[code])
                  </label>
                  <input
                    {...form.register("publicCode")}
                    className="w-full rounded-xl border border-[#CFC4AB] px-3 py-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    Station Status
                  </label>
                  <select
                    {...form.register("status")}
                    className="w-full rounded-xl border border-[#CFC4AB] bg-white px-3 py-2 text-xs"
                  >
                    <option value="active">active</option>
                    <option value="maintenance">maintenance</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#525D58] mb-1">
                    NFC Tag Status
                  </label>
                  <select
                    {...form.register("tagStatus")}
                    className="w-full rounded-xl border border-[#CFC4AB] bg-white px-3 py-2 text-xs"
                  >
                    <option value="active">active</option>
                    <option value="disabled">disabled</option>
                    <option value="lost">lost</option>
                    <option value="replaced">replaced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#525D58] mb-1">
                  Location Hint (EN)
                </label>
                <input
                  {...form.register("locationHintEn")}
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
                  Photo URL
                </label>
                <input
                  {...form.register("imageUrl")}
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
                  Save Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

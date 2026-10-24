"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Globe,
  RotateCcw,
  Shield,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useExplorer } from "@/context/explorer-context";

export default function ProfilePage() {
  const {
    locale,
    setLocale,
    session,
    updateDisplayName,
    collectedStamps,
    redemptions,
    resetDemoProgress,
    loadSampleProgress,
  } = useExplorer();

  const [nameInput, setNameInput] = useState(session.displayName);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateDisplayName(nameInput);
    setSavedBanner(true);
    window.setTimeout(() => setSavedBanner(false), 2500);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display-serif text-3xl font-extrabold text-[#272E2B]">
          {locale === "vi" ? "Hồ Sơ Nhà Thám Hiểm" : "Explorer Profile & Preferences"}
        </h1>
        <p className="text-sm text-[#525D58] mt-1">
          {locale === "vi"
            ? "Quản lý ngôn ngữ hiển thị, phiên hộ chiếu ẩn danh và công cụ kiểm thử dữ liệu mẫu."
            : "Manage your display language, anonymous passport session, and pilot demo utilities."}
        </p>
      </div>

      {/* Session Identity Card */}
      <section className="paper-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#176B61] text-white flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-[#F2C653]" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E6F3F1] px-2.5 py-0.5 text-[11px] font-extrabold text-[#176B61]">
                {session.isAnonymous
                  ? locale === "vi"
                    ? "Phiên Khách Ẩn Danh (Guest Session)"
                    : "Anonymous Guest Session"
                  : locale === "vi"
                  ? "Tài Khoản Đã Liên Kết"
                  : "Linked Account"}
              </span>
              <h2 className="font-display-serif text-xl font-extrabold text-[#272E2B] mt-1">
                {session.displayName}
              </h2>
              <p className="font-mono text-xs text-[#78847E]">
                ID: {session.participantId}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3 pt-3 border-t border-[#E6DECB]">
          <label
            htmlFor="display-name-input"
            className="block text-xs font-extrabold uppercase tracking-wider text-[#525D58]"
          >
            {locale === "vi" ? "Tên hiển thị trên Hộ chiếu" : "Passport Display Name"}
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="display-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="min-h-[44px] flex-1 rounded-xl border border-[#CFC4AB] bg-[#FFFDF8] px-3.5 py-2 text-sm font-semibold text-[#272E2B] focus:border-[#176B61] focus:outline-none"
              placeholder="Saigon Explorer"
            />
            <button
              type="submit"
              className="min-h-[44px] rounded-full bg-[#176B61] hover:bg-[#12564E] text-white px-5 py-2 text-xs font-extrabold transition-colors cursor-pointer"
            >
              {locale === "vi" ? "Lưu tên" : "Save Name"}
            </button>
          </div>
          {savedBanner && (
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B7F5C]">
              <CheckCircle2 className="h-4 w-4" />
              {locale === "vi"
                ? "Đã cập nhật tên hiển thị!"
                : "Passport display name updated!"}
            </p>
          )}
        </form>
      </section>

      {/* Bilingual Language Preference Card */}
      <section className="paper-card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Globe className="h-5 w-5 text-[#176B61]" />
          <h2 className="font-display-serif text-lg font-extrabold text-[#272E2B]">
            {locale === "vi" ? "Ngôn Ngữ Giao Diện (EN / VI)" : "Language Preference (EN / VI)"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`min-h-[52px] rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
              locale === "en"
                ? "border-2 border-[#176B61] bg-[#E6F3F1]/60"
                : "border-[#E6DECB] bg-white hover:bg-[#F5EFE2]"
            }`}
          >
            <p className="text-sm font-extrabold text-[#272E2B]">English (Default)</p>
            <p className="text-xs text-[#525D58]">
              International visitor passport interface
            </p>
          </button>

          <button
            type="button"
            onClick={() => setLocale("vi")}
            className={`min-h-[52px] rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
              locale === "vi"
                ? "border-2 border-[#176B61] bg-[#E6F3F1]/60"
                : "border-[#E6DECB] bg-white hover:bg-[#F5EFE2]"
            }`}
          >
            <p className="text-sm font-extrabold text-[#272E2B]">Tiếng Việt</p>
            <p className="text-xs text-[#525D58]">
              Giao diện song ngữ cho khách tham quan Việt Nam
            </p>
          </button>
        </div>
      </section>

      {/* Anonymous Participation & Security Architecture Note */}
      <section className="paper-card p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-[#4D73CF]" />
          <h2 className="font-display-serif text-lg font-extrabold text-[#272E2B]">
            {locale === "vi"
              ? "Cơ Chế Lưu Trữ Hộ Chiếu Ẩn Danh"
              : "Frictionless Anonymous Participation"}
          </h2>
        </div>
        <p className="text-xs text-[#525D58] leading-relaxed">
          {locale === "vi"
            ? "Bạn có thể chạm thẻ NFC và sưu tầm con dấu ngay lập tức mà không cần đăng ký tài khoản. Khi kết nối Supabase Production, phiên ẩn danh (Supabase Anonymous Sign-In) có thể liên kết với email bất kỳ lúc nào mà vẫn giữ nguyên toàn bộ con dấu đã thu thập."
            : "TAPTAP lets visitors collect stamps on their first NFC tap without a registration wall. In production, Supabase Anonymous Auth sessions can be upgraded to a permanent email/OAuth identity at any time while preserving your participant_id and collected_stamps."}
        </p>
      </section>

      {/* Demo Progress Testing Controls */}
      <section className="paper-card p-6 space-y-4">
        <h2 className="font-display-serif text-lg font-extrabold text-[#272E2B]">
          {locale === "vi"
            ? "Công Cụ Kiểm Thử Tiến Độ (Demo Controls)"
            : "Pilot Demo Testing Controls"}
        </h2>
        <p className="text-xs text-[#525D58]">
          {locale === "vi"
            ? `Hiện đang có ${collectedStamps.length} con dấu và ${redemptions.length} mã đổi thưởng trong phiên trình duyệt này.`
            : `Currently holding ${collectedStamps.length} collected stamp(s) and ${redemptions.length} redemption voucher(s) in this session.`}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadSampleProgress}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-full bg-[#E6F3F1] hover:bg-[#176B61] text-[#176B61] hover:text-white px-4 py-2 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {locale === "vi"
                ? "Nạp thử 2/4 con dấu mẫu"
                : "Load Sample Progress (2/4 Stamps)"}
            </span>
          </button>

          <button
            type="button"
            onClick={resetDemoProgress}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-full border border-[#C93B3B]/40 bg-[#FDEAEA] hover:bg-[#C93B3B] text-[#C93B3B] hover:text-white px-4 py-2 text-xs font-extrabold transition-colors cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>
              {locale === "vi"
                ? "Đặt lại toàn bộ dữ liệu thử nghiệm"
                : "Reset Demo Progress"}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

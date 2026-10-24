"use client";

import React, { useEffect, useState } from "react";
import { Check, LogOut, RotateCcw, Sparkles } from "lucide-react";
import { useExplorer } from "@/context/explorer-context";
import { GoogleIcon, GoogleSignInButton } from "@/components/google-sign-in-button";

export default function ProfilePage() {
  const {
    locale,
    setLocale,
    isAuthenticated,
    user,
    signOut,
    session,
    updateDisplayName,
    collectedStamps,
    resetDemoProgress,
    loadSampleProgress,
  } = useExplorer();

  const [nameInput, setNameInput] = useState(session.displayName);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNameInput(session.displayName);
  }, [session.displayName]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDisplayName(nameInput);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="mx-auto max-w-md space-y-5">
      <h1 className="font-display-serif text-2xl font-extrabold text-[#272E2B]">
        {locale === "vi" ? "Hồ sơ" : "Profile"}
      </h1>

      {/* Clean iOS-Style Grouped List */}
      <div className="paper-card divide-y divide-[#E6DECB] overflow-hidden">
        {/* Google Account Row */}
        <div className="p-4 space-y-3">
          {isAuthenticated && user ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E6DECB] bg-white">
                  <GoogleIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#272E2B]">
                    {user.name}
                  </p>
                  <p className="truncate text-xs font-semibold text-[#525D58]">
                    {user.email ?? "Gmail Linked"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="min-h-[36px] inline-flex items-center gap-1.5 rounded-full border border-[#E6DECB] bg-[#FAF5EA] px-3.5 py-1.5 text-xs font-extrabold text-[#272E2B] hover:bg-[#EDE6D6] cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{locale === "vi" ? "Đăng xuất" : "Sign out"}</span>
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              nextPath="/profile"
              labelEn="Continue with Google"
              labelVi="Đăng nhập Gmail"
            />
          )}
        </div>

        {/* Display Name */}
        <form onSubmit={handleSave} className="p-4 space-y-2">
          <label
            htmlFor="display-name-input"
            className="block text-xs font-extrabold text-[#525D58]"
          >
            {locale === "vi" ? "Tên hiển thị" : "Name"}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="display-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="min-h-[40px] flex-1 rounded-xl border border-[#CFC4AB] bg-[#FFFDF8] px-3 py-1.5 text-sm font-semibold text-[#272E2B] focus:border-[#176B61] focus:outline-none"
            />
            <button
              type="submit"
              className="min-h-[40px] rounded-full bg-[#176B61] text-white px-4 py-1.5 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1"
            >
              {saved ? <Check className="h-3.5 w-3.5" /> : null}
              <span>{locale === "vi" ? "Lưu" : "Save"}</span>
            </button>
          </div>
        </form>

        {/* Language Row */}
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-bold text-[#272E2B]">
            {locale === "vi" ? "Ngôn ngữ" : "Language"}
          </span>
          <div className="inline-flex rounded-full border border-[#E6DECB] bg-[#F5EFE2] p-0.5">
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-full px-3 py-1 text-xs font-extrabold cursor-pointer ${
                locale === "en" ? "bg-[#176B61] text-white" : "text-[#525D58]"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("vi")}
              className={`rounded-full px-3 py-1 text-xs font-extrabold cursor-pointer ${
                locale === "vi" ? "bg-[#176B61] text-white" : "text-[#525D58]"
              }`}
            >
              VI
            </button>
          </div>
        </div>

        {/* Session Status (1 line) */}
        <div className="p-4 flex items-center justify-between text-xs">
          <span className="font-bold text-[#525D58]">
            {locale === "vi" ? "Trạng thái" : "Session"}
          </span>
          <span className="font-mono font-semibold text-[#272E2B]">
            {isAuthenticated
              ? locale === "vi"
                ? "Đã liên kết Gmail"
                : "Google Linked"
              : locale === "vi"
                ? "Chưa đăng nhập"
                : "Signed out"}{" "}
            • {collectedStamps.length} {locale === "vi" ? "tem" : "stamps"}
          </span>
        </div>

        {/* Actions */}
        <div className="p-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={loadSampleProgress}
            className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#E6F3F1] text-[#176B61] px-3 py-2 text-xs font-extrabold cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{locale === "vi" ? "Nạp mẫu (2/4)" : "Sample (2/4)"}</span>
          </button>

          <button
            type="button"
            onClick={resetDemoProgress}
            className="min-h-[40px] flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FDEAEA] text-[#C93B3B] px-3 py-2 text-xs font-extrabold cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{locale === "vi" ? "Đặt lại" : "Reset progress"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

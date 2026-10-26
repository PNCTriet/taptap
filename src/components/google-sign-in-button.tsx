"use client";

import React, { useState } from "react";
import { Check, Loader2, Mail, Sparkles, User, X } from "lucide-react";
import {
  deriveDisplayNameFromEmail,
  normalizeGmailInput,
  useExplorer,
} from "@/context/explorer-context";

interface GoogleSignInButtonProps {
  nextPath?: string;
  className?: string;
  compact?: boolean;
  size?: "md" | "lg";
  labelEn?: string;
  labelVi?: string;
  label?: {
    en: string;
    vi: string;
  };
}

const QUICK_GMAIL_ACCOUNTS = [
  {
    email: "explorer.tcv@gmail.com",
    displayName: "Saigon Explorer",
    badge: {
      en: "1-Tap Instant",
      vi: "Chạm để vào ngay",
    },
  },
  {
    email: "visitor.saigonzoo@gmail.com",
    displayName: "Zoo Visitor",
    badge: {
      en: "Guest Pass",
      vi: "Khách tham quan",
    },
  },
] as const;

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  className = "",
  compact = false,
  size = "lg",
  labelEn,
  labelVi,
  label,
}: GoogleSignInButtonProps) {
  const {
    locale,
    signInWithGmail,
    authError,
    isGmailModalOpen,
    closeGmailModal,
  } = useExplorer();
  const [modalOpen, setModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [submittingEmail, setSubmittingEmail] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isOpen = modalOpen || isGmailModalOpen;
  const isCompact = compact || size === "md";

  const handleClose = () => {
    if (submittingEmail) return;
    setModalOpen(false);
    closeGmailModal();
  };

  const resolvedEn = labelEn ?? label?.en ?? "Continue with Gmail";
  const resolvedVi = labelVi ?? label?.vi ?? "Đăng nhập Gmail";
  const buttonText = locale === "vi" ? resolvedVi : resolvedEn;

  const handleQuickSignIn = async (email: string, displayName: string) => {
    if (submittingEmail) return;
    setLocalError(null);
    setSubmittingEmail(email);
    try {
      const result = await signInWithGmail(email, displayName);
      if (result.ok) {
        setModalOpen(false);
        closeGmailModal();
      } else if (result.error) {
        setLocalError(result.error);
      }
    } finally {
      setSubmittingEmail(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingEmail) return;
    setLocalError(null);

    const { valid, email } = normalizeGmailInput(emailInput);
    if (!valid) {
      setLocalError(
        locale === "vi"
          ? "Vui lòng nhập địa chỉ Gmail hoặc tên tài khoản hợp lệ."
          : "Please enter a valid Gmail address or username."
      );
      return;
    }

    const resolvedName = deriveDisplayNameFromEmail(email, displayNameInput);
    setSubmittingEmail(email);
    try {
      const result = await signInWithGmail(email, resolvedName);
      if (result.ok) {
        setModalOpen(false);
        closeGmailModal();
      } else if (result.error) {
        setLocalError(result.error);
      }
    } finally {
      setSubmittingEmail(null);
    }
  };

  const previewEmail = emailInput.trim()
    ? normalizeGmailInput(emailInput).email
    : "";

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => {
          setLocalError(null);
          setModalOpen(true);
        }}
        data-testid="google-signin-button"
        className={`group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-stone-200/90 bg-white font-semibold text-stone-900 shadow-[0_8px_20px_-6px_rgba(28,25,23,0.14)] transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.985] ${
          isCompact ? "px-4 py-2.5 text-xs" : "px-5 py-3.5 text-sm"
        } ${className}`}
      >
        <GoogleIcon className={isCompact ? "h-4 w-4" : "h-5 w-5"} />
        <span>{buttonText}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-950/60 p-3 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={handleClose}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="instant-gmail-title"
            data-testid="instant-gmail-modal"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-[28px] border border-stone-200/90 bg-white p-5 text-left shadow-2xl sm:p-6"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200/80 bg-stone-50 shadow-2xs">
                  <GoogleIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3
                    id="instant-gmail-title"
                    className="font-serif text-lg font-bold tracking-tight text-stone-900"
                  >
                    {locale === "vi"
                      ? "Đăng nhập bằng Gmail"
                      : "Continue with Gmail"}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {locale === "vi"
                      ? "Đăng nhập 1 chạm để lưu tem của bạn"
                      : "Instant sign-in to save your stamps"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={Boolean(submittingEmail)}
                aria-label={locale === "vi" ? "Đóng" : "Close"}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 transition hover:bg-stone-200 hover:text-stone-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 1-Tap Quick Demo Gmail Buttons */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  {locale === "vi"
                    ? "Đăng nhập nhanh 1 chạm"
                    : "1-Tap Quick Sign-In"}
                </span>
              </div>

              <div className="space-y-2">
                {QUICK_GMAIL_ACCOUNTS.map((acct, index) => {
                  const isBusy = submittingEmail === acct.email;
                  return (
                    <button
                      key={acct.email}
                      type="button"
                      disabled={Boolean(submittingEmail)}
                      data-testid={
                        index === 0
                          ? "gmail-quick-signin-button"
                          : `gmail-quick-signin-button-${index}`
                      }
                      onClick={() =>
                        void handleQuickSignIn(acct.email, acct.displayName)
                      }
                      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-emerald-900/15 bg-emerald-950/[0.03] px-3.5 py-2.5 text-left transition hover:border-emerald-700/40 hover:bg-emerald-950/[0.07] active:scale-[0.99] disabled:opacity-60"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-bold text-amber-200">
                          {acct.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-stone-900">
                            {locale === "vi"
                              ? `Dùng nhanh ${acct.email}`
                              : `Continue as ${acct.email}`}
                          </p>
                          <p className="truncate text-[11px] text-stone-500">
                            {acct.displayName} •{" "}
                            {locale === "vi" ? acct.badge.vi : acct.badge.en}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-emerald-900 shadow-2xs transition group-hover:bg-emerald-900 group-hover:text-white">
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-stone-200/80" />
              <span className="bg-white px-2.5 text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                {locale === "vi" ? "Hoặc nhập Gmail" : "Or enter your Gmail"}
              </span>
              <div className="w-full border-t border-stone-200/80" />
            </div>

            {/* Custom Gmail Form */}
            <form
              onSubmit={(e) => void handleFormSubmit(e)}
              noValidate
              className="space-y-3"
            >
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-stone-600">
                  {locale === "vi" ? "Địa chỉ Gmail" : "Gmail Address"}
                </label>
                <div className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={emailInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmailInput(val);
                      if (localError) setLocalError(null);
                    }}
                    onBlur={() => {
                      const trimmed = emailInput.trim();
                      if (trimmed && !trimmed.includes("@")) {
                        setEmailInput(`${trimmed.toLowerCase()}@gmail.com`);
                      }
                    }}
                    placeholder="yourname@gmail.com"
                    data-testid="gmail-email-input"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/70 py-2.5 pr-3.5 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:bg-white focus:outline-none"
                  />
                </div>
                {previewEmail && !emailInput.includes("@") && (
                  <p className="mt-1 text-[11px] text-emerald-800">
                    {locale === "vi" ? "Tự động điền:" : "Auto-completes to:"}{" "}
                    <span className="font-semibold">{previewEmail}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-stone-600">
                  {locale === "vi"
                    ? "Tên hiển thị (tuỳ chọn)"
                    : "Display Name (optional)"}
                </label>
                <div className="relative flex items-center">
                  <User className="pointer-events-none absolute left-3.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder={
                      locale === "vi" ? "VD: Minh Anh" : "e.g. Saigon Explorer"
                    }
                    data-testid="gmail-name-input"
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/70 py-2.5 pr-3.5 pl-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {(localError || authError) && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                  {localError || authError}
                </p>
              )}

              <button
                type="submit"
                disabled={Boolean(submittingEmail)}
                data-testid="gmail-submit-button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-3.5 text-sm font-semibold text-amber-100 shadow-md transition hover:bg-emerald-900 active:scale-[0.99] disabled:opacity-60"
              >
                {submittingEmail &&
                !QUICK_GMAIL_ACCOUNTS.some(
                  (a) => a.email === submittingEmail
                ) ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-200" />
                ) : null}
                <span>{locale === "vi" ? "Tiếp tục" : "Continue"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

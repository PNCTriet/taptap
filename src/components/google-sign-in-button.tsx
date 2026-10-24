"use client";

import React, { useState } from "react";
import { useExplorer } from "@/context/explorer-context";

interface GoogleSignInButtonProps {
  nextPath?: string;
  labelEn?: string;
  labelVi?: string;
  fullWidth?: boolean;
  size?: "md" | "lg";
}

export function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.98h3.86c2.26-2.09 3.56-5.17 3.56-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.31c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31V6.6H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.4l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.6l3.98 3.09c.95-2.85 3.6-4.94 6.73-4.94z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  nextPath,
  labelEn = "Continue with Google",
  labelVi = "Đăng nhập Gmail",
  fullWidth = true,
  size = "lg",
}: GoogleSignInButtonProps) {
  const { locale, signInWithGoogle, authError } = useExplorer();
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    try {
      setSubmitting(true);
      await signInWithGoogle(nextPath);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={fullWidth ? "w-full space-y-2" : "inline-block space-y-2"}>
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        data-testid="google-signin-button"
        className={`${
          fullWidth ? "w-full" : ""
        } ${
          size === "lg" ? "min-h-[50px] px-5 py-3 text-sm" : "min-h-[42px] px-4 py-2 text-xs"
        } inline-flex items-center justify-center gap-3 rounded-full border-2 border-[#272E2B] bg-white hover:bg-[#FAF5EA] text-[#272E2B] font-extrabold shadow-sm transition-transform active:scale-[0.99] cursor-pointer disabled:opacity-60`}
      >
        <GoogleIcon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
        <span>
          {submitting
            ? locale === "vi"
              ? "Đang kết nối Gmail..."
              : "Connecting Google..."
            : locale === "vi"
              ? labelVi
              : labelEn}
        </span>
      </button>
      {authError ? (
        <p className="text-center text-xs font-semibold text-[#C93B3B]">{authError}</p>
      ) : null}
    </div>
  );
}

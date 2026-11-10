"use client";

import React, { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button, Card, Field, Notice, TextInput, useTx } from "@/components/console/kit";
import { useExplorer } from "@/context/explorer-context";
import { sanitizeNextPath } from "@/lib/env";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { mergeGuestProgress } from "@/lib/passport-client";

function LoginForm() {
  const tx = useTx();
  const { isAuthenticated, user, signOut } = useExplorer();
  const params = useSearchParams();
  const next = sanitizeNextPath(params.get("next") ?? "/");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClientSupabaseClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setError(tx("Email or password is incorrect.", "Email hoặc mật khẩu không đúng."));
      setBusy(false);
      return;
    }
    // Move any guest stamps (httpOnly guest cookie) into this account before leaving the page.
    try {
      const r = await mergeGuestProgress();
      if (r.merged + r.alreadyOwned > 0) window.sessionStorage.setItem("taptap:merge-notice", JSON.stringify(r));
    } catch {
      /* the passport retries the merge on load */
    }
    window.location.assign(next);
  };

  return (
    <div className="mx-auto max-w-sm space-y-4 py-6">
      <h1 className="text-[28px] font-bold tracking-tight text-[#1D1D1F]">{tx("Sign in", "Đăng nhập")}</h1>
      {isAuthenticated ? (
        <Card className="space-y-3">
          <p className="text-[15px] text-[#1D1D1F]" data-testid="signed-in-as">{user?.email}</p>
          <div className="flex gap-2">
            <Button onClick={() => window.location.assign(next)}>{tx("Continue", "Tiếp tục")}</Button>
            <Button tone="secondary" onClick={() => void signOut()}>{tx("Sign out", "Đăng xuất")}</Button>
          </div>
        </Card>
      ) : (
        <>
          <GoogleSignInButton nextPath={next} />
          <div className="flex items-center gap-3 text-[12px] text-[#8E8E93]">
            <span className="h-px flex-1 bg-black/10" />
            {tx("or demo account", "hoặc tài khoản demo")}
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <form onSubmit={submit} className="space-y-3">
            <Field label="Email">
              <TextInput type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" />
            </Field>
            <Field label={tx("Password", "Mật khẩu")}>
              <TextInput type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" />
            </Field>
            {error ? <Notice>{error}</Notice> : null}
            <Button type="submit" disabled={busy} className="w-full" data-testid="login-submit">
              {busy ? tx("Signing in…", "Đang đăng nhập…") : tx("Sign in", "Đăng nhập")}
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

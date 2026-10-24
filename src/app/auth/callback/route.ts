import { NextResponse, type NextRequest } from "next/server";
import { isSupabasePublicEnvConfigured, sanitizeNextPath } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (code && isSupabasePublicEnvConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
      }
    } catch {
      // Fall through to safe redirect with auth_error indicator
    }

    const errorUrl = new URL(nextPath, requestUrl.origin);
    errorUrl.searchParams.set("auth_error", "callback_failed");
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}

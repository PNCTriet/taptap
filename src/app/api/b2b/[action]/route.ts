import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { B2B_ACTIONS } from "@/server/b2b/actions";
import { mapDbError } from "@/server/quota/errors";
import { checkQuota, parseTenantUsage } from "@/server/quota/quota";

/**
 * POST /api/b2b/<action> — validated B2B mutations.
 * Runs with the caller's session (RLS + RPC role checks). Quota is pre-checked here
 * and enforced again by database triggers; over-quota => HTTP 409 + message.
 */
export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params;
  const def = B2B_ACTIONS[action];
  if (!def) return NextResponse.json({ ok: false, code: "UNKNOWN_ACTION" }, { status: 404 });

  const parsed = def.schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "INVALID", issues: parsed.error.issues.map((i) => i.path.join(".")),
        message: { en: "Check the highlighted fields.", vi: "Kiểm tra lại thông tin." } },
      { status: 422 }
    );
  }

  const { supabase, user } = await getSession();
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED",
      message: { en: "Sign in first.", vi: "Hãy đăng nhập." } }, { status: 401 });
  }

  if (def.quota) {
    const tenantId = (parsed.data as Record<string, string>)[def.quota.tenantKey];
    const usageRes = await supabase.rpc("tenant_usage", { p_tenant: tenantId });
    if (usageRes.error) {
      const mapped = mapDbError(usageRes.error);
      return NextResponse.json({ ok: false, ...mapped }, { status: mapped.status });
    }
    const usage = parseTenantUsage(usageRes.data);
    const check = checkQuota(def.quota.resource, usage.used, usage.limits);
    if (!check.allowed) {
      const mapped = mapDbError({ message: `QUOTA_EXCEEDED:${check.resource}:${check.used}/${check.max}` });
      return NextResponse.json({ ok: false, ...mapped }, { status: mapped.status });
    }
  }

  const { data, error } = await supabase.rpc(def.rpc, def.toParams(parsed.data as never));
  if (error) {
    const mapped = mapDbError(error);
    return NextResponse.json({ ok: false, ...mapped }, { status: mapped.status });
  }
  return NextResponse.json({ ok: true, data });
}

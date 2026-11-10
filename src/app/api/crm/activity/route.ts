import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { maskEmail, resolveCrmScope, shouldMaskEmails } from "@/server/crm/access";
import { aggregateCrm, buildVisitorRows, windowFor, zonedStartIso } from "@/server/crm/aggregate";
import { parseCrmActivity } from "@/server/crm/parse";
import { mapDbError } from "@/server/quota/errors";
import { parseTenantUsage } from "@/server/quota/quota";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Asia/Ho_Chi_Minh";

const COPY = {
  signIn: { en: "Sign in first.", vi: "Hãy đăng nhập." },
  forbidden: { en: "You can only view your own tenant.", vi: "Bạn chỉ xem được tenant của mình." },
  tenant: { en: "Choose a tenant.", vi: "Hãy chọn tenant." },
  invalid: { en: "That CRM scope is not valid.", vi: "Phạm vi CRM không hợp lệ." },
  migration: {
    en: "CRM analytics appear after the dashboard migration is applied.",
    vi: "Số liệu CRM sẽ hiện sau khi áp migration bảng điều khiển.",
  },
};

function missingFunction(error: { code?: string | null; message?: string | null }): boolean {
  const message = error.message ?? "";
  return error.code === "PGRST202" || /crm_activity/i.test(message) && /does not exist|schema cache|could not find/i.test(message);
}

/**
 * GET /api/crm/activity?scope=<tenant uuid|b2c|all>&days=30
 * Tenant roles see only their tenant. Platform admin may pass b2c or all.
 * The RPC repeats the role check. Aggregation runs in TypeScript.
 */
export async function GET(request: Request) {
  const { supabase, user, isPlatformAdmin } = await getSession();
  if (!supabase || !user) {
    return NextResponse.json({ ok: false, code: "UNAUTHENTICATED", message: COPY.signIn }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysRaw = Number(url.searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysRaw) ? Math.min(90, Math.max(1, Math.floor(daysRaw))) : 30;
  const { data: membershipRows, error: memberError } = await supabase
    .from("tenant_members")
    .select("tenant_id, role")
    .eq("user_id", user.id);
  if (memberError) {
    const mapped = mapDbError(memberError);
    return NextResponse.json({ ok: false, ...mapped }, { status: mapped.status });
  }

  const decision = resolveCrmScope({
    isPlatformAdmin,
    memberships: ((membershipRows ?? []) as { tenant_id: string; role: string }[]).map((row) => ({
      tenantId: row.tenant_id,
      role: row.role,
    })),
    requested: url.searchParams.get("scope"),
  });
  if (!decision.ok) {
    const message = decision.code === "TENANT_REQUIRED" ? COPY.tenant : decision.code === "INVALID" ? COPY.invalid : COPY.forbidden;
    return NextResponse.json({ ok: false, code: decision.code, message }, { status: decision.status });
  }

  const range = windowFor(TIME_ZONE, days);
  const since = zonedStartIso(range.from, TIME_ZONE);
  const { data, error } = await supabase.rpc("crm_activity", {
    p_scope: decision.scope,
    p_tenant: decision.scope === "tenant" ? decision.tenantId : null,
    p_since: since,
    p_participant: null,
  });
  if (error) {
    if (missingFunction(error)) {
      return NextResponse.json({ ok: false, code: "MIGRATION_REQUIRED", message: COPY.migration }, { status: 503 });
    }
    const mapped = mapDbError(error);
    return NextResponse.json({ ok: false, ...mapped }, { status: mapped.status });
  }

  const parsed = parseCrmActivity(data);
  // Defense in depth: crm_activity already masks for tenant viewers; mask again here.
  const memberships = (membershipRows ?? []) as { tenant_id: string; role: string }[];
  const callerRole =
    decision.scope === "tenant"
      ? memberships.find((row) => row.tenant_id === decision.tenantId)?.role ?? null
      : null;
  if (shouldMaskEmails({ isPlatformAdmin, scope: decision.scope, role: callerRole })) {
    parsed.people = parsed.people.map((person) => ({ ...person, email: maskEmail(person.email) }));
  }
  const input = {
    timeZone: TIME_ZONE,
    from: range.from,
    to: range.to,
    taps: parsed.taps,
    grants: parsed.grants,
    holdings: parsed.holdings,
    activeStampIds: parsed.activeStampIds,
    fallbackTapsToGrants: parsed.taps.length === 0 && parsed.grants.length > 0,
  };
  const usage = parsed.quota ? parseTenantUsage(parsed.quota) : null;
  return NextResponse.json({
    ok: true,
    range,
    timeZone: TIME_ZONE,
    truncated: parsed.truncated,
    overview: aggregateCrm(input),
    visitors: buildVisitorRows(input, parsed.people),
    taps: parsed.taps,
    grants: parsed.grants,
    quota: usage
      ? { limits: usage.limits, used: usage.used, packageCode: usage.packageCode, packageName: usage.packageName }
      : null,
  });
}
